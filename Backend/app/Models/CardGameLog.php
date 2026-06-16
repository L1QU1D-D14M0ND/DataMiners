<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardGameLog extends Model
{
    protected $fillable = ['card_id', 'game_log_id', 'user_id'];
    protected $table = 'card_game_log';
    protected $primaryKey = ['card_id', 'game_log_id', 'user_id'];
    public $incrementing = false;
    public $timestamps = false;

    /**
     * Get the game log.
     */
    public function gameLog(): BelongsTo
    {
        return $this->belongsTo(GameLog::class);
    }

    /**
     * Get the card.
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }

    /**
     * Get the user who played this card.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
