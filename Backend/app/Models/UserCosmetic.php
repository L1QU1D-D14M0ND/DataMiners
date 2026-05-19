<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCosmetic extends Model
{
    protected $fillable = ['users_user_id', 'cosmetics_cosmetic_id', 'unlocked'];
    protected $table = 'user_cosmetic';
    protected $primaryKey = ['users_user_id', 'cosmetics_cosmetic_id'];
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
     * Get the cosmetic.
     */
    public function cosmetic(): BelongsTo
    {
        return $this->belongsTo(Cosmetic::class, 'cosmetics_cosmetic_id');
    }
}
