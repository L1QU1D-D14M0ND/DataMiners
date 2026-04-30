<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Cosmetic extends Model
{
    protected $fillable = ['name', 'experience_unlock', 'currency_a_unlock', 'cosmetic_type_id'];

    /**
     * Get the cosmetic type that this cosmetic belongs to.
     */
    public function cosmeticType(): BelongsTo
    {
        return $this->belongsTo(CosmeticType::class);
    }

    /**
     * Get the users that have this cosmetic.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_cosmetic', 'cosmetics_id', 'users_id')
            ->withPivot('unlocked')
            ->withTimestamps();
    }

    /**
     * Get the sets that contain this cosmetic.
     */
    public function sets(): BelongsToMany
    {
        return $this->belongsToMany(Set::class, 'set_cosmetic', 'cosmetics_id', 'sets_name')
            ->withPivot('sets_user_id')
            ->withTimestamps();
    }
}
