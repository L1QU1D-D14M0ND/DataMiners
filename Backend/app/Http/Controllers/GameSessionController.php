<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Models\CardUsageLog;
use App\Events\CardUsed;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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
     * Get match information including opponent profile
     */
    public function getMatchInfo(Request $request, string $matchId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        $opponentId = $session->getOpponentId($user->id);
        if (!$opponentId) {
            return response()->json(['error' => 'Opponent not found'], 404);
        }

        $opponent = \App\Models\User::find($opponentId);
        if (!$opponent) {
            return response()->json(['error' => 'Opponent user not found'], 404);
        }

        return response()->json([
            'match_id' => $session->match_id,
            'opponent' => [
                'id' => $opponent->id,
                'name' => $opponent->name,
                'email' => $opponent->email,
            ],
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

        // Clear cache for both players
        $opponentId = $session->getOpponentId($user->id);
        if ($opponentId) {
            Cache::forget("match_state:{$matchId}:user:{$opponentId}");
        }
        Cache::forget("match_state:{$matchId}:user:{$user->id}");

        // Emit WebSocket event for real-time opponent state update
        // This is handled by the simple Socket.io server
        // The frontend will send the opponent-state event directly to the WebSocket server

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

        // Try to get from cache first
        $cacheKey = "match_state:{$matchId}:user:{$user->id}";
        $cachedData = Cache::get($cacheKey);

        if ($cachedData !== null) {
            return response()->json($cachedData);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        $opponentState = $session->getOpponentState($user->id);

        $response = [
            'match_id' => $session->match_id,
            'opponent_state' => $opponentState,
            'status' => $session->status,
        ];

        // Cache for 5 seconds to reduce database load
        Cache::put($cacheKey, $response, 5);

        return response()->json($response);
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
        Log::info('GameSession.concede called', [
            'match_id' => $matchId,
            'user_id' => Auth::id(),
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = GameSession::byMatch($matchId)->active()->forPlayer($user->id)->first();
        if (!$session) {
            Log::warning('GameSession.concede: Session not found or not active', [
                'match_id' => $matchId,
                'user_id' => $user->id,
            ]);
            return response()->json(['error' => 'Session not found'], 404);
        }

        // Mark the session as completed with the conceding player as loser
        $winnerId = ($session->player1_id === $user->id) ? $session->player2_id : $session->player1_id;

        Log::info('GameSession.concede: Updating session', [
            'match_id' => $matchId,
            'session_id' => $session->id,
            'winner_id' => $winnerId,
            'loser_id' => $user->id,
        ]);

        try {
            $session->update([
                'status' => 'completed',
                'winner_id' => $winnerId,
                'ended_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('GameSession.concede: Failed to update session', [
                'match_id' => $matchId,
                'session_id' => $session->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to update session'], 500);
        }

        // Clear cache for both players
        Cache::forget("match_state:{$matchId}:user:{$session->player1_id}");
        Cache::forget("match_state:{$matchId}:user:{$session->player2_id}");

        // Broadcast match ended event via WebSocket server
        try {
            $this->broadcastMatchEndedViaWebSocket($matchId, $winnerId, $user->id);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast match conceded event via WebSocket', [
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
            'winner_id' => 'nullable|integer|exists:users,id',
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

        // If winner_id is not provided, default to the reporting user
        $winnerId = $request->winner_id ? (int) $request->winner_id : $user->id;
        
        // Validate that the winner is a participant in the match
        if ($winnerId !== $session->player1_id && $winnerId !== $session->player2_id) {
            Log::warning('Winner is not a participant in the match', [
                'match_id' => $matchId,
                'winner_id' => $winnerId,
                'player1_id' => $session->player1_id,
                'player2_id' => $session->player2_id,
            ]);
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

        // Clear cache for both players
        Cache::forget("match_state:{$matchId}:user:{$session->player1_id}");
        Cache::forget("match_state:{$matchId}:user:{$session->player2_id}");

        // Broadcast match ended event via WebSocket server directly
        try {
            $this->broadcastMatchEndedViaWebSocket($matchId, $winnerId, $loserId);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast match ended event via WebSocket', [
                'match_id' => $matchId,
                'winner_id' => $winnerId,
                'loser_id' => $loserId,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['message' => 'Match end reported successfully']);
    }

    /**
     * Broadcast match ended event via WebSocket server
     */
    private function broadcastMatchEndedViaWebSocket(string $matchId, int $winnerId, int $loserId): void
    {
        // Use the Socket.io server to broadcast the match ended event
        $socketServerUrl = config('app.socket_server_url', 'http://localhost:6001');
        
        try {
            Http::post("{$socketServerUrl}/broadcast-match-ended", [
                'matchId' => $matchId,
                'winnerId' => $winnerId,
                'loserId' => $loserId,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast match ended via WebSocket server', [
                'match_id' => $matchId,
                'error' => $e->getMessage(),
            ]);
        }
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
