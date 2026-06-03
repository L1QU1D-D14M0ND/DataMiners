<?php

namespace App\Services;

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
        $this->apiKey = config('matchmaking.colosseum.api_key', '');
        $this->apiUrl = config('matchmaking.colosseum.api_url', 'https://api.colosseum.gg');
        $this->timeout = config('matchmaking.colosseum.timeout', 30);
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
        // Validate webhook signature if needed
        // Process match notifications
        // Update local database with match results

        Log::info('Colosseum webhook received', ['payload' => $payload]);

        // TODO: Implement webhook processing logic
        // - Extract match ID
        // - Update matchmaking queue status
        // - Notify players via WebSocket or polling
        // - Create match record in database

        return true;
    }
}
