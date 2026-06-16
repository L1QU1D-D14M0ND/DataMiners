<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AssignDefaultCardsToDecksSeeder extends Seeder
{
    public function run(): void
    {
        $defaultCardNames = [
            'Power Surge', 'Signal Relay', 'Factory Overdrive', 'Data Cache',
            'Reinforced Grid', 'Ore Harvest', 'Deep Uplink', 'System Cooldown',
        ];

        $defaultCardIds = DB::table('cards')
            ->whereIn('name', $defaultCardNames)
            ->pluck('id')
            ->toArray();

        if (empty($defaultCardIds)) {
            $this->command->error("CardSeeder must run before this seeder!");
            return;
        }

        DB::table('decks')->orderBy('id')->chunk(200, function ($decks) use ($defaultCardIds) {
            $insertData = [];
            foreach ($decks as $deck) {
                foreach ($defaultCardIds as $cardId) {
                    $insertData[] = [
                        // USE THE NEW STANDARD COLUMN NAMES
                        'deck_id' => $deck->id, 
                        'card_id' => $cardId,
                    ];
                }
            }
            // USE THE NEW STANDARD TABLE NAME
            DB::table('card_deck')->insertOrIgnore($insertData);
        });
    }
}