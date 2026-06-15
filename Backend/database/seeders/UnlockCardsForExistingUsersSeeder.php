<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\CardUnlockService;
use Illuminate\Database\Seeder;

class UnlockCardsForExistingUsersSeeder extends Seeder
{
    /**
     * Unlock default cards and level-based cards for existing users.
     */
    public function run(): void
    {
        $cardUnlockService = new CardUnlockService();
        
        $users = User::all();
        
        foreach ($users as $user) {
            // Unlock default cards
            $cardUnlockService->unlockDefaultCards($user);
            
            // Unlock cards based on current level
            $cardUnlockService->checkAndUnlockCardsForUser($user);
            
            $this->command->info("Unlocked cards for user: {$user->name}");
        }
        
        $this->command->info('Cards unlocked for all existing users successfully.');
    }
}
