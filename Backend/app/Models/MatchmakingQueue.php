<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchmakingQueue extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'queue_name',
        'skill_rating',
        'preferences',
        'status',
        'matched_at',
        'expires_at',
    ];

    protected $casts = [
        'preferences' => 'array',
        'matched_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'waiting')
                    ->where('expires_at', '>', now());
    }

    public function scopeByQueue($query, string $queueName)
    {
        return $query->where('queue_name', $queueName);
    }

    public function scopeInSkillRange($query, int $minRating, int $maxRating)
    {
        return $query->whereBetween('skill_rating', [$minRating, $maxRating]);
    }
}
