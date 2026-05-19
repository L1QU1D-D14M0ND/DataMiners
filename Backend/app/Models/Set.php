<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Set extends Model
{
    protected $fillable = ['user_set_id', 'set_name'];

    /**
     * Get the user that owns this set.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_set_id', 'id');
    }

    /**
     * Get the cosmetics in this set.
     */
    public function cosmetics(): BelongsToMany
    {
        return $this->belongsToMany(Cosmetic::class, 'set_cosmetic', 'sets_set_id', 'cosmetics_cosmetic_id');
    }
}
