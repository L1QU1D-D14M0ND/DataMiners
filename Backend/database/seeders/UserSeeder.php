<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Services\CardUnlockService;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cardUnlockService = new CardUnlockService();
        $adminRole = Role::where('name', 'Administrator')->first();

        $admin = User::create([
            'name' => 'Overlord',
            'email' => 'overlord@admin.local',
            'password' => bcrypt(env('SEED_ADMIN_PASSWORD', 'Overlord123')),
            'role_id' => $adminRole?->id,
            'rank_score' => 999999,
            'experience_points' => 999999,
            'credits' => 999999,
        ]);

        // Unlock default cards for admin
        $cardUnlockService->unlockDefaultCards($admin);
        // Unlock cards based on level (admin has max XP, so should unlock all)
        $cardUnlockService->checkAndUnlockCardsForUser($admin);

        // Create default deck for admin user
        // The Deck model's created event will automatically add the 8 default cards
        $admin->decks()->create([
            'deck_name' => 'Default',
        ]);

        // Attach default cosmetics for admin user
        $defaultCosmetics = \App\Models\Cosmetic::whereIn('name', [
            'Default Frame',
            'Default Picture',
            'Default Card',
            'Default Title',
        ])->pluck('id');

        // Create default set for admin user
        $adminSet = $admin->sets()->create([
            'set_name' => 'Default',
        ]);

        // Attach default cosmetics to admin's default set
        if ($defaultCosmetics->count() > 0) {
            foreach ($defaultCosmetics as $cosmeticId) {
                $adminSet->cosmetics()->attach($cosmeticId);
            }
        }

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
            'password' => bcrypt(env('SEED_TEST_PASSWORD', 'TestPass123')),
            'role_id' => $playerRole?->id,
            'rank_score' => 1000,
            'experience_points' => 500,
            'credits' => 1000,
        ]);

        // Unlock default cards for test user 1
        $cardUnlockService->unlockDefaultCards($testUser1);
        // Unlock cards based on level (500 XP = level 5, so should unlock cards at levels 2 and 4)
        $cardUnlockService->checkAndUnlockCardsForUser($testUser1);

        // Create default deck for test user 1
        // The Deck model's created event will automatically add the 8 default cards
        $testUser1->decks()->create([
            'deck_name' => 'Default',
        ]);

        // Create default set for test user 1
        $testUser1Set = $testUser1->sets()->create([
            'set_name' => 'Default',
        ]);

        // Attach default cosmetics to test user 1's default set
        if ($defaultCosmetics->count() > 0) {
            foreach ($defaultCosmetics as $cosmeticId) {
                $testUser1Set->cosmetics()->attach($cosmeticId);
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
            'password' => bcrypt(env('SEED_TEST_PASSWORD', 'TestPass123')),
            'role_id' => $playerRole?->id,
            'rank_score' => 1000,
            'experience_points' => 500,
            'credits' => 1000,
        ]);

        // Unlock default cards for test user 2
        $cardUnlockService->unlockDefaultCards($testUser2);
        // Unlock cards based on level (500 XP = level 5, so should unlock cards at levels 2 and 4)
        $cardUnlockService->checkAndUnlockCardsForUser($testUser2);

        // Create default deck for test user 2
        // The Deck model's created event will automatically add the 8 default cards
        $testUser2->decks()->create([
            'deck_name' => 'Default',
        ]);

        // Create default set for test user 2
        $testUser2Set = $testUser2->sets()->create([
            'set_name' => 'Default',
        ]);

        // Attach default cosmetics to test user 2's default set
        if ($defaultCosmetics->count() > 0) {
            foreach ($defaultCosmetics as $cosmeticId) {
                $testUser2Set->cosmetics()->attach($cosmeticId);
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
