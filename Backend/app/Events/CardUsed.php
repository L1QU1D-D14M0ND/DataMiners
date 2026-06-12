<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CardUsed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $matchId;
    public $userId;
    public $cardId;
    public $cardName;
    public $timestamp;

    /**
     * Create a new event instance.
     */
    public function __construct(string $matchId, int $userId, string $cardId, string $cardName)
    {
        $this->matchId = $matchId;
        $this->userId = $userId;
        $this->cardId = $cardId;
        $this->cardName = $cardName;
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
        return 'card.used';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'matchId' => $this->matchId,
            'userId' => $this->userId,
            'cardId' => $this->cardId,
            'cardName' => $this->cardName,
            'timestamp' => $this->timestamp,
        ];
    }
}
