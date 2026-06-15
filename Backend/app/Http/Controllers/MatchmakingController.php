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
            'experience_points' => $user->experience_points ?? 0,
            'preferences' => $request->preferences,
            'status' => 'waiting',
            'expires_at' => $expiresAt,
        ]);

        if ($this->colosseum->isEnabled()) {
            $remoteResult = $this->colosseum->addToQueue($queue->queue_name, $user->id, $queue->skill_rating, $queue->experience_points, $queue->preferences ?? []);
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
            'experience_points' => $queue->experience_points,
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
            $matchData = $this->getMatchDataFromRedis($matchedQueue);
            if ($matchData) {
                return response()->json([
                    'in_queue' => false,
                    'matched' => true,
                    'match_data' => $matchData,
                ]);
            }
        }

        $matchData = $this->getMatchDataFromRedis($queue, true);
        if ($matchData) {
            return response()->json([
                'in_queue' => false,
                'matched' => true,
                'match_data' => $matchData,
            ]);
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
     * @deprecated This endpoint is only used for local testing when Colosseum is disabled.
     *             Use the automatic matchmaking via joinQueue/getQueueStatus instead.
     *             Scheduled for removal in future version.
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
        $baseSkillRange = config('matchmaking.skill_range', 100);
        $baseExperienceRange = config('matchmaking.experience_range', 500);
        $skillRangeExpansion = config('matchmaking.skill_range_expansion', 50);
        $experienceRangeExpansion = config('matchmaking.experience_range_expansion', 250);
        $maxSkillRange = config('matchmaking.max_skill_range', 500);
        $maxExperienceRange = config('matchmaking.max_experience_range', 2000);
        $maxWaitTime = config('matchmaking.max_wait_time', 60);
        $expansionIntervalSeconds = 5; // Expansion occurs every 5 seconds

        $matches = [];

        // Use database transaction with pessimistic locking to prevent race conditions
        DB::transaction(function () use ($queueName, $baseSkillRange, $baseExperienceRange, $skillRangeExpansion, $experienceRangeExpansion, $maxSkillRange, $maxExperienceRange, $maxWaitTime, $expansionIntervalSeconds, &$matches) {
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

                // Calculate expanded ranges based on wait time
                $waitSeconds = now()->diffInSeconds($queue->created_at);
                $expansionSteps = floor($waitSeconds / $expansionIntervalSeconds);
                
                $queueSkillRange = min($maxSkillRange, $baseSkillRange + ($skillRangeExpansion * $expansionSteps));
                $queueExperienceRange = min($maxExperienceRange, $baseExperienceRange + ($experienceRangeExpansion * $expansionSteps));

                // Find opponents within skill and experience ranges
                $opponents = $queues->filter(function ($q) use ($queue, $queueSkillRange, $queueExperienceRange, $processedIds, $expansionIntervalSeconds, $maxSkillRange, $baseSkillRange, $skillRangeExpansion, $maxExperienceRange, $baseExperienceRange, $experienceRangeExpansion) {
                    [$opponentSkillRange, $opponentExperienceRange] = $this->calculateOpponentRanges($q, $expansionIntervalSeconds, $maxSkillRange, $baseSkillRange, $skillRangeExpansion, $maxExperienceRange, $baseExperienceRange, $experienceRangeExpansion);
                    
                    // Use the maximum of both ranges for matching
                    $effectiveSkillRange = max($queueSkillRange, $opponentSkillRange);
                    $effectiveExperienceRange = max($queueExperienceRange, $opponentExperienceRange);

                    return $q->id !== $queue->id
                        && !in_array($q->id, $processedIds)
                        && abs($q->skill_rating - $queue->skill_rating) <= $effectiveSkillRange
                        && abs($q->experience_points - $queue->experience_points) <= $effectiveExperienceRange;
                })->take(1); // 1v1 for now, can be increased

                if ($opponent = $opponents->first()) {
                    $matchId = uniqid('match_');

                    try {
                        // Create game session in database
                        $gameSession = GameSession::create([
                            'match_id' => $matchId,
                            'is_matchmade' => true,
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
                                ['user_id' => $queue->user_id, 'skill_rating' => $queue->skill_rating, 'experience_points' => $queue->experience_points],
                                ['user_id' => $opponent->user_id, 'skill_rating' => $opponent->skill_rating, 'experience_points' => $opponent->experience_points],
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
        $statusValue = $status['status'] ?? 'waiting';
        $queueStatus = [
            'in_queue' => $statusValue === 'waiting',
            'matched' => $statusValue === 'matched',
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
            $playerIds = collect($players)
                ->map(fn ($player) => $player['user_id'] ?? null)
                ->filter()
                ->values()
                ->all();
            if (count($playerIds) >= 2) {
                $gameSession = GameSession::create([
                    'match_id' => $matchId,
                    'is_matchmade' => true,
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
            'players' => collect($players)
                ->map(fn ($player) => [
                    'user_id' => (int) ($player['user_id'] ?? 0),
                    'skill_rating' => $player['skill_rating'] ?? null,
                ])
                ->values()
                ->all(),
            'created_at' => $createdAt,
        ];
    }

    /**
     * Calculate opponent's expanded skill and experience ranges based on wait time
     */
    private function calculateOpponentRanges(MatchmakingQueue $opponentQueue, int $expansionIntervalSeconds, int $maxSkillRange, int $baseSkillRange, int $skillRangeExpansion, int $maxExperienceRange, int $baseExperienceRange, int $experienceRangeExpansion): array
    {
        $opponentWaitSeconds = now()->diffInSeconds($opponentQueue->created_at);
        $opponentExpansionSteps = floor($opponentWaitSeconds / $expansionIntervalSeconds);
        
        $opponentSkillRange = min($maxSkillRange, $baseSkillRange + ($skillRangeExpansion * $opponentExpansionSteps));
        $opponentExperienceRange = min($maxExperienceRange, $baseExperienceRange + ($experienceRangeExpansion * $opponentExpansionSteps));
        
        return [$opponentSkillRange, $opponentExperienceRange];
    }

    /**
     * Get match data from Redis for a given queue
     */
    private function getMatchDataFromRedis(MatchmakingQueue $queue, bool $updateStatus = false): ?array
    {
        try {
            $matchData = Redis::get("match:{$queue->id}");
        } catch (\Exception $e) {
            Log::error('Redis error fetching match data', [
                'queue_id' => $queue->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }

        if (!$matchData) {
            return null;
        }

        $match = json_decode($matchData, true);
        if ($match === null) {
            Log::error('Failed to decode match data from Redis', [
                'queue_id' => $queue->id,
                'raw_data' => $matchData,
            ]);
            return null;
        }

        if ($updateStatus) {
            $queue->update(['status' => 'matched', 'matched_at' => now()]);
        }

        try {
            $this->removeFromRedisQueue($queue);
        } catch (\Exception $e) {
            Log::error('Failed to remove matched queue from Redis', [
                'queue_id' => $queue->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $match;
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
            'experience_points' => $queue->experience_points,
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
