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
        broadcast(new GameStateChanged(
            $matchId,
            $user->id,
            $request->download_speed,
            $request->energy_generated
        ));

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
        broadcast(new CardUsed(
            $matchId,
            $user->id,
            $request->card_id,
            $request->card_name
        ));

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
        broadcast(new MatchEnded($matchId, $winnerId, $user->id));

        return response()->json(['message' => 'Match conceded successfully']);
    }

    /**
     * Report match end (when a player wins)
     */
    public function reportMatchEnd(Request $request, string $matchId): JsonResponse
    {
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

        // Determine the loser
        $loserId = ($session->player1_id === $user->id) ? $session->player2_id : $session->player1_id;

        // Mark the session as completed
        $session->update([
            'status' => 'completed',
            'winner_id' => $user->id,
            'ended_at' => now(),
        ]);

        // Broadcast match ended event to both players
        broadcast(new MatchEnded($matchId, $user->id, $loserId));

        return response()->json(['message' => 'Match end reported successfully']);
    }
}
