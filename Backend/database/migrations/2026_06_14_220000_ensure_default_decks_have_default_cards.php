<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Empty, runs elsewhere
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optional: If you ever need to rollback, this strips these 8 default cards from ALL decks
        $defaultCardNames = [
            'Power Surge', 'Signal Relay', 'Factory Overdrive', 'Data Cache',
            'Reinforced Grid', 'Ore Harvest', 'Deep Uplink', 'System Cooldown'
        ];

        $defaultCardIds = DB::table('cards')
            ->whereIn('name', $defaultCardNames)
            ->pluck('id')
            ->toArray();

        if (!empty($defaultCardIds)) {
            DB::table('card_deck')->whereIn('card_id', $defaultCardIds)->delete();
        }
    }
};