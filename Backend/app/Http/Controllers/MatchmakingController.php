<?php

namespace App\Http\Controllers;

use App\Models\MatchmakingQueue;
use App\Models\GameSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class MatchmakingController extends Controller
{
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

        // Add to Redis for fast matchmaking
        try {
            $this->addToRedisQueue($queue);
        } catch (\Exception $e) {
            Log::error('Failed to add player to Redis queue', [
                'queue_id' => $queue->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
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

        Log::info("getQueueStatus called for user: {$user->id}");

        // First check for matched queues
        $matchedQueue = MatchmakingQueue::where('user_id', $user->id)
            ->where('status', 'matched')
            ->where('matched_at', '>', now()->subMinutes(5))
            ->first();

        if ($matchedQueue) {
            Log::info("Found matched queue for user: {$user->id}, queue_id: {$matchedQueue->id}");
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
                Log::info("Match data found in Redis for matched queue: {$matchedQueue->id}");
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

        $queue = MatchmakingQueue::where('user_id', $user->id)
            ->where('status', 'waiting')
            ->where('expires_at', '>', now())
            ->first();

        if (!$queue) {
            Log::info("No active queue found for user: {$user->id}");
            return response()->json(['in_queue' => false]);
        }

        Log::info("Found queue for user: {$user->id}, queue_id: {$queue->id}");

        // Check if matched via Redis
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
            Log::info("Match data found in Redis for queue: {$queue->id}");
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

        Log::info("No match data in Redis, triggering matchmaking for queue: {$queue->queue_name}");

        // Trigger matchmaking check
        $this->findMatches($queue->queue_name);

        return response()->json([
            'in_queue' => true,
            'queue_id' => $queue->id,
            'queue_name' => $queue->queue_name,
            'skill_rating' => $queue->skill_rating,
            'expires_at' => $queue->expires_at,
            'time_in_queue' => now()->diffInSeconds($queue->created_at),
        ]);
    }

    /**
     * Find matches for a queue (called by background job or Colosseum webhook)
     */
    public function findMatches(string $queueName): JsonResponse
    {
        $skillRange = config('matchmaking.skill_range', 100);
        $maxWaitTime = config('matchmaking.max_wait_time', 60);

        $queues = MatchmakingQueue::active()
            ->byQueue($queueName)
            ->where('created_at', '>=', now()->subSeconds($maxWaitTime))
            ->orderBy('skill_rating')
            ->get();

        Log::info("Finding matches for queue: {$queueName}, found " . $queues->count() . " queues");

        $matches = [];
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

            Log::info("Queue {$queue->id} (user {$queue->user_id}, skill {$queue->skill_rating}) found " . $opponents->count() . " opponents");

            if ($opponents->count() > 0) {
                $opponent = $opponents->first();
                $matchId = uniqid('match_');

                Log::info("Creating match {$matchId} between user {$queue->user_id} and user {$opponent->user_id}");

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

                    Log::info("Stored match data in Redis for queue IDs {$queue->id} and {$opponent->id}");

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

        Log::info("Found " . count($matches) . " matches");

        return response()->json(['matches' => $matches]);
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
