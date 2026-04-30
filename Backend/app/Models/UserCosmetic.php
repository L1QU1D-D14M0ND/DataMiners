<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCosmetic extends Model
{
    protected $fillable = ['users_id', 'cosmetics_id', 'unlocked'];
    protected $table = 'user_cosmetic';
    protected $primaryKey = ['users_id', 'cosmetics_id'];
    public $incrementing = false;

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'users_id');
    }

    /**
     * Get the cosmetic.
     */
    public function cosmetic(): BelongsTo
    {
        return $this->belongsTo(Cosmetic::class, 'cosmetics_id');
    }
}
