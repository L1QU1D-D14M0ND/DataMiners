<?php

namespace App\Services;

use App\Models\User;
use App\Models\Card;

class CardUnlockService
{
    /**
     * Levels at which cards are unlocked and their corresponding card names
     */
    private const LEVEL_CARD_MAPPING = [
        2 => 'Quantum Processor',
        4 => 'Energy Core',
        6 => 'Mining Drone',
        8 => 'Tech Upgrade',
        10 => 'Digital Fortress',
    ];

    /**
     * Unlock cards for a user based on their level
     */
    public function unlockCardsForLevel(User $user, int $level): void
    {
        // Only unlock cards at specific levels
        if (!isset(self::LEVEL_CARD_MAPPING[$level])) {
            return;
        }

        $cardName = self::LEVEL_CARD_MAPPING[$level];

        // Find the card by name
        $card = Card::where('name', $cardName)->first();

        if (!$card) {
            return;
        }

        // Check if user already has this card unlocked
        $alreadyUnlocked = $user->cards()
            ->where('card_id', $card->id)
            ->where('unlocked', true)
            ->exists();

        if ($alreadyUnlocked) {
            return;
        }

        // Unlock the card for the user
        $user->cards()->syncWithoutDetaching([
            $card->id => ['unlocked' => true],
        ]);
    }

    /**
     * Unlock default cards for a new user
     */
    public function unlockDefaultCards(User $user): void
    {
        $defaultCards = Card::where('is_default', true)->get();

        foreach ($defaultCards as $card) {
            $user->cards()->syncWithoutDetaching([
                $card->id => ['unlocked' => true],
            ]);
        }
    }

    /**
     * Check and unlock cards for a user based on their current level
     * This should be called when a user levels up
     */
    public function checkAndUnlockCardsForUser(User $user): void
    {
        $level = $this->calculateUserLevel($user->experience_points ?? 0);

        // Check each unlock level up to the user's current level
        foreach (self::LEVEL_CARD_MAPPING as $unlockLevel => $cardName) {
            if ($level >= $unlockLevel) {
                $this->unlockCardsForLevel($user, $unlockLevel);
            }
        }
    }

    /**
     * Calculate user level from experience points
     * Uses the same formula as the frontend: 25 * L * (L-1)
     */
    private function calculateUserLevel(int $experiencePoints): int
    {
        $level = 1;
        while (25 * ($level + 1) * $level <= $experiencePoints) {
            $level++;
        }
        return $level;
    }

    /**
     * Get the number of cards a user should have unlocked at a given level
     */
    public function getExpectedUnlockedCardCount(int $level): int
    {
        // Default cards (8) + 1 card per unlock level reached
        $defaultCardCount = Card::where('is_default', true)->count();
        $unlockCount = 0;

        foreach (self::UNLOCK_LEVELS as $unlockLevel) {
            if ($level >= $unlockLevel) {
                $unlockCount++;
            }
        }

        return $defaultCardCount + $unlockCount;
    }
}
