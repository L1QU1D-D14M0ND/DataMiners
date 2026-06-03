<?php

namespace App\Services;

use App\Models\User;
use App\Models\GameLog;
use Illuminate\Support\Facades\DB;

class UserLeaderboardService
{
    /**
     * Get the user leaderboard.
     *
     * @return array
     */
    public function getLeaderboard(): array
    {
        $users = User::with(['role'])
            ->select('users.*')
            ->leftJoin('game_logs as games_a', 'users.id', '=', 'games_a.user_a')
            ->leftJoin('game_logs as games_b', 'users.id', '=', 'games_b.user_b')
            ->selectRaw('users.*, 
                COUNT(DISTINCT CASE WHEN games_a.id IS NOT NULL THEN games_a.id END) + 
                COUNT(DISTINCT CASE WHEN games_b.id IS NOT NULL THEN games_b.id END) as total_games,
                COUNT(DISTINCT CASE WHEN games_a.winner = users.id THEN games_a.id END) + 
                COUNT(DISTINCT CASE WHEN games_b.winner = users.id THEN games_b.id END) as total_wins')
            ->groupBy('users.id')
            ->orderByDesc('rank_score')
            ->limit(50)
            ->get();

        $leaderboard = [];

        foreach ($users as $index => $user) {
            $winRate = $user->total_games > 0 
                ? round(($user->total_wins / $user->total_games) * 100, 2) 
                : 0;

            $leaderboard[] = [
                'rank' => $index + 1,
                'user_id' => $user->id,
                'name' => $user->name,
                'rank_score' => $user->rank_score,
                'experience_points' => $user->experience_points,
                'credits' => $user->credits,
                'play_time' => $user->play_time,
                'total_games' => $user->total_games ?? 0,
                'total_wins' => $user->total_wins ?? 0,
                'win_rate' => $winRate,
                'role' => $user->role ? $user->role->name : 'N/A',
            ];
        }

        return $leaderboard;
    }
}
