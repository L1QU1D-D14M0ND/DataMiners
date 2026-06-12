<?php

namespace App\Http\Controllers;

use App\Models\MatchmakingQueue;
use App\Models\GameSession;
use App\Services\ColosseumService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class MatchmakingController extends Controller
{
    private ColosseumService $colosseum;

    public function __construct(ColosseumService $colosseum)
    {
        $this->colosseum = $colosseum;
    }

    /**
     * Join a matchmaking queue
     */
    public function joinQueue(Request $request): JsonResponse
    {
        $request->validate([
            'queue_name' => 'required|string|max:50',
            'skill_rating' => 'nullable|integer|min:0',
            'preferences' => 'nullable|array',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Remove any existing queue entries for this user
        MatchmakingQueue::where('user_id', $user->id)
            ->where('status', 'waiting')
            ->update(['status' => 'cancelled']);

        $ttl = config('matchmaking.queue_ttl', 300);
        $expiresAt = now()->addSeconds($ttl);

        $queue = MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => $request->queue_name,
            'skill_rating' => $request->skill_rating ?? $user->rank_score ?? 1000,
            'preferences' => $request->preferences,
            'status' => 'waiting',
            'expires_at' => $expiresAt,
        ]);

        if ($this->colosseum->isEnabled()) {
            $remoteResult = $this->colosseum->addToQueue($queue->queue_name, $user->id, $queue->skill_rating, $queue->preferences ?? []);
            if ($remoteResult === null) {
                $queue->update(['status' => 'cancelled']);
                return response()->json(['error' => 'Failed to join external matchmaking queue'], 503);
            }
        } else {
            try {
                $this->addToRedisQueue($queue);
            } catch (\Exception $e) {
                Log::error('Failed to add player to Redis queue', [
                    'queue_id' => $queue->id,
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'queue_id' => $queue->id,
            'queue_name' => $queue->queue_name,
            'skill_rating' => $queue->skill_rating,
            'expires_at' => $queue->expires_at,
        ]);
    }

    /**
     * Leave the matchmaking queue
     */
    public function leaveQueue(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $queue = MatchmakingQueue::where('user_id', $user->id)
            ->where('status', 'waiting')
            ->first();

        if ($queue) {
            $queue->update(['status' => 'cancelled']);

            if ($this->colosseum->isEnabled()) {
                try {
                    $this->colosseum->removeFromQueue($queue->queue_name, $user->id);
                } catch (\Exception $e) {
                    Log::error('Failed to remove player from Colosseum queue', [
                        'queue_id' => $queue->id,
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            } else {
                try {
                    $this->removeFromRedisQueue($queue);
                } catch (\Exception $e) {
                    Log::error('Failed to remove player from Redis queue', [
                        'queue_id' => $queue->id,
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Left queue successfully']);
    }

    /**
     * Get current queue status
     */
    public function getQueueStatus(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $queue = MatchmakingQueue::where('user_id', $user->id)
            ->whereIn('status', ['waiting', 'matched'])
            ->where('expires_at', '>', now())
            ->first();

        if (!$queue) {
            return response()->json(['in_queue' => false]);
        }

        if ($this->colosseum->isEnabled()) {
            $status = $this->colosseum->getPlayerStatus($queue->queue_name, $user->id);

            if ($status === null) {
                return response()->json([
                    'in_queue' => true,
                    'queue_id' => $queue->id,
                    'queue_name' => $queue->queue_name,
                    'skill_rating' => $queue->skill_rating,
                    'expires_at' => $queue->expires_at,
                    'time_in_queue' => now()->diffInSeconds($queue->created_at),
                ]);
            }

            if (($status['status'] ?? '') === 'matched') {
                $queue->update(['status' => 'matched', 'matched_at' => now()]);
            }

            $queueStatus = $this->buildColosseumQueueStatus($status, $queue);

            return response()->json($queueStatus);
        }

        // Local matchmaking fallback
        $matchedQueue = MatchmakingQueue::where('user_id', $user->id)
            ->where('status', 'matched')
            ->where('matched_at', '>', now()->subMinutes(5))
            ->first();

        if ($matchedQueue) {
            try {
                $matchData = Redis::get("match:{$matchedQueue->id}");
            } catch (\Exception $e) {
                Log::error('Redis error fetching match data for matched queue', [
                    'queue_id' => $matchedQueue->id,
                    'error' => $e->getMessage(),
                ]);
                $matchData = null;
            }
            if ($matchData) {
                $match = json_decode($matchData, true);
                if ($match === null) {
                    Log::error('Failed to decode match data from Redis', [
                        'queue_id' => $matchedQueue->id,
                        'raw_data' => $matchData,
                    ]);
                } else {
                    try {
                        $this->removeFromRedisQueue($matchedQueue);
                    } catch (\Exception $e) {
                        Log::error('Failed to remove matched queue from Redis', [
                            'queue_id' => $matchedQueue->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                    return response()->json([
                        'in_queue' => false,
                        'matched' => true,
                        'match_data' => $match,
                    ]);
                }
            }
        }

        try {
            $matchData = Redis::get("match:{$queue->id}");
        } catch (\Exception $e) {
            Log::error('Redis error fetching match data', [
                'queue_id' => $queue->id,
                'error' => $e->getMessage(),
            ]);
            $matchData = null;
        }
        if ($matchData) {
            $match = json_decode($matchData, true);
            if ($match === null) {
                Log::error('Failed to decode match data from Redis', [
                    'queue_id' => $queue->id,
                    'raw_data' => $matchData,
                ]);
            } else {
                $queue->update(['status' => 'matched', 'matched_at' => now()]);
                try {
                    $this->removeFromRedisQueue($queue);
                } catch (\Exception $e) {
                    Log::error('Failed to remove matched queue from Redis', [
                        'queue_id' => $queue->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                return response()->json([
                    'in_queue' => false,
                    'matched' => true,
                    'match_data' => $match,
                ]);
            }
        }

        // If queue is matched, check for match data in Redis
        if ($queue->status === 'matched') {
            try {
                $matchData = Redis::get("match:{$queue->id}");
            } catch (\Exception $e) {
                Log::error('Redis error fetching match data for matched queue', [
                    'queue_id' => $queue->id,
                    'error' => $e->getMessage(),
                ]);
                $matchData = null;
            }
            if ($matchData) {
                $match = json_decode($matchData, true);
                if ($match === null) {
                    Log::error('Failed to decode match data from Redis', [
                        'queue_id' => $queue->id,
                        'raw_data' => $matchData,
                    ]);
                } else {
                    try {
                        $this->removeFromRedisQueue($queue);
                    } catch (\Exception $e) {
                        Log::error('Failed to remove matched queue from Redis', [
                            'queue_id' => $queue->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                    return response()->json([
                        'in_queue' => false,
                        'matched' => true,
                        'match_data' => $match,
                    ]);
                }
            }
        }

        // Only perform matchmaking if queue is still waiting
        if ($queue->status === 'waiting') {
            $this->performMatchmaking($queue->queue_name);
        }

        return response()->json([
            'in_queue' => $queue->status === 'waiting',
            'matched' => $queue->status === 'matched',
            'queue_id' => $queue->id,
            'queue_name' => $queue->queue_name,
            'skill_rating' => $queue->skill_rating,
            'expires_at' => $queue->expires_at,
            'time_in_queue' => now()->diffInSeconds($queue->created_at),
        ]);
    }

    /**
     * Find matches for a queue (HTTP route handler)
     */
    public function findMatches(Request $request): JsonResponse
    {
        $request->validate([
            'queue_name' => 'required|string|max:50',
        ]);

        if ($this->colosseum->isEnabled()) {
            return response()->json(['matches' => []]);
        }

        $matches = $this->performMatchmaking($request->queue_name);

        return response()->json(['matches' => $matches]);
    }

    /**
     * Perform matchmaking logic for a given queue
     */
    private function performMatchmaking(string $queueName): array
    {
        $skillRange = config('matchmaking.skill_range', 100);
        $maxWaitTime = config('matchmaking.max_wait_time', 60);

        $matches = [];

        // Use database transaction with pessimistic locking to prevent race conditions
        DB::transaction(function () use ($queueName, $skillRange, $maxWaitTime, &$matches) {
            $queues = MatchmakingQueue::active()
                ->byQueue($queueName)
                ->where('created_at', '>=', now()->subSeconds($maxWaitTime))
                ->orderBy('skill_rating')
                ->lockForUpdate()
                ->get();

            $processedIds = [];

            foreach ($queues as $queue) {
                if (in_array($queue->id, $processedIds)) {
                    continue;
                }

                // Find opponents within skill range
                $opponents = $queues->filter(function ($q) use ($queue, $skillRange, $processedIds) {
                    return $q->id !== $queue->id
                        && !in_array($q->id, $processedIds)
                        && abs($q->skill_rating - $queue->skill_rating) <= $skillRange;
                })->take(1); // 1v1 for now, can be increased

                if ($opponents->count() > 0) {
                    $opponent = $opponents->first();
                    $matchId = uniqid('match_');

                    try {
                        // Create game session in database
                        $gameSession = GameSession::create([
                            'match_id' => $matchId,
                            'player1_id' => $queue->user_id,
                            'player2_id' => $opponent->user_id,
                            'status' => 'active',
                            'started_at' => now(),
                        ]);

                        // Create match data
                        $matchData = [
                            'match_id' => $matchId,
                            'game_session_id' => $gameSession->id,
                            'queue_name' => $queueName,
                            'players' => [
                                ['user_id' => $queue->user_id, 'skill_rating' => $queue->skill_rating],
                                ['user_id' => $opponent->user_id, 'skill_rating' => $opponent->skill_rating],
                            ],
                            'created_at' => now()->toISOString(),
                        ];

                        // Store match in Redis for both players
                        Redis::setex("match:{$queue->id}", 3600, json_encode($matchData));
                        Redis::setex("match:{$opponent->id}", 3600, json_encode($matchData));

                        // Mark as matched
                        $queue->update(['status' => 'matched', 'matched_at' => now()]);
                        $opponent->update(['status' => 'matched', 'matched_at' => now()]);

                        $processedIds[] = $queue->id;
                        $processedIds[] = $opponent->id;

                        $matches[] = $matchData;
                    } catch (\Exception $e) {
                        Log::error('Failed to create match', [
                            'match_id' => $matchId,
                            'player1' => $queue->user_id,
                            'player2' => $opponent->user_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        });

        return $matches;
    }

    private function buildColosseumQueueStatus(array $status, MatchmakingQueue $queue): array
    {
        $queueStatus = [
            'in_queue' => ($status['status'] ?? 'waiting') === 'waiting',
            'matched' => ($status['status'] ?? '') === 'matched',
            'queue_id' => $queue->id,
            'queue_name' => $queue->queue_name,
            'skill_rating' => $queue->skill_rating,
            'expires_at' => $queue->expires_at?->toISOString(),
            'time_in_queue' => $status['time_in_queue'] ?? now()->diffInSeconds($queue->created_at),
        ];

        if ($queueStatus['matched']) {
            $matchData = $this->extractMatchDataFromColosseumStatus($status, $queue);
            if ($matchData !== null) {
                $queueStatus['match_data'] = $matchData;
                $queueStatus['in_queue'] = false;
            }
        }

        return $queueStatus;
    }

    private function extractMatchDataFromColosseumStatus(array $status, MatchmakingQueue $queue): ?array
    {
        $matchPayload = $status['match_data'] ?? $status['match'] ?? null;
        $matchId = $matchPayload['match_id'] ?? $status['match_id'] ?? null;

        if (!$matchId) {
            return null;
        }

        $players = $matchPayload['players'] ?? $status['players'] ?? null;
        if (!is_array($players)) {
            if (isset($status['player1_id'], $status['player2_id'])) {
                $players = [
                    ['user_id' => (int) $status['player1_id'], 'skill_rating' => $status['player1_skill_rating'] ?? null],
                    ['user_id' => (int) $status['player2_id'], 'skill_rating' => $status['player2_skill_rating'] ?? null],
                ];
            }
        }

        if (!is_array($players) || count($players) < 2) {
            return null;
        }

        $createdAt = $matchPayload['created_at'] ?? $status['created_at'] ?? now()->toISOString();

        $gameSession = GameSession::byMatch($matchId)->first();
        if (!$gameSession) {
            $playerIds = array_values(array_filter(array_map(fn ($player) => $player['user_id'] ?? null, $players)));
            if (count($playerIds) >= 2) {
                $gameSession = GameSession::create([
                    'match_id' => $matchId,
                    'player1_id' => $playerIds[0],
                    'player2_id' => $playerIds[1],
                    'status' => 'active',
                    'started_at' => now(),
                ]);
            }
        }

        return [
            'match_id' => $matchId,
            'game_session_id' => $gameSession?->id,
            'queue_name' => $queue->queue_name,
            'players' => array_values(array_map(fn ($player) => [
                'user_id' => (int) ($player['user_id'] ?? 0),
                'skill_rating' => $player['skill_rating'] ?? null,
            ], $players)),
            'created_at' => $createdAt,
        ];
    }

    /**
     * Add queue to Redis for fast access
     */
    private function addToRedisQueue(MatchmakingQueue $queue): void
    {
        $key = "queue:{$queue->queue_name}";
        $data = [
            'queue_id' => $queue->id,
            'user_id' => $queue->user_id,
            'skill_rating' => $queue->skill_rating,
            'created_at' => $queue->created_at->toISOString(),
        ];

        Redis::zadd($key, $queue->skill_rating, json_encode($data));
        Redis::expire($key, config('matchmaking.queue_ttl', 300));
    }

    /**
     * Remove queue from Redis
     */
    private function removeFromRedisQueue(MatchmakingQueue $queue): void
    {
        $key = "queue:{$queue->queue_name}";
        $data = json_encode([
            'queue_id' => $queue->id,
            'user_id' => $queue->user_id,
            'skill_rating' => $queue->skill_rating,
            'created_at' => $queue->created_at->toISOString(),
        ]);

        Redis::zrem($key, $data);
    }
}
