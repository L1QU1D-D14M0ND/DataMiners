<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', 'Administrator')->first();

        $admin = User::create([
            'name' => 'Overlord',
            'email' => 'overlord@admin.local',
            'password' => bcrypt('Evil Blessing Overlord'),
            'role_id' => $adminRole?->id,
            'rank_score' => 999999,
            'experience_points' => 999999,
            'credits' => 999999,
        ]);

        // Create default deck for admin user
        $admin->decks()->create([
            'deck_name' => 'Default',
        ]);

        // Create default set for admin user
        $admin->sets()->create([
            'set_name' => 'Default',
        ]);

        // Attach the 8 default cards to the admin's default deck
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

        $defaultCards = \App\Models\Card::whereIn('name', $defaultCardNames)->get();

        if ($defaultCards->count() > 0) {
            foreach ($defaultCards as $card) {
                DB::table('deck_card')->insert([
                    'decks_deck_id' => $admin->decks()->first()->id,
                    'cards_card_id' => $card->id,
                ]);
            }
        }

        // Attach default cosmetics for admin user
        $defaultCosmetics = \App\Models\Cosmetic::whereIn('name', [
            'Default Frame',
            'Default Picture',
            'Default Card',
            'Default Title',
        ])->pluck('id');

        if ($defaultCosmetics->count() > 0) {
            foreach ($defaultCosmetics as $cosmeticId) {
                $admin->cosmetics()->attach($cosmeticId, ['unlocked' => true]);
            }
        }

        // Create 99 regular player users
        User::factory()->count(99)->create();

        $this->command->info('100 users created successfully.');
    }
}
