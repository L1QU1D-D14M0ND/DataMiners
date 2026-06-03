<?php

namespace Tests\Unit\Models;

use App\Models\MatchmakingQueue;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class MatchmakingQueueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::forceCreate(['name' => 'Player']);
    }

    public function test_scope_active_returns_waiting_non_expired_entries(): void
    {
        $user = User::factory()->create();

        $active = MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'matched',
            'expires_at' => now()->addMinutes(5),
        ]);

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'waiting',
            'expires_at' => now()->subMinutes(1),
        ]);

        $activeQueues = MatchmakingQueue::active()->get();

        $this->assertCount(1, $activeQueues);
        $this->assertEquals($active->id, $activeQueues->first()->id);
    }

    public function test_scope_by_queue_filters_by_queue_name(): void
    {
        $user = User::factory()->create();

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'casual',
            'skill_rating' => 1200,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        $rankedQueues = MatchmakingQueue::byQueue('ranked')->get();
        $casualQueues = MatchmakingQueue::byQueue('casual')->get();

        $this->assertCount(1, $rankedQueues);
        $this->assertCount(1, $casualQueues);
        $this->assertEquals('ranked', $rankedQueues->first()->queue_name);
    }

    public function test_scope_in_skill_range_filters_by_rating(): void
    {
        $user = User::factory()->create();

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1000,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 2000,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        $inRange = MatchmakingQueue::inSkillRange(900, 1600)->get();

        $this->assertCount(2, $inRange);
    }

    public function test_user_relationship(): void
    {
        $user = User::factory()->create();

        $queue = MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->assertEquals($user->id, $queue->user->id);
    }

    public function test_preferences_cast_as_array(): void
    {
        $user = User::factory()->create();

        $queue = MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'preferences' => ['region' => 'us-east', 'mode' => 'standard'],
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        $queue->refresh();

        $this->assertIsArray($queue->preferences);
        $this->assertEquals('us-east', $queue->preferences['region']);
        $this->assertEquals('standard', $queue->preferences['mode']);
    }

    public function test_matched_at_cast_as_datetime(): void
    {
        $user = User::factory()->create();

        $queue = MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'matched',
            'matched_at' => '2024-06-01 12:00:00',
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->assertInstanceOf(Carbon::class, $queue->matched_at);
    }

    public function test_expires_at_cast_as_datetime(): void
    {
        $user = User::factory()->create();

        $queue = MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'waiting',
            'expires_at' => '2024-06-01 12:05:00',
        ]);

        $this->assertInstanceOf(Carbon::class, $queue->expires_at);
    }

    public function test_scope_chaining_active_and_by_queue(): void
    {
        $user = User::factory()->create();

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'casual',
            'skill_rating' => 1200,
            'status' => 'waiting',
            'expires_at' => now()->addMinutes(5),
        ]);

        MatchmakingQueue::create([
            'user_id' => $user->id,
            'queue_name' => 'ranked',
            'skill_rating' => 1500,
            'status' => 'matched',
            'expires_at' => now()->addMinutes(5),
        ]);

        $activeRanked = MatchmakingQueue::active()->byQueue('ranked')->get();

        $this->assertCount(1, $activeRanked);
    }
}
