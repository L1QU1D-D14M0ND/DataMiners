<?php

namespace App\Http\Controllers;

use App\Services\CardStatisticsService;
use App\Services\UserLeaderboardService;
use Illuminate\Http\RedirectResponse;
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

    /**
     * Redirect to frontend with authentication token.
     *
     * @return RedirectResponse
     */
    public function redirectToFrontend(): RedirectResponse
    {
        $user = auth()->user();
        
        // Create a token for the user
        $token = $user->createToken('frontend-auth')->plainTextToken;
        
        // Redirect to frontend with the token
        return redirect('http://localhost:3000?token=' . $token);
    }
}
