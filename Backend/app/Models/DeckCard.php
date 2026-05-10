<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeckCard extends Model
{
    protected $fillable = ['decks_deck_id', 'cards_card_id'];
    protected $table = 'deck_card';
    protected $primaryKey = ['decks_deck_id', 'cards_card_id'];
    public $incrementing = false;
    public $timestamps = false;

    /**
     * Get the card.
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class, 'cards_card_id');
    }

    /**
     * Get the deck.
     */
    public function deck(): BelongsTo
    {
        return $this->belongsTo(Deck::class, 'decks_deck_id');
    }
}
