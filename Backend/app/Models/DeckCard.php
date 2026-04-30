<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeckCard extends Model
{
    protected $fillable = ['decks_id', 'decks_name', 'cards_id'];
    protected $table = 'deck_card';
    protected $primaryKey = ['decks_id', 'decks_name', 'cards_id'];
    public $incrementing = false;

    /**
     * Get the card.
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class, 'cards_id');
    }
}
