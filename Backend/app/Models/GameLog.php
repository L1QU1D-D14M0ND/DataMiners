<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameLog extends Model
{
    protected $table = 'game_logs';
    protected $fillable = ['user_a', 'user_b', 'winner'];

    /**
     * Get the first user (player A) who participated in this game.
     */
    public function userA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_a', 'id');
    }

    /**
     * Get the second user (player B) who participated in this game.
     */
    public function userB(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_b', 'id');
    }

    /**
     * Get the cards played in this game.
     */
    public function cards(): BelongsToMany
    {
        return $this->belongsToMany(Card::class, 'card_game_log', 'game_log_id', 'cards_card_id')
            ->withPivot('user_id');
    }

    /**
     * Get the winner user if the game is finished.
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner', 'id');
    }
}
