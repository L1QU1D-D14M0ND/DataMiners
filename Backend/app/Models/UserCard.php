<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCard extends Model
{
    protected $fillable = ['user_id', 'card_id', 'unlocked'];
    protected $table = 'card_user';
    protected $primaryKey = ['user_id', 'card_id'];
    public $incrementing = false;
    public $timestamps = false;

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the card.
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }
}
