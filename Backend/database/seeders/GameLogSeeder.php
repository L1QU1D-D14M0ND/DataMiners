<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\CardGameLog;
use App\Models\GameLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class GameLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::pluck('id')->toArray();
        $cards = Card::pluck('id')->toArray();

        if (count($users) < 2) {
            $this->command->info('Not enough users to create game logs. Need at least 2 users.');
            return;
        }

        if (count($cards) === 0) {
            $this->command->info('No cards found. Please run CardSeeder first.');
            return;
        }

        // Create 1000 random game logs
        for ($i = 0; $i < 1000; $i++) {
            $userA = $users[array_rand($users)];
            $userB = $users[array_rand($users)];

            // Ensure user_a and user_b are different
            while ($userB === $userA) {
                $userB = $users[array_rand($users)];
            }

            // Randomly select a winner (one of the users or null for draw)
            $winner = fake()->randomElement([$userA, $userB, null]);

            $gameLog = GameLog::create([
                'user_a' => $userA,
                'user_b' => $userB,
                'winner' => $winner,
            ]);

            // Create card game logs for this game
            // Each player plays 3-5 random cards (unique per user per game)
            $numCardsUserA = rand(3, 5);
            $numCardsUserB = rand(3, 5);

            // User A's cards (ensure unique cards)
            $userACards = array_rand($cards, min($numCardsUserA, count($cards)));
            if (!is_array($userACards)) {
                $userACards = [$userACards];
            }
            foreach ($userACards as $cardIndex) {
                CardGameLog::create([
                    'game_log_id' => $gameLog->id,
                    'cards_card_id' => $cards[$cardIndex],
                    'user_id' => $userA,
                ]);
            }

            // User B's cards (ensure unique cards)
            $userBCards = array_rand($cards, min($numCardsUserB, count($cards)));
            if (!is_array($userBCards)) {
                $userBCards = [$userBCards];
            }
            foreach ($userBCards as $cardIndex) {
                CardGameLog::create([
                    'game_log_id' => $gameLog->id,
                    'cards_card_id' => $cards[$cardIndex],
                    'user_id' => $userB,
                ]);
            }
        }

        $this->command->info('1000 game logs with card game logs created successfully.');
    }
}
