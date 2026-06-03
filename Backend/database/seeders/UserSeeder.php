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
            'password' => bcrypt(env('SEED_ADMIN_PASSWORD', 'ChangeMe!Admin#' . bin2hex(random_bytes(4)))),
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

        // Create 2 test users with player roles
        $playerRole = Role::where('name', 'Player')->first();

        $testUser1 = User::create([
            'name' => 'TestPlayer1',
            'email' => 'player1@test.local',
            'password' => bcrypt(env('SEED_TEST_PASSWORD', 'TestPass!' . bin2hex(random_bytes(4)))),
            'role_id' => $playerRole?->id,
            'rank_score' => 1000,
            'experience_points' => 500,
            'credits' => 1000,
        ]);

        // Create default deck for test user 1
        $testUser1->decks()->create([
            'deck_name' => 'Default',
        ]);

        // Create default set for test user 1
        $testUser1->sets()->create([
            'set_name' => 'Default',
        ]);

        // Attach the 8 default cards to test user 1's default deck
        if ($defaultCards->count() > 0) {
            foreach ($defaultCards as $card) {
                DB::table('deck_card')->insert([
                    'decks_deck_id' => $testUser1->decks()->first()->id,
                    'cards_card_id' => $card->id,
                ]);
            }
        }

        // Attach default cosmetics for test user 1
        if ($defaultCosmetics->count() > 0) {
            foreach ($defaultCosmetics as $cosmeticId) {
                $testUser1->cosmetics()->attach($cosmeticId, ['unlocked' => true]);
            }
        }

        $testUser2 = User::create([
            'name' => 'TestPlayer2',
            'email' => 'player2@test.local',
            'password' => bcrypt(env('SEED_TEST_PASSWORD', 'TestPass!' . bin2hex(random_bytes(4)))),
            'role_id' => $playerRole?->id,
            'rank_score' => 1000,
            'experience_points' => 500,
            'credits' => 1000,
        ]);

        // Create default deck for test user 2
        $testUser2->decks()->create([
            'deck_name' => 'Default',
        ]);

        // Create default set for test user 2
        $testUser2->sets()->create([
            'set_name' => 'Default',
        ]);

        // Attach the 8 default cards to test user 2's default deck
        if ($defaultCards->count() > 0) {
            foreach ($defaultCards as $card) {
                DB::table('deck_card')->insert([
                    'decks_deck_id' => $testUser2->decks()->first()->id,
                    'cards_card_id' => $card->id,
                ]);
            }
        }

        // Attach default cosmetics for test user 2
        if ($defaultCosmetics->count() > 0) {
            foreach ($defaultCosmetics as $cosmeticId) {
                $testUser2->cosmetics()->attach($cosmeticId, ['unlocked' => true]);
            }
        }

        // Create 97 regular player users (99 total - 2 test users - 1 admin)
        User::factory()->count(97)->create();

        $this->command->info('102 users created successfully.');
    }
}
