<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCard extends Model
{
    protected $fillable = ['users_id', 'cards_id', 'unlocked'];
    protected $table = 'user_card';
    protected $primaryKey = ['users_id', 'cards_id'];
    public $incrementing = false;

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'users_id');
    }

    /**
     * Get the card.
     */
    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class, 'cards_id');
    }
}
