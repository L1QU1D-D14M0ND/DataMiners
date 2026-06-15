<?php

namespace Database\Seeders;

use App\Models\Cosmetic;
use App\Models\CosmeticType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DefaultCosmeticsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cosmetics = [
            'Profile Frame' => 'Default Frame',
            'Profile Picture' => 'Default Picture',
            'Profile Card' => 'Default Card',
            'Profile Title' => 'Default Title',
        ];

        foreach ($cosmetics as $typeName => $cosmeticName) {
            $type = CosmeticType::where('name', $typeName)->first();
            
            if ($type) {
                Cosmetic::create([
                    'name' => $cosmeticName,
                    'experience_unlock' => 0,
                    'credits_unlock' => 0,
                    'cosmetic_type_id' => $type->id,
                ]);
            }
        }

        // Level 6 unlock cosmetics
        $level6Cosmetics = [
            'Profile Frame' => 'Tactical Frame',
            'Profile Picture' => 'Commander Portrait',
            'Profile Card' => 'Elite Card',
            'Profile Title' => 'Veteran Operator',
        ];

        // Level 6 requires 750 XP (25 * 6 * 5)
        foreach ($level6Cosmetics as $typeName => $cosmeticName) {
            $type = CosmeticType::where('name', $typeName)->first();
            
            if ($type) {
                Cosmetic::create([
                    'name' => $cosmeticName,
                    'experience_unlock' => 750,
                    'credits_unlock' => 0,
                    'cosmetic_type_id' => $type->id,
                ]);
            }
        }
        
        $this->command->info('8 cosmetics created successfully (4 default + 4 level 6 unlocks).');
    }
}
