<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Cosmetic extends Model
{
    protected $fillable = ['name', 'experience_unlock', 'credits_unlock', 'cosmetic_type_id'];

    /**
     * Get the cosmetic type that this cosmetic belongs to.
     */
    public function cosmeticType(): BelongsTo
    {
        return $this->belongsTo(CosmeticType::class, 'cosmetic_type_id');
    }

    /**
     * Get the users that have this cosmetic.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_cosmetic', 'cosmetic_id', 'user_id')
            ->withPivot('unlocked');
    }

    /**
     * Get the sets that contain this cosmetic.
     */
    public function sets(): BelongsToMany
    {
        return $this->belongsToMany(Set::class, 'set_cosmetic', 'cosmetics_cosmetic_id', 'sets_set_id');
    }
}
