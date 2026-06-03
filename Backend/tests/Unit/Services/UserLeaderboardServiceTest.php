<?php

namespace Tests\Unit\Services;

use App\Models\GameLog;
use App\Models\Role;
use App\Models\User;
use App\Services\UserLeaderboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserLeaderboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private UserLeaderboardService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Role::forceCreate(['name' => 'Player']);
        $this->service = new UserLeaderboardService;
    }

    public function test_get_leaderboard_returns_empty_array_when_no_users(): void
    {
        $leaderboard = $this->service->getLeaderboard();

        $this->assertIsArray($leaderboard);
        $this->assertEmpty($leaderboard);
    }

    public function test_get_leaderboard_returns_users_ordered_by_rank_score(): void
    {
        $user1 = User::factory()->create(['name' => 'Low Rank', 'rank_score' => 100]);
        $user2 = User::factory()->create(['name' => 'High Rank', 'rank_score' => 500]);
        $user3 = User::factory()->create(['name' => 'Mid Rank', 'rank_score' => 300]);

        $leaderboard = $this->service->getLeaderboard();

        $this->assertEquals('High Rank', $leaderboard[0]['name']);
        $this->assertEquals('Mid Rank', $leaderboard[1]['name']);
        $this->assertEquals('Low Rank', $leaderboard[2]['name']);
    }

    public function test_get_leaderboard_contains_expected_keys(): void
    {
        User::factory()->create(['rank_score' => 100]);

        $leaderboard = $this->service->getLeaderboard();

        $this->assertArrayHasKey('rank', $leaderboard[0]);
        $this->assertArrayHasKey('user_id', $leaderboard[0]);
        $this->assertArrayHasKey('name', $leaderboard[0]);
        $this->assertArrayHasKey('email', $leaderboard[0]);
        $this->assertArrayHasKey('rank_score', $leaderboard[0]);
        $this->assertArrayHasKey('experience_points', $leaderboard[0]);
        $this->assertArrayHasKey('credits', $leaderboard[0]);
        $this->assertArrayHasKey('play_time', $leaderboard[0]);
        $this->assertArrayHasKey('total_games', $leaderboard[0]);
        $this->assertArrayHasKey('total_wins', $leaderboard[0]);
        $this->assertArrayHasKey('win_rate', $leaderboard[0]);
        $this->assertArrayHasKey('role', $leaderboard[0]);
    }

    public function test_get_leaderboard_calculates_total_games_and_wins(): void
    {
        $user1 = User::factory()->create(['rank_score' => 500]);
        $user2 = User::factory()->create(['rank_score' => 100]);

        // user1 wins 2 games, loses 1
        GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user1->id]);
        GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user1->id]);
        GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user2->id]);

        $leaderboard = $this->service->getLeaderboard();

        // user1 is first (higher rank_score)
        $this->assertEquals(3, $leaderboard[0]['total_games']);
        $this->assertEquals(2, $leaderboard[0]['total_wins']);
        $this->assertEquals(66.67, $leaderboard[0]['win_rate']);
    }

    public function test_get_leaderboard_zero_win_rate_when_no_games(): void
    {
        User::factory()->create(['rank_score' => 100]);

        $leaderboard = $this->service->getLeaderboard();

        $this->assertEquals(0, $leaderboard[0]['total_games']);
        $this->assertEquals(0, $leaderboard[0]['total_wins']);
        $this->assertEquals(0, $leaderboard[0]['win_rate']);
    }

    public function test_get_leaderboard_limits_to_50_users(): void
    {
        for ($i = 0; $i < 55; $i++) {
            User::factory()->create(['rank_score' => $i]);
        }

        $leaderboard = $this->service->getLeaderboard();

        $this->assertCount(50, $leaderboard);
    }

    public function test_get_leaderboard_ranks_are_sequential(): void
    {
        User::factory()->create(['rank_score' => 300]);
        User::factory()->create(['rank_score' => 200]);
        User::factory()->create(['rank_score' => 100]);

        $leaderboard = $this->service->getLeaderboard();

        $this->assertEquals(1, $leaderboard[0]['rank']);
        $this->assertEquals(2, $leaderboard[1]['rank']);
        $this->assertEquals(3, $leaderboard[2]['rank']);
    }

    public function test_get_leaderboard_includes_role_name(): void
    {
        $leaderboard = $this->service->getLeaderboard();

        // The factory creates users with the Player role we seeded
        User::factory()->create(['rank_score' => 100]);

        $leaderboard = $this->service->getLeaderboard();

        $this->assertEquals('Player', $leaderboard[0]['role']);
    }

    public function test_get_leaderboard_counts_games_as_player_b(): void
    {
        $user1 = User::factory()->create(['rank_score' => 500]);
        $user2 = User::factory()->create(['rank_score' => 100]);

        // user2 participates as player B and wins
        GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user2->id]);

        $leaderboard = $this->service->getLeaderboard();

        // user2 is second (lower rank_score), but has 1 game and 1 win
        $this->assertEquals(1, $leaderboard[1]['total_games']);
        $this->assertEquals(1, $leaderboard[1]['total_wins']);
        $this->assertEquals(100.0, $leaderboard[1]['win_rate']);
    }
}
