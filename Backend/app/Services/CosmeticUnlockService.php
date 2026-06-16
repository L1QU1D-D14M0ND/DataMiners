<?php

namespace App\Services;

use App\Models\User;
use App\Models\Cosmetic;
use App\Models\CosmeticType;

class CosmeticUnlockService
{
    /**
     * Levels at which cosmetics are unlocked and their corresponding cosmetic names
     * At level 6, unlock 4 cosmetic items (one of each type)
     */
    private const LEVEL_COSMETIC_MAPPING = [
        6 => [
            'Profile Frame' => 'Tactical Frame',
            'Profile Picture' => 'Commander Portrait',
            'Profile Card' => 'Elite Card',
            'Profile Title' => 'Veteran Operator',
        ],
    ];

    /**
     * Unlock cosmetics for a user based on their level
     */
    public function unlockCosmeticsForLevel(User $user, int $level): void
    {
        if (!isset(self::LEVEL_COSMETIC_MAPPING[$level])) {
            return;
        }

        $cosmeticNames = array_values(self::LEVEL_COSMETIC_MAPPING[$level]);

        // Fetch all cosmetics matching these names in one query
        $cosmetics = Cosmetic::whereIn('name', $cosmeticNames)->pluck('id');

        if ($cosmetics->isEmpty()) {
            return;
        }

        $syncData = $cosmetics->mapWithKeys(function ($id) {
            return [$id => ['unlocked' => true]];
        })->toArray();

        // syncWithoutDetaching inherently ignores items the user already has,
        // so we don't need to manually check if they already exist!
        $user->cosmetics()->syncWithoutDetaching($syncData);
    }

    /**
     * Unlock a specific cosmetic by name and type for a user
     */
    private function unlockCosmeticByName(User $user, string $cosmeticName, string $typeName): void
    {
        // Find the cosmetic type
        $cosmeticType = CosmeticType::where('name', $typeName)->first();
        if (!$cosmeticType) {
            return;
        }

        // Find the cosmetic by name and type
        $cosmetic = Cosmetic::where('name', $cosmeticName)
            ->where('cosmetic_type_id', $cosmeticType->id)
            ->first();

        if (!$cosmetic) {
            return;
        }

        // Check if user already has this cosmetic unlocked
        $alreadyUnlocked = $user->cosmetics()
            ->where('cosmetic_id', $cosmetic->id)
            ->where('unlocked', true)
            ->exists();

        if ($alreadyUnlocked) {
            return;
        }

        // Unlock the cosmetic for the user
        $user->cosmetics()->syncWithoutDetaching([
            $cosmetic->id => ['unlocked' => true],
        ]);
    }

    /**
     * Unlock default cosmetics for a new user
     */
    public function unlockDefaultCosmetics(User $user): void
    {
        // Get only the IDs to save memory, no need to hydrate full models
        $defaultCosmeticIds = Cosmetic::where('experience_unlock', 0)
            ->where('credits_unlock', 0)
            ->pluck('id');

        // Format the array for syncWithoutDetaching: [id => ['unlocked' => true], ...]
        $syncData = $defaultCosmeticIds->mapWithKeys(function ($id) {
            return [$id => ['unlocked' => true]];
        })->toArray();

        if (!empty($syncData)) {
            $user->cosmetics()->syncWithoutDetaching($syncData);
        }
    }

    /**
     * Check and unlock cosmetics for a user based on their current level
     * This should be called when a user levels up
     */
    public function checkAndUnlockCosmeticsForUser(User $user): void
    {
        $level = $this->calculateUserLevel($user->experience_points ?? 0);

        // Check each unlock level up to the user's current level
        foreach (self::LEVEL_COSMETIC_MAPPING as $unlockLevel => $cosmeticNames) {
            if ($level >= $unlockLevel) {
                $this->unlockCosmeticsForLevel($user, $unlockLevel);
            }
        }
    }

    /**
     * Calculate user level from experience points
     * Uses the same formula as the frontend: 25 * L * (L-1)
     */
    private function calculateUserLevel(int $experiencePoints): int
    {
        // O(1) mathematical inverse of 25 * L * (L-1)
        return (int) floor((25 + sqrt(625 + 100 * $experiencePoints)) / 50);
    }

    /**
     * Get the number of cosmetics a user should have unlocked at a given level
     */
    public function getExpectedUnlockedCosmeticCount(int $level): int
    {
        // Default cosmetics (4) + 4 cosmetics per unlock level reached
        $defaultCosmeticCount = Cosmetic::where('experience_unlock', 0)
            ->where('credits_unlock', 0)
            ->count();
        $unlockCount = 0;

        foreach (self::LEVEL_COSMETIC_MAPPING as $unlockLevel => $cosmeticNames) {
            if ($level >= $unlockLevel) {
                $unlockCount += count($cosmeticNames);
            }
        }

        return $defaultCosmeticCount + $unlockCount;
    }
}
