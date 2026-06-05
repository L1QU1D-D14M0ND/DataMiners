<?php

namespace App\Services;

use App\Events\MatchEnded;
use App\Models\GameSession;
use App\Models\MatchmakingQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ColosseumService
{
    private string $apiKey;
    private string $apiUrl;
    private int $timeout;
    private bool $enabled;

    public function __construct()
    {
        $this->enabled = config('matchmaking.colosseum.enabled', false);
        $this->apiKey = config('matchmaking.colosseum.api_key') ?? '';
        $this->apiUrl = config('matchmaking.colosseum.api_url', 'https://api.colosseum.gg') ?? 'https://api.colosseum.gg';
        $this->timeout = config('matchmaking.colosseum.timeout', 30) ?? 30;
    }

    /**
     * Check if Colosseum service is enabled and configured
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->apiKey);
    }

    /**
     * Add a player to a matchmaking queue
     */
    public function addToQueue(string $queueName, int $userId, int $skillRating, array $preferences = []): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/v1/queues/{$queueName}/players", [
                    'player_id' => (string) $userId,
                    'skill_rating' => $skillRating,
                    'preferences' => $preferences,
                    'metadata' => [
                        'joined_at' => now()->toISOString(),
                    ],
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Colosseum API error', [
                'action' => 'addToQueue',
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Colosseum service error', [
                'action' => 'addToQueue',
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Remove a player from a matchmaking queue
     */
    public function removeFromQueue(string $queueName, int $userId): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->delete("{$this->apiUrl}/v1/queues/{$queueName}/players/{$userId}");

            if (!$response->successful()) {
                Log::error('Colosseum API error', [
                    'action' => 'removeFromQueue',
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Colosseum service error', [
                'action' => 'removeFromQueue',
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get queue status for a player
     */
    public function getPlayerStatus(string $queueName, int $userId): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->get("{$this->apiUrl}/v1/queues/{$queueName}/players/{$userId}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Colosseum API error', [
                'action' => 'getPlayerStatus',
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Colosseum service error', [
                'action' => 'getPlayerStatus',
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Get queue information
     */
    public function getQueueInfo(string $queueName): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->get("{$this->apiUrl}/v1/queues/{$queueName}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Colosseum API error', [
                'action' => 'getQueueInfo',
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Colosseum service error', [
                'action' => 'getQueueInfo',
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Create a new queue
     */
    public function createQueue(string $queueName, array $config): ?array
    {
        if (!$this->isEnabled()) {
            return null;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/v1/queues", [
                    'name' => $queueName,
                    'config' => $config,
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Colosseum API error', [
                'action' => 'createQueue',
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Colosseum service error', [
                'action' => 'createQueue',
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Submit match results
     */
    public function submitMatchResult(string $matchId, array $results): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/v1/matches/{$matchId}/results", [
                    'results' => $results,
                    'submitted_at' => now()->toISOString(),
                ]);

            if (!$response->successful()) {
                Log::error('Colosseum API error', [
                    'action' => 'submitMatchResult',
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Colosseum service error', [
                'action' => 'submitMatchResult',
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Webhook handler for Colosseum match notifications
     */
    public function handleWebhook(array $payload): bool
    {
        $event = $payload['event'] ?? null;
        $matchId = $payload['match_id'] ?? null;

        Log::info('Colosseum webhook received', ['payload' => $payload]);

        if (empty($matchId)) {
            Log::warning('Colosseum webhook missing match_id', ['payload' => $payload]);
            return false;
        }

        $session = GameSession::byMatch($matchId)->first();

        if ($event === 'match_found') {
            $player1Id = isset($payload['player1_id']) ? (int) $payload['player1_id'] : null;
            $player2Id = isset($payload['player2_id']) ? (int) $payload['player2_id'] : null;

            if ($player1Id && $player2Id) {
                if (!$session) {
                    GameSession::create([
                        'match_id' => $matchId,
                        'player1_id' => $player1Id,
                        'player2_id' => $player2Id,
                        'status' => 'active',
                        'started_at' => now(),
                    ]);
                } else {
                    $session->update([
                        'status' => 'active',
                        'started_at' => $session->started_at ?? now(),
                    ]);
                }

                MatchmakingQueue::whereIn('user_id', [$player1Id, $player2Id])
                    ->where('status', 'waiting')
                    ->update([
                        'status' => 'matched',
                        'matched_at' => now(),
                    ]);
            }

            return true;
        }

        $winnerId = isset($payload['winner_id']) ? (int) $payload['winner_id'] : null;
        $status = $payload['status'] ?? null;

        if ($session && $session->status !== 'completed' && ($winnerId || $status === 'completed')) {
            $winnerId = $winnerId ?: $session->winner_id;

            if ($winnerId && in_array($winnerId, [$session->player1_id, $session->player2_id], true)) {
                $loserId = $session->player1_id === $winnerId ? $session->player2_id : $session->player1_id;

                $session->update([
                    'status' => 'completed',
                    'winner_id' => $winnerId,
                    'ended_at' => now(),
                ]);

                try {
                    broadcast(new MatchEnded($matchId, $winnerId, $loserId));
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast Colosseum webhook match ended event', [
                        'match_id' => $matchId,
                        'winner_id' => $winnerId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return true;
        }

        return true;
    }
}
