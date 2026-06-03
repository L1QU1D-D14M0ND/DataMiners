<?php

use App\Http\Controllers\Auth\SpaAuthenticationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CosmeticController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\GameResultController;
use App\Http\Controllers\GameSessionController;
use App\Http\Controllers\MatchmakingController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/spa/login', [SpaAuthenticationController::class, 'login'])->middleware('throttle:5,1')->name('spa.login');
Route::post('/spa/register', [SpaAuthenticationController::class, 'register'])->middleware('throttle:5,1')->name('spa.register');
Route::get('/spa/user', [SpaAuthenticationController::class, 'user'])->name('spa.user');
Route::post('/spa/logout', [SpaAuthenticationController::class, 'logout'])->name('spa.logout');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('dashboard');

Route::get('/dashboard/frontend', [DashboardController::class, 'redirectToFrontend'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('dashboard.frontend');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Profile API route
    Route::get('/api/profile', [UserController::class, 'profileApi'])->name('api.profile');

    // Game result API route
    Route::post('/api/game-results', [GameResultController::class, 'store'])->name('game-results.store');

    // Deck API routes
    Route::get('/api/decks', [DeckController::class, 'index'])->name('decks.index');
    Route::post('/api/decks', [DeckController::class, 'store'])->name('decks.store');
    Route::get('/api/decks/{deck}', [DeckController::class, 'show'])->name('decks.show');
    Route::put('/api/decks/{deck}', [DeckController::class, 'update'])->name('decks.update');
    Route::delete('/api/decks/{deck}', [DeckController::class, 'destroy'])->name('decks.destroy');

    // User cosmetics API routes
    Route::get('/api/user/cosmetics', [CosmeticController::class, 'userCosmetics'])->name('user.cosmetics');

    // Matchmaking API routes
    Route::post('/api/matchmaking/join', [MatchmakingController::class, 'joinQueue'])->name('matchmaking.join');
    Route::post('/api/matchmaking/leave', [MatchmakingController::class, 'leaveQueue'])->name('matchmaking.leave');
    Route::get('/api/matchmaking/status', [MatchmakingController::class, 'getQueueStatus'])->name('matchmaking.status');
    Route::post('/api/matchmaking/find-matches', [MatchmakingController::class, 'findMatches'])->name('matchmaking.find-matches');

    // Game Session API routes
    Route::post('/api/game-sessions', [GameSessionController::class, 'createSession'])->name('game-sessions.create');
    Route::post('/api/game-sessions/{matchId}/state', [GameSessionController::class, 'updateState'])->name('game-sessions.update-state');
    Route::post('/api/game-sessions/{matchId}/card-used', [GameSessionController::class, 'reportCardUsage'])->name('game-sessions.card-used');
    Route::get('/api/game-sessions/{matchId}', [GameSessionController::class, 'getState'])->name('game-sessions.get-state');
    Route::post('/api/game-sessions/{matchId}/end', [GameSessionController::class, 'endSession'])->name('game-sessions.end');
    Route::post('/api/game-sessions/{matchId}/concede', [GameSessionController::class, 'concede'])->name('game-sessions.concede');
    Route::post('/api/game-sessions/{matchId}/report-end', [GameSessionController::class, 'reportMatchEnd'])->name('game-sessions.report-end');
});

// Broadcasting authentication route
Broadcast::routes(['middleware' => ['auth']]);

// Public API routes for card data (no authentication required)
Route::get('/api/cards', [CardController::class, 'indexApi'])->name('cards.api');

// Public API route for all cosmetics (no authentication required)
Route::get('/api/cosmetics', [CosmeticController::class, 'indexApi'])->name('cosmetics.api');

// Resource routes for users, cards, and cosmetics (admin only)
Route::resource('users', UserController::class)->middleware('admin');
Route::resource('cards', CardController::class)->middleware('admin');
Route::resource('cosmetics', CosmeticController::class)->middleware('admin');

require __DIR__.'/auth.php';
