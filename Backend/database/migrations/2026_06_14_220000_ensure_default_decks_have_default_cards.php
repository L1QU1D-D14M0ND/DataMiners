<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the 8 default cards
        $defaultCardNames = [
            'Power Surge',
            'Signal Relay',
            'Factory Overdrive',
            'Data Cache',
            'Reinforced Grid',
            'Ore Harvest',
            'Deep Uplink',
            'System Cooldown',
        ];

        $defaultCardIds = DB::table('cards')
            ->whereIn('name', $defaultCardNames)
            ->pluck('id')
            ->toArray();

        if (empty($defaultCardIds)) {
            // Default cards don't exist yet, skip this migration
            return;
        }

        // Get all decks
        $decks = DB::table('decks')->get();

        foreach ($decks as $deck) {
            // Get current cards in this deck
            $currentCardIds = DB::table('deck_card')
                ->where('decks_deck_id', $deck->id)
                ->pluck('cards_card_id')
                ->toArray();

            // Add any missing default cards
            foreach ($defaultCardIds as $cardId) {
                if (!in_array($cardId, $currentCardIds)) {
                    DB::table('deck_card')->insert([
                        'decks_deck_id' => $deck->id,
                        'cards_card_id' => $cardId,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not reversible as it only adds cards to decks
        // To reverse, you would need to know which cards were added by this migration
        // For now, we'll leave it as non-reversible
    }
};
