<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetCosmetic extends Model
{
    protected $fillable = ['cosmetics_id', 'sets_name', 'sets_user_id'];
    protected $table = 'set_cosmetic';
    protected $primaryKey = ['cosmetics_id', 'sets_name'];
    public $incrementing = false;

    /**
     * Get the cosmetic.
     */
    public function cosmetic(): BelongsTo
    {
        return $this->belongsTo(Cosmetic::class, 'cosmetics_id');
    }
}
