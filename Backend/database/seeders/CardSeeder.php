<?php

namespace Database\Seeders;

use App\Models\Card;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cards = [
            'Advanced CCTV',
            'Advanced Satellite Deployment',
            'Atmostphere Monitoring Array',
            'Encript Communications',
            'Energy Generation Audit',
            'Hire Lawyer',
            'Mark Protected Zones',
            'Open Source Data',
            'Orbital Scan',
            'Prefabricated Wind Turbine',
            'Sanction Drills',
            'Supply Package',
        ];

        foreach ($cards as $card) {
            Card::create(['name' => $card]);
        }

        $this->command->info('12 cards have been seeded successfully.');
    }
}
