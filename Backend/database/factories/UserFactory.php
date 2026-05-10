<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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
        $playerRole = \App\Models\Role::where('name', 'Player')->first();

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
            $user->decks()->create([
                'deck_name' => 'Default',
            ]);

            // Create a default set for the user
            $user->sets()->create([
                'set_name' => 'Default',
            ]);

            // Attach the 8 default cards to the default deck
            $defaultCardNames = [
                'Advanced CCTV',
                'Advanced Satellite Deployment',
                'Encript Communications',
                'Energy Generation Audit',
                'Mark Protected Zones',
                'Orbital Scan',
                'Prefabricated Wind Turbine',
                'Supply Package',
            ];

            $defaultCards = \App\Models\Card::whereIn('name', $defaultCardNames)->get();

            if ($defaultCards->count() > 0) {
            foreach ($defaultCards as $card) {
                DB::table('deck_card')->insert([
                    'decks_deck_id' => $user->decks()->first()->id,
                    'cards_card_id' => $card->id,
                ]);
            }
        }

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

