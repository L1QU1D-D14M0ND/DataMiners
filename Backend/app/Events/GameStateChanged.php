<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStateChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $matchId;
    public $userId;
    public $downloadSpeed;
    public $energyGenerated;
    public $timestamp;

    /**
     * Create a new event instance.
     */
    public function __construct(string $matchId, int $userId, float $downloadSpeed, float $energyGenerated)
    {
        $this->matchId = $matchId;
        $this->userId = $userId;
        $this->downloadSpeed = $downloadSpeed;
        $this->energyGenerated = $energyGenerated;
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
        return 'game.state.changed';
    }
}
