<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameResultController extends Controller
{
    private const WIN_EXPERIENCE_REWARD = 50;
    private const WIN_CREDITS_REWARD = 100;
    private const WIN_RANK_SCORE_REWARD = 5;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'outcome' => ['required', 'string', 'in:win,loss'],
            'stats' => ['nullable', 'array'],
            'stats.time_elapsed_seconds' => ['nullable', 'integer', 'min:0'],
            'stats.energy_generated' => ['nullable', 'integer', 'min:0'],
            'stats.download_speed' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = $request->user();
        $reward = $this->rewardForOutcome($validated['outcome']);

        $user->experience_points = ($user->experience_points ?? 0) + $reward['experience'];
        $user->credits = ($user->credits ?? 0) + $reward['credits'];
        $user->rank_score = ($user->rank_score ?? 0) + $reward['rank_score'];
        $user->save();

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
     */
    private function rewardForOutcome(string $outcome): array
    {
        $multiplier = $outcome === 'win' ? 1 : 0.5;

        return [
            'experience' => (int) floor(self::WIN_EXPERIENCE_REWARD * $multiplier),
            'credits' => (int) floor(self::WIN_CREDITS_REWARD * $multiplier),
            'rank_score' => (int) floor(self::WIN_RANK_SCORE_REWARD * $multiplier),
        ];
    }
}
