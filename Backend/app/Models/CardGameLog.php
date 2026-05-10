<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardGameLog extends Model
{
    protected $fillable = ['game_log_id', 'cards_card_id', 'user_id'];
    protected $table = 'card_game_log';
    protected $primaryKey = ['game_log_id', 'cards_card_id', 'user_id'];
    public $incrementing = false;
    public $timestamps = false;

    /**
     * Get the game log.
     */
    public function gameLog(): BelongsTo
    {
        return $this->belongsTo(GameLog::class, 'game_log_id');
    }

    /**
     * Get the card.
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class, 'cards_card_id');
    }

    /**
     * Get the user who played this card.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
