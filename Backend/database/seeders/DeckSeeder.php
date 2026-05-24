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
        for ($i = 0; $i < 50; $i++) {
            $userId = $users[array_rand($users)];
            
            $deck = Deck::create([
                'user_id' => $userId,
                'deck_name' => 'Deck ' . ($i + 1),
            ]);

            // Add 5-8 random cards to each deck
            $numCards = rand(5, 8);
            $selectedCards = array_rand($cards, min($numCards, count($cards)));
            
            if (!is_array($selectedCards)) {
                $selectedCards = [$selectedCards];
            }

            foreach ($selectedCards as $cardIndex) {
                $deck->cards()->attach($cards[$cardIndex]);
            }
        }

        $this->command->info('50 decks with cards created successfully.');
    }
}
