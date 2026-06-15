<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\Deck;
use App\Models\User;
use Illuminate\Database\Seeder;

class DeckSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::pluck('id')->toArray();
        $cards = Card::pluck('id')->toArray();

        if (count($users) === 0) {
            $this->command->info('No users found. Please run UserSeeder first.');
            return;
        }

        if (count($cards) === 0) {
            $this->command->info('No cards found. Please run CardSeeder first.');
            return;
        }

        // Create 50 random decks
        // The Deck model's created event will automatically add the 8 default cards
        for ($i = 0; $i < 50; $i++) {
            $userId = $users[array_rand($users)];

            Deck::create([
                'user_id' => $userId,
                'deck_name' => 'Deck ' . ($i + 1),
            ]);
        }

        $this->command->info('50 decks with 8 default cards created successfully.');
    }
}
