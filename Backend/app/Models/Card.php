<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Card extends Model
{
    protected $fillable = ['name', 'experience_unlock', 'credits_unlock'];

    /**
     * Get the users that have this card.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_card', 'cards_card_id', 'users_user_id')
            ->withPivot('unlocked');
    }

    /**
     * Get the decks that contain this card.
     */
    public function decks(): BelongsToMany
    {
        return $this->belongsToMany(Deck::class, 'deck_card', 'cards_card_id', 'decks_deck_id');
    }

    /**
     * Get the game logs where this card was played.
     */
    public function gameLogs(): BelongsToMany
    {
        return $this->belongsToMany(GameLog::class, 'card_game_log', 'cards_card_id', 'game_log_id')
            ->withPivot('user_id');
    }
}
