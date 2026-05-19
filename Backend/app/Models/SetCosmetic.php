<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetCosmetic extends Model
{
    protected $fillable = ['cosmetics_cosmetic_id', 'sets_set_id'];
    protected $table = 'set_cosmetic';
    protected $primaryKey = ['cosmetics_cosmetic_id', 'sets_set_id'];
    public $incrementing = false;
    public $timestamps = false;

    /**
     * Get the cosmetic.
     */
    public function cosmetic(): BelongsTo
    {
        return $this->belongsTo(Cosmetic::class, 'cosmetics_cosmetic_id');
    }

    /**
     * Get the set.
     */
    public function set(): BelongsTo
    {
        return $this->belongsTo(Set::class, 'sets_set_id');
    }
}
