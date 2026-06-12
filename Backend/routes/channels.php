<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\GameSession;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user has access to the channel.
|
*/

// Authorize users to join private match channels
Broadcast::channel('match.{matchId}', function ($user, $matchId) {
    // Check if the user is a participant in this game session
    $gameSession = GameSession::where('match_id', $matchId)
        ->where(function ($query) use ($user) {
            $query->where('player1_id', $user->id)
                  ->orWhere('player2_id', $user->id);
        })
        ->first();

    return $gameSession !== null;
});
