<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchEnded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $matchId;
    public $winnerId;
    public $loserId;
    public $timestamp;

    /**
     * Create a new event instance.
     */
    public function __construct(string $matchId, int $winnerId, int $loserId)
    {
        $this->matchId = $matchId;
        $this->winnerId = $winnerId;
        $this->loserId = $loserId;
        $this->timestamp = now()->toISOString();
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('match.' . $this->matchId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'match.ended';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'matchId' => $this->matchId,
            'winnerId' => $this->winnerId,
            'loserId' => $this->loserId,
            'timestamp' => $this->timestamp,
        ];
    }
}
