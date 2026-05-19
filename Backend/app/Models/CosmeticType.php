<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CosmeticType extends Model
{
    protected $fillable = ['name'];
    protected $table = 'cosmetic_types';

    /**
     * Get the cosmetics of this type.
     */
    public function cosmetics(): HasMany
    {
        return $this->hasMany(Cosmetic::class);
    }
}
