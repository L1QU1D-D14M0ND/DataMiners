<?php

use App\Http\Controllers\Auth\SpaAuthenticationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CosmeticController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeckController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/spa/login', [SpaAuthenticationController::class, 'login'])->name('spa.login');
Route::post('/spa/register', [SpaAuthenticationController::class, 'register'])->name('spa.register');
Route::get('/spa/user', [SpaAuthenticationController::class, 'user'])->name('spa.user');
Route::post('/spa/logout', [SpaAuthenticationController::class, 'logout'])->name('spa.logout');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Deck API routes
    Route::get('/api/decks', [DeckController::class, 'index'])->name('decks.index');
    Route::post('/api/decks', [DeckController::class, 'store'])->name('decks.store');
    Route::get('/api/decks/{deck}', [DeckController::class, 'show'])->name('decks.show');
    Route::put('/api/decks/{deck}', [DeckController::class, 'update'])->name('decks.update');
    Route::delete('/api/decks/{deck}', [DeckController::class, 'destroy'])->name('decks.destroy');
});

// Public API routes for card data (no authentication required)
Route::get('/cards', [CardController::class, 'indexApi'])->name('cards.api');

// Resource routes for users, cards, and cosmetics (admin only)
Route::resource('users', UserController::class)->middleware('admin');
Route::resource('cards', CardController::class)->middleware('admin');
Route::resource('cosmetics', CosmeticController::class)->middleware('admin');

require __DIR__.'/auth.php';
