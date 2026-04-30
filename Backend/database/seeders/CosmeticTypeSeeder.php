<?php

namespace Database\Seeders;

use App\Models\CosmeticType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CosmeticTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            'Profile Card',
            'Profile Decoration',
            'Profile Frame',
            'Profile Picture',
            'Profile Title',
        ];

        foreach ($types as $type) {
            CosmeticType::create(['name' => $type]);
        }
    }
}
