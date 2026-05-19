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
        
        $this->command->info('4 default cosmetics created successfully.');
    }
}
