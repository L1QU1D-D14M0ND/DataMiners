<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Deck extends Model
{
    protected $fillable = ['id', 'name'];
    protected $primaryKey = ['id', 'name'];
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Get the user that owns this deck.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }

    /**
     * Get the cards in this deck.
     */
    public function cards(): BelongsToMany
    {
        return $this->belongsToMany(Card::class, 'deck_card', 'decks_id', 'cards_id')
            ->withPivot('decks_name')
            ->withTimestamps();
    }
}
