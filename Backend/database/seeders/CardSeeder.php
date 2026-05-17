<?php

namespace Database\Seeders;

use App\Models\Card;
use Illuminate\Database\Seeder;

class CardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Frontend game cards - these match the cards in the frontend
        $frontendCards = [
            'Power Surge',
            'Signal Relay',
            'Factory Overdrive',
            'Data Cache',
            'Reinforced Grid',
            'Ore Harvest',
            'Deep Uplink',
            'System Cooldown',
        ];

        foreach ($frontendCards as $card) {
            Card::firstOrCreate(['name' => $card]);
        }

        $this->command->info('Frontend game cards have been seeded successfully.');
    }
}
