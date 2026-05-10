<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Deck extends Model
{
    protected $fillable = ['user_id', 'deck_name'];

    /**
     * Get the user that owns this deck.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the cards in this deck.
     */
    public function cards(): BelongsToMany
    {
        return $this->belongsToMany(Card::class, 'deck_card', 'decks_deck_id', 'cards_card_id');
    }
}
