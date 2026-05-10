<?php

namespace App\Http\Controllers;

use App\Services\CardStatisticsService;
use Illuminate\View\View;

class DashboardController extends Controller
{
    /**
     * Show the dashboard view.
     *
     * @param CardStatisticsService $cardStatisticsService
     * @return View
     */
    public function index(CardStatisticsService $cardStatisticsService): View
    {
        $cardStatistics = $cardStatisticsService->getCardStatistics();

        return view('dashboard', [
            'cardStatistics' => $cardStatistics,
        ]);
    }
}
