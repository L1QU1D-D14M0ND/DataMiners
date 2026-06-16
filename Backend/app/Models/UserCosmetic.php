<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCosmetic extends Model
{
    protected $fillable = ['cosmetic_id', 'user_id', 'unlocked'];
    protected $table = 'cosmetic_user';
    protected $primaryKey = ['cosmetic_id', 'user_id'];
    public $incrementing = false;
    public $timestamps = true;

    /**
     * Get the cosmetic.
     */
    public function cosmetic(): BelongsTo
    {
        return $this->belongsTo(Cosmetic::class);
    }

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
