<?php

namespace Database\Factories;

use App\Models\GameLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GameLog>
 */
class GameLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $userA = User::inRandomOrder()->first();
        $userB = User::inRandomOrder()->where('id', '!=', $userA?->id)->first();

        return [
            'user_a' => $userA?->id ?? User::factory(),
            'user_b' => $userB?->id ?? User::factory(),
            'winner' => fake()->randomElement([$userA?->id, $userB?->id, null]),
        ];
    }
}
