<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Card extends Model
{
    protected $fillable = ['name', 'experience_unlock', 'credits_unlock'];

    /**
     * Get the users that have this card.
     * Assumes table: 'card_user' (alphabetical order)
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('unlocked');
    }

    /**
     * Get the decks that contain this card.
     * Assumes table: 'card_deck' (alphabetical order)
     */
    public function decks(): BelongsToMany
    {
        return $this->belongsToMany(Deck::class);
    }

    /**
     * Get the game logs where this card was played.
     * Assumes table: 'card_game_log'
     */
    public function gameLogs(): BelongsToMany
    {
        return $this->belongsToMany(GameLog::class)->withPivot('user_id');
    }
}