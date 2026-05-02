<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameLog extends Model
{
    protected $table = 'game_logs';
    protected $fillable = ['id', 'user_a', 'user_b', 'winner'];
    protected $primaryKey = ['user_a', 'user_b', 'id'];
    public $incrementing = false;

    /**
     * Get the first user (player A) who participated in this game.
     */
    public function userA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_a', 'id');
    }

    /**
     * Get the second user (player B) who participated in this game.
     */
    public function userB(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_b', 'id');
    }
}
