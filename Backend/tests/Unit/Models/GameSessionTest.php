<?php

namespace Tests\Unit\Models;

use App\Models\GameSession;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class GameSessionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::forceCreate(['name' => 'Player']);
    }

    public function test_get_opponent_id_returns_player2_when_given_player1(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_001',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $this->assertEquals($player2->id, $session->getOpponentId($player1->id));
    }

    public function test_get_opponent_id_returns_player1_when_given_player2(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_002',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $this->assertEquals($player1->id, $session->getOpponentId($player2->id));
    }

    public function test_get_opponent_id_returns_null_for_non_participant(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();
        $outsider = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_003',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $this->assertNull($session->getOpponentId($outsider->id));
    }

    public function test_get_opponent_state_returns_player2_state_for_player1(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_004',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'player1_state' => ['health' => 100, 'cards' => [1, 2]],
            'player2_state' => ['health' => 80, 'cards' => [3, 4]],
            'status' => 'active',
            'started_at' => now(),
        ]);

        $opponentState = $session->getOpponentState($player1->id);

        $this->assertEquals(['health' => 80, 'cards' => [3, 4]], $opponentState);
    }

    public function test_get_opponent_state_returns_player1_state_for_player2(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_005',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'player1_state' => ['health' => 100, 'cards' => [1, 2]],
            'player2_state' => ['health' => 80, 'cards' => [3, 4]],
            'status' => 'active',
            'started_at' => now(),
        ]);

        $opponentState = $session->getOpponentState($player2->id);

        $this->assertEquals(['health' => 100, 'cards' => [1, 2]], $opponentState);
    }

    public function test_get_opponent_state_returns_null_for_non_participant(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();
        $outsider = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_006',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'player1_state' => ['health' => 100],
            'player2_state' => ['health' => 80],
            'status' => 'active',
            'started_at' => now(),
        ]);

        $this->assertNull($session->getOpponentState($outsider->id));
    }

    public function test_update_player_state_for_player1(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_007',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'player1_state' => ['health' => 100],
            'player2_state' => ['health' => 100],
            'status' => 'active',
            'started_at' => now(),
        ]);

        $session->updatePlayerState($player1->id, ['health' => 50, 'cards' => [5]]);

        $session->refresh();
        $this->assertEquals(['health' => 50, 'cards' => [5]], $session->player1_state);
        $this->assertEquals(['health' => 100], $session->player2_state);
    }

    public function test_update_player_state_for_player2(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_008',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'player1_state' => ['health' => 100],
            'player2_state' => ['health' => 100],
            'status' => 'active',
            'started_at' => now(),
        ]);

        $session->updatePlayerState($player2->id, ['health' => 25]);

        $session->refresh();
        $this->assertEquals(['health' => 100], $session->player1_state);
        $this->assertEquals(['health' => 25], $session->player2_state);
    }

    public function test_scope_active_filters_active_sessions(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        GameSession::create([
            'match_id' => 'match_active',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        GameSession::create([
            'match_id' => 'match_ended',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'ended',
            'started_at' => now(),
            'ended_at' => now(),
        ]);

        $activeSessions = GameSession::active()->get();

        $this->assertCount(1, $activeSessions);
        $this->assertEquals('match_active', $activeSessions->first()->match_id);
    }

    public function test_scope_by_match_filters_by_match_id(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        GameSession::create([
            'match_id' => 'target_match',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        GameSession::create([
            'match_id' => 'other_match',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $sessions = GameSession::byMatch('target_match')->get();

        $this->assertCount(1, $sessions);
        $this->assertEquals('target_match', $sessions->first()->match_id);
    }

    public function test_scope_for_player_filters_sessions_for_user(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();
        $player3 = User::factory()->create();

        GameSession::create([
            'match_id' => 'match_a',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        GameSession::create([
            'match_id' => 'match_b',
            'player1_id' => $player2->id,
            'player2_id' => $player3->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $player1Sessions = GameSession::forPlayer($player1->id)->get();
        $player2Sessions = GameSession::forPlayer($player2->id)->get();
        $player3Sessions = GameSession::forPlayer($player3->id)->get();

        $this->assertCount(1, $player1Sessions);
        $this->assertCount(2, $player2Sessions);
        $this->assertCount(1, $player3Sessions);
    }

    public function test_player_relationships(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_rel',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $this->assertEquals($player1->id, $session->player1->id);
        $this->assertEquals($player2->id, $session->player2->id);
    }

    public function test_casts_datetime_fields(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();

        $session = GameSession::create([
            'match_id' => 'match_cast',
            'player1_id' => $player1->id,
            'player2_id' => $player2->id,
            'status' => 'active',
            'started_at' => '2024-01-01 12:00:00',
        ]);

        $this->assertInstanceOf(Carbon::class, $session->started_at);
    }
}
