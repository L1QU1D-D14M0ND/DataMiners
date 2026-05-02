<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Set extends Model
{
    protected $fillable = ['name', 'id'];
    protected $primaryKey = ['name', 'id'];
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Get the user that owns this set.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }

    /**
     * Get the cosmetics in this set.
     */
    public function cosmetics(): BelongsToMany
    {
        return $this->belongsToMany(Cosmetic::class, 'set_cosmetic', 'sets_name', 'cosmetics_id')
            ->withPivot('sets_id')
            ->withTimestamps();
    }
}
