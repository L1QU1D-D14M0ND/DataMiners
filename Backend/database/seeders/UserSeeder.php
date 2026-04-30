<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', 'Administrator')->first();

        User::create([
            'name' => 'Overlord',
            'email' => 'overlord@admin.local',
            'password' => bcrypt('Evil Blessing Overlord'),
            'role_id' => $adminRole?->id,
            'rank_number' => 999999,
            'experience' => 999999,
            'currency_a' => 999999,
        ]);

        // Create 99 regular player users
        User::factory()->count(99)->create();
    }
}
