<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
            $this->command->error('Not enough users to create game logs. Need at least 2 users.');
            return;
        }

        if (count($cards) < 8) {
            $this->command->error('Not enough cards found. Please run CardSeeder first.');
            return;
        }

        $this->command->info('Seeding 1000 game logs. Building database queries...');

        $pivotData = [];
        $now = now();

        for ($i = 0; $i < 1000; $i++) {
            $userA = $users[array_rand($users)];
            $userB = $users[array_rand($users)];

            // Ensure user_a and user_b are different
            while ($userB === $userA) {
                $userB = $users[array_rand($users)];
            }

            // Randomly select a winner (one of the users or null for draw)
            $winner = fake()->randomElement([$userA, $userB, null]);

            // 1. Insert Game using Query Builder for speed, and grab its new ID
            $gameLogId = DB::table('game_logs')->insertGetId([
                'user_a' => $userA,
                'user_b' => $userB,
                'winner' => $winner,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // 2. Prep User A's cards (Using standard 'card_id' naming)
            $userACardKeys = array_rand($cards, 8);
            foreach ((array) $userACardKeys as $key) {
                $pivotData[] = [
                    'game_log_id' => $gameLogId,
                    'card_id' => $cards[$key], 
                    'user_id' => $userA,
                ];
            }

            // 3. Prep User B's cards (Using standard 'card_id' naming)
            $userBCardKeys = array_rand($cards, 8);
            foreach ((array) $userBCardKeys as $key) {
                $pivotData[] = [
                    'game_log_id' => $gameLogId,
                    'card_id' => $cards[$key],
                    'user_id' => $userB,
                ];
            }

            // 4. Batch insert pivot records every 2,000 rows to prevent memory exhaustion
            if (count($pivotData) >= 2000) {
                DB::table('card_game_log')->insert($pivotData);
                $pivotData = []; // Clear the array to start the next batch
            }
        }

        // Insert any leftover records from the final loop
        if (!empty($pivotData)) {
            DB::table('card_game_log')->insert($pivotData);
        }

        $this->command->info('1,000 game logs and 16,000 card history records created successfully.');
    }
}