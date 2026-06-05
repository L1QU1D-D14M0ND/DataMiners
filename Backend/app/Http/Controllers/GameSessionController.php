<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Models\CardUsageLog;
use App\Events\GameStateChanged;
use App\Events\CardUsed;
use App\Events\MatchEnded;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GameSessionController extends Controller
{
    /**
     * Create a new game session when a match is found
     */
    public function createSession(Request $request): JsonResponse
    {
        $request->validate([
            'match_id' => 'required|string|unique:game_sessions,match_id',
            'player1_id' => 'required|exists:users,id',
            'player2_id' => 'required|exists:users,id|different:player1_id',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $userId = $user->id;
        if ($userId !== (int) $request->player1_id && $userId !== (int) $request->player2_id) {
            return response()->json(['error' => 'You must be a participant in the match'], 403);
        }

        $session = GameSession::create([
            'match_id' => $request->match_id,
            'player1_id' => $request->player1_id,
            'player2_id' => $request->player2_id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        return response()->json([
            'session_id' => $session->id,
            'match_id' => $session->match_id,
            'status' => $session->status,
        ]);
    }

    /**
     * Update player's game state (download speed, energy, etc.)
     */
    public function updateState(Request $request, string $matchId): JsonResponse
    {
        $request->validate([
            'download_speed' => 'required|numeric|min:0',
            'energy_generated' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        $state = [
            'download_speed' => $request->download_speed,
            'energy_generated' => $request->energy_generated,
            'updated_at' => now()->toISOString(),
        ];

        $session->updatePlayerState($user->id, $state);

        // Broadcast the state change to the opponent
        try {
            broadcast(new GameStateChanged(
                $matchId,
                $user->id,
                $request->download_speed,
                $request->energy_generated
            ));
        } catch (\Exception $e) {
            Log::error('Failed to broadcast game state change', [
                'match_id' => $matchId,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['message' => 'State updated successfully']);
    }

    /**
     * Report card usage
     */
    public function reportCardUsage(Request $request, string $matchId): JsonResponse
    {
        $request->validate([
            'card_id' => 'required|string',
            'card_name' => 'required|string',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        // Log the card usage
        CardUsageLog::create([
            'game_session_id' => $session->id,
            'user_id' => $user->id,
            'card_id' => $request->card_id,
            'card_name' => $request->card_name,
            'used_at' => now(),
        ]);

        // Broadcast the card usage to the opponent
        try {
            broadcast(new CardUsed(
                $matchId,
                $user->id,
                $request->card_id,
                $request->card_name
            ));
        } catch (\Exception $e) {
            Log::error('Failed to broadcast card usage', [
                'match_id' => $matchId,
                'user_id' => $user->id,
                'card_id' => $request->card_id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['message' => 'Card usage reported successfully']);
    }

    /**
     * Get current match state
     */
    public function getState(string $matchId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        $opponentState = $session->getOpponentState($user->id);

        return response()->json([
            'match_id' => $session->match_id,
            'opponent_state' => $opponentState,
            'status' => $session->status,
        ]);
    }

    /**
     * End a game session
     */
    public function endSession(Request $request, string $matchId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        $session->update([
            'status' => 'completed',
            'ended_at' => now(),
        ]);

        return response()->json(['message' => 'Session ended successfully']);
    }

    /**
     * Concede a match (player leaves early)
     */
    public function concede(Request $request, string $matchId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        // Mark the session as completed with the conceding player as loser
        $winnerId = ($session->player1_id === $user->id) ? $session->player2_id : $session->player1_id;

        $session->update([
            'status' => 'completed',
            'winner_id' => $winnerId,
            'ended_at' => now(),
        ]);

        // Broadcast match ended event
        try {
            broadcast(new MatchEnded($matchId, $winnerId, $user->id));
        } catch (\Exception $e) {
            Log::error('Failed to broadcast match conceded event', [
                'match_id' => $matchId,
                'winner_id' => $winnerId,
                'loser_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['message' => 'Match conceded successfully']);
    }

    /**
     * Report match end (when a player wins)
     */
    public function reportMatchEnd(Request $request, string $matchId): JsonResponse
    {
        Log::info('GameSession.reportMatchEnd called', [
            'match_id' => $matchId,
            'payload' => $request->all(),
            'reporting_user' => Auth::id(),
        ]);

        $request->validate([
            'winner_id' => 'required|exists:users,id',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            // Session might already be completed (e.g., by opponent conceding)
            $completedSession = GameSession::byMatch($matchId)->completed()->forPlayer($user->id)->first();
            if ($completedSession) {
                return response()->json(['message' => 'Match already ended']);
            }
            return response()->json(['error' => 'Session not found'], 404);
        }

        $winnerId = (int) $request->winner_id;
        if ($winnerId !== $session->player1_id && $winnerId !== $session->player2_id) {
            return response()->json(['error' => 'Winner must be a participant'], 422);
        }

        // Server-side validation: determine winner based on game state if available
        // If both players have state, compare metrics to determine actual winner
        $serverDeterminedWinner = $this->determineWinnerFromState($session);
        if ($serverDeterminedWinner !== null && $serverDeterminedWinner !== $winnerId) {
            Log::warning('Reported winner does not match server-determined winner', [
                'match_id' => $matchId,
                'reported_winner' => $winnerId,
                'server_determined_winner' => $serverDeterminedWinner,
                'reporting_user' => $user->id,
            ]);
            return response()->json(['error' => 'Winner does not match game state'], 422);
        }

        $loserId = ($winnerId === $session->player1_id) ? $session->player2_id : $session->player1_id;

        $session->update([
            'status' => 'completed',
            'winner_id' => $winnerId,
            'ended_at' => now(),
        ]);

        try {
            broadcast(new MatchEnded($matchId, $winnerId, $loserId));
        } catch (\Exception $e) {
            Log::error('Failed to broadcast match ended event', [
                'match_id' => $matchId,
                'winner_id' => $winnerId,
                'loser_id' => $loserId,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['message' => 'Match end reported successfully']);
    }

    /**
     * Determine winner from game state based on metrics
     * Returns null if state is insufficient to determine winner
     */
    private function determineWinnerFromState(GameSession $session): ?int
    {
        $player1State = $session->player1_state;
        $player2State = $session->player2_state;

        // If both players have state, compare metrics
        if ($player1State && $player2State) {
            $p1Energy = $player1State['energy_generated'] ?? 0;
            $p2Energy = $player2State['energy_generated'] ?? 0;
            $p1Speed = $player1State['download_speed'] ?? 0;
            $p2Speed = $player2State['download_speed'] ?? 0;

            // Simple heuristic: higher energy and speed wins
            // This can be refined based on actual game rules
            $p1Score = $p1Energy + ($p1Speed * 10);
            $p2Score = $p2Energy + ($p2Speed * 10);

            if ($p1Score > $p2Score) {
                return $session->player1_id;
            } elseif ($p2Score > $p1Score) {
                return $session->player2_id;
            }
        }

        return null; // Cannot determine from state, trust client report
    }
}
