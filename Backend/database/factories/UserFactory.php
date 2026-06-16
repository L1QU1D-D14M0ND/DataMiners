<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $playerRole = \App\Models\Role::firstOrCreate(['name' => 'Player']);

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'rank_score' => fake()->numberBetween(1, 50),
            'experience_points' => fake()->numberBetween(0, 10000),
            'credits' => fake()->numberBetween(0, 5000),
            'play_time' => fake()->numberBetween(0, 86400 * 365), // Up to 1 year of play time in seconds
            'role_id' => $playerRole?->id,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Configure the factory to create a default deck and cosmetics after user creation.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            // Create a default deck for the user
            $userDeck = $user->decks()->create([
                'deck_name' => 'Default',
            ]);

            // Equip the default deck
            $user->deck_id = $userDeck->id;
            $user->save();

            // Create a default set for the user
            $userSet = $user->sets()->create([
                'set_name' => 'Default',
            ]);

            // Attach default cosmetics to the default set
            $defaultCosmetics = \App\Models\Cosmetic::whereIn('name', [
                'Default Frame',
                'Default Picture',
                'Default Card',
                'Default Title',
            ])->pluck('id');

            if ($defaultCosmetics->count() > 0) {
                foreach ($defaultCosmetics as $cosmeticId) {
                    $userSet->cosmetics()->attach($cosmeticId);
                }
            }

            // Equip the default set
            $user->equipped_set_id = $userSet->id;
            $user->save();

            // Attach default cosmetics (one from each type)
            $defaultCosmetics = \App\Models\Cosmetic::whereIn('name', [
                'Default Frame',
                'Default Picture',
                'Default Card',
                'Default Title',
            ])->pluck('id');

            if ($defaultCosmetics->count() > 0) {
                foreach ($defaultCosmetics as $cosmeticId) {
                    $user->cosmetics()->attach($cosmeticId, ['unlocked' => true]);
                }
            }
        });
    }
}

