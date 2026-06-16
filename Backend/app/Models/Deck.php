<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Deck extends Model
{
    protected $fillable = ['user_id', 'deck_name'];

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        // The 'created' event fires AFTER the deck is saved to the database
        static::created(function (Deck $deck) {
            // 1. Fetch the IDs of the 8 default cards. 
            // (Assuming you have a way to identify them, like an 'is_default' column)
            $defaultCardIds = Card::where('id', '<', 9)
                ->limit(8)
                ->pluck('id');

            // 2. Attach them to the deck
            if ($defaultCardIds->isNotEmpty()) {
                $deck->cards()->attach($defaultCardIds);
            }
        });
    }

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
        return $this->belongsToMany(Card::class); 
    }
}
