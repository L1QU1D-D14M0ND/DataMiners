<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameResultController extends Controller
{
    private const WIN_EXPERIENCE_REWARD = 50;
    private const WIN_CREDITS_REWARD = 100;
    private const WIN_RANK_SCORE_REWARD = 5;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game_session_id' => ['required', 'integer', 'exists:game_sessions,id'],
            'outcome' => ['required', 'string', 'in:win,loss'],
            'stats' => ['nullable', 'array'],
            'stats.time_elapsed_seconds' => ['nullable', 'integer', 'min:0'],
            'stats.energy_generated' => ['nullable', 'integer', 'min:0'],
            'stats.download_speed' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        // Validate the session exists, belongs to the user, and is completed
        $session = GameSession::where('id', $validated['game_session_id'])
            ->where('status', 'completed')
            ->where(function ($query) use ($user) {
                $query->where('player1_id', $user->id)
                    ->orWhere('player2_id', $user->id);
            })
            ->lockForUpdate()
            ->first();

        if (!$session) {
            return response()->json(['error' => 'Invalid game session or session not completed'], 404);
        }

        // Check if rewards already granted for this session
        if ($session->rewarded) {
            return response()->json(['error' => 'Rewards already granted for this session'], 400);
        }

        $reward = $this->rewardForOutcome($validated['outcome']);

        DB::transaction(function () use ($user, $reward, $session) {
            $user->experience_points = ($user->experience_points ?? 0) + $reward['experience'];
            $user->credits = ($user->credits ?? 0) + $reward['credits'];
            $user->rank_score = ($user->rank_score ?? 0) + $reward['rank_score'];
            $user->save();

            // Mark session as rewarded to prevent duplicate rewards
            $session->rewarded = true;
            $session->save();
        });

        return response()->json([
            'success' => true,
            'outcome' => $validated['outcome'],
            'reward' => $reward,
            'user' => [
                'id' => $user->id,
                'experience_points' => $user->experience_points,
                'credits' => $user->credits,
                'rank_score' => $user->rank_score,
            ],
        ]);
    }

    /**
     * Loss rewards are rounded down because user rank_score is an integer column.
     * Losses decrease rank score to make it a meaningful competitive metric.
     */
    private function rewardForOutcome(string $outcome): array
    {
        $multiplier = $outcome === 'win' ? 1 : -0.5;

        return [
            'experience' => (int) floor(self::WIN_EXPERIENCE_REWARD * $multiplier),
            'credits' => (int) floor(self::WIN_CREDITS_REWARD * $multiplier),
            'rank_score' => (int) floor(self::WIN_RANK_SCORE_REWARD * $multiplier),
        ];
    }
}
