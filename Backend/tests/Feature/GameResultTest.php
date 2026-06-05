<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameResultTest extends TestCase
{
    use RefreshDatabase;

    public function test_win_result_awards_full_rewards(): void
    {
        Role::forceCreate(['name' => 'Player']);
        $user = User::factory()->create([
            'experience_points' => 10,
            'credits' => 20,
            'rank_score' => 1,
        ]);

        $opponent = User::factory()->create();

        $gameSession = \App\Models\GameSession::create([
            'match_id' => 'match-win-1',
            'player1_id' => $user->id,
            'player2_id' => $opponent->id,
            'status' => 'completed',
            'rewarded' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson('/api/game-results', [
                'match_id' => $gameSession->match_id,
                'outcome' => 'win',
                'stats' => [
                    'time_elapsed_seconds' => 123,
                    'energy_generated' => 450,
                    'download_speed' => 10,
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('reward.experience', 50)
            ->assertJsonPath('reward.credits', 100)
            ->assertJsonPath('reward.rank_score', 5);

        $user->refresh();

        $this->assertSame(60, $user->experience_points);
        $this->assertSame(120, $user->credits);
        $this->assertSame(6, $user->rank_score);
    }

    public function test_loss_result_awards_half_rewards_rounded_down_for_rank_score(): void
    {
        Role::forceCreate(['name' => 'Player']);
        $user = User::factory()->create([
            'experience_points' => 10,
            'credits' => 20,
            'rank_score' => 1,
        ]);

        $opponent = User::factory()->create();

        $gameSession = \App\Models\GameSession::create([
            'match_id' => 'match-loss-1',
            'player1_id' => $user->id,
            'player2_id' => $opponent->id,
            'status' => 'completed',
            'rewarded' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson('/api/game-results', [
                'match_id' => $gameSession->match_id,
                'outcome' => 'loss',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('reward.experience', 25)
            ->assertJsonPath('reward.credits', 50)
            ->assertJsonPath('reward.rank_score', 2);

        $user->refresh();

        $this->assertSame(35, $user->experience_points);
        $this->assertSame(70, $user->credits);
        $this->assertSame(3, $user->rank_score);
    }
}
