<?php

namespace App\Http\Controllers;

use App\Services\CardStatisticsService;
use App\Services\UserLeaderboardService;
use Illuminate\View\View;

class DashboardController extends Controller
{
    /**
     * Show the dashboard view.
     *
     * @param CardStatisticsService $cardStatisticsService
     * @param UserLeaderboardService $userLeaderboardService
     * @return View
     */
    public function index(CardStatisticsService $cardStatisticsService, UserLeaderboardService $userLeaderboardService): View
    {
        $cardStatistics = $cardStatisticsService->getCardStatistics();
        $leaderboard = $userLeaderboardService->getLeaderboard();

        return view('dashboard', [
            'cardStatistics' => $cardStatistics,
            'leaderboard' => $leaderboard,
        ]);
    }
}
