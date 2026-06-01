<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'match_id',
        'player1_id',
        'player2_id',
        'player1_state',
        'player2_state',
        'status',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'player1_state' => 'array',
        'player2_state' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function player1(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player1_id');
    }

    public function player2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player2_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByMatch($query, string $matchId)
    {
        return $query->where('match_id', $matchId);
    }

    public function scopeForPlayer($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('player1_id', $userId)
              ->orWhere('player2_id', $userId);
        });
    }

    public function getOpponentId(int $userId): ?int
    {
        if ($this->player1_id === $userId) {
            return $this->player2_id;
        }
        if ($this->player2_id === $userId) {
            return $this->player1_id;
        }
        return null;
    }

    public function getOpponentState(int $userId): ?array
    {
        if ($this->player1_id === $userId) {
            return $this->player2_state;
        }
        if ($this->player2_id === $userId) {
            return $this->player1_state;
        }
        return null;
    }

    public function updatePlayerState(int $userId, array $state): void
    {
        if ($this->player1_id === $userId) {
            $this->player1_state = $state;
        } elseif ($this->player2_id === $userId) {
            $this->player2_state = $state;
        }
        $this->save();
    }
}
