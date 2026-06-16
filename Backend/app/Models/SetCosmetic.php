<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetCosmetic extends Model
{
    protected $fillable = ['cosmetic_id', 'set_id'];
    protected $table = 'cosmetic_set';
    protected $primaryKey = ['cosmetic_id', 'set_id'];
    public $incrementing = false;
    public $timestamps = false;

    /**
     * Get the cosmetic.
     */
    public function cosmetic(): BelongsTo
    {
        return $this->belongsTo(Cosmetic::class);
    }

    /**
     * Get the set.
     */
    public function set(): BelongsTo
    {
        return $this->belongsTo(Set::class);
    }
}
