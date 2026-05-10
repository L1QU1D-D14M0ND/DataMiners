<?php

namespace Database\Seeders;

use App\Models\GameLog;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GameLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::pluck('id')->toArray();

        if (count($users) < 2) {
            $this->command->info('Not enough users to create game logs. Need at least 2 users.');
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

            GameLog::create([
                'user_a' => $userA,
                'user_b' => $userB,
                'winner' => $winner,
            ]);
        }

        $this->command->info('1000 game logs created successfully.');
    }
}
