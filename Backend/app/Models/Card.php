<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Card extends Model
{
    protected $fillable = ['name', 'experience_unlock', 'currency_a_unlock'];

    /**
     * Get the users that have this card.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_card', 'cards_id', 'users_id')
            ->withPivot('unlocked')
            ->withTimestamps();
    }

    /**
     * Get the decks that contain this card.
     */
    public function decks(): BelongsToMany
    {
        return $this->belongsToMany(Deck::class, 'deck_card', 'cards_id', 'decks_id')
            ->withPivot('decks_name')
            ->withTimestamps();
    }
}
