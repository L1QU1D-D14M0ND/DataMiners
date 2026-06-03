<?php

namespace Tests\Unit\Services;

use App\Models\Card;
use App\Models\GameLog;
use App\Models\Role;
use App\Models\User;
use App\Services\CardStatisticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CardStatisticsServiceTest extends TestCase
{
    use RefreshDatabase;

    private CardStatisticsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Role::forceCreate(['name' => 'Player']);
        $this->service = new CardStatisticsService;
    }

    public function test_get_card_statistics_returns_empty_array_when_no_cards(): void
    {
        $statistics = $this->service->getCardStatistics();

        $this->assertIsArray($statistics);
        $this->assertEmpty($statistics);
    }

    public function test_get_card_statistics_returns_stats_for_each_card(): void
    {
        $card1 = Card::create(['name' => 'Card A', 'experience_unlock' => 100, 'credits_unlock' => 50]);
        $card2 = Card::create(['name' => 'Card B', 'experience_unlock' => 200, 'credits_unlock' => 100]);

        $statistics = $this->service->getCardStatistics();

        $this->assertCount(2, $statistics);
        $this->assertEquals('Card A', $statistics[0]['card_name']);
        $this->assertEquals('Card B', $statistics[1]['card_name']);
    }

    public function test_card_statistics_contains_expected_keys(): void
    {
        Card::create(['name' => 'Test Card', 'experience_unlock' => 100, 'credits_unlock' => 50]);

        $statistics = $this->service->getCardStatistics();

        $this->assertArrayHasKey('card_id', $statistics[0]);
        $this->assertArrayHasKey('card_name', $statistics[0]);
        $this->assertArrayHasKey('winrate', $statistics[0]);
        $this->assertArrayHasKey('game_presence_rate', $statistics[0]);
        $this->assertArrayHasKey('deck_presence_rate', $statistics[0]);
        $this->assertArrayHasKey('games_played', $statistics[0]);
        $this->assertArrayHasKey('wins', $statistics[0]);
        $this->assertArrayHasKey('decks_containing', $statistics[0]);
    }

    public function test_card_statistics_zero_values_when_no_games(): void
    {
        Card::create(['name' => 'Unused Card', 'experience_unlock' => 0, 'credits_unlock' => 0]);

        $statistics = $this->service->getCardStatistics();

        $this->assertEquals(0, $statistics[0]['winrate']);
        $this->assertEquals(0, $statistics[0]['game_presence_rate']);
        $this->assertEquals(0, $statistics[0]['deck_presence_rate']);
        $this->assertEquals(0, $statistics[0]['games_played']);
        $this->assertEquals(0, $statistics[0]['wins']);
        $this->assertEquals(0, $statistics[0]['decks_containing']);
    }

    public function test_card_statistics_calculates_game_presence_rate(): void
    {
        $card = Card::create(['name' => 'Popular Card', 'experience_unlock' => 100, 'credits_unlock' => 50]);
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create 4 games
        $game1 = GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user1->id]);
        $game2 = GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user2->id]);
        GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user1->id]);
        GameLog::create(['user_a' => $user1->id, 'user_b' => $user2->id, 'winner' => $user2->id]);

        // Card was played in 2 of 4 games
        DB::table('card_game_log')->insert([
            ['cards_card_id' => $card->id, 'game_log_id' => $game1->id, 'user_id' => $user1->id],
            ['cards_card_id' => $card->id, 'game_log_id' => $game2->id, 'user_id' => $user1->id],
        ]);

        $statistics = $this->service->getCardStatistics();

        $this->assertEquals(2, $statistics[0]['games_played']);
        $this->assertEquals(50.0, $statistics[0]['game_presence_rate']); // 2/4 = 50%
    }

    public function test_card_statistics_calculates_deck_presence_rate(): void
    {
        $card = Card::create(['name' => 'Deck Card', 'experience_unlock' => 0, 'credits_unlock' => 0]);
        $user = User::factory()->create();

        // Create additional decks, card is in 2 of them
        $deck1 = $user->decks()->create(['deck_name' => 'Deck 1']);
        $deck2 = $user->decks()->create(['deck_name' => 'Deck 2']);
        $user->decks()->create(['deck_name' => 'Deck 3']);

        DB::table('deck_card')->insert([
            ['decks_deck_id' => $deck1->id, 'cards_card_id' => $card->id],
            ['decks_deck_id' => $deck2->id, 'cards_card_id' => $card->id],
        ]);

        $statistics = $this->service->getCardStatistics();

        $this->assertEquals(2, $statistics[0]['decks_containing']);
    }
}
