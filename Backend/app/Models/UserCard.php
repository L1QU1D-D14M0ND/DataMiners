<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCard extends Model
{
    protected $fillable = ['users_user_id', 'cards_card_id', 'unlocked'];
    protected $table = 'user_card';
    protected $primaryKey = ['users_user_id', 'cards_card_id'];
    public $incrementing = false;
    public $timestamps = false;

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'users_user_id');
    }

    /**
     * Get the card.
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class, 'cards_card_id');
    }
}
