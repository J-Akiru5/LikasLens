<?php

namespace Database\Seeders;

use App\Models\SlaConfig;
use Illuminate\Database\Seeder;

class SlaConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'violation_type' => 'illegal_dumping',
                'response_hours' => 48,
                'resolution_hours' => 168,
                'escalation_enabled' => true,
                'country_code' => 'PH',
            ],
            [
                'violation_type' => 'water_pollution',
                'response_hours' => 24,
                'resolution_hours' => 72,
                'escalation_enabled' => true,
                'country_code' => 'PH',
            ],
            [
                'violation_type' => 'air_pollution',
                'response_hours' => 24,
                'resolution_hours' => 72,
                'escalation_enabled' => true,
                'country_code' => 'PH',
            ],
            [
                'violation_type' => 'deforestation',
                'response_hours' => 72,
                'resolution_hours' => 336,
                'escalation_enabled' => true,
                'country_code' => 'PH',
            ],
            [
                'violation_type' => 'chemical_spill',
                'response_hours' => 4,
                'resolution_hours' => 24,
                'escalation_enabled' => true,
                'country_code' => 'PH',
            ],
            [
                'violation_type' => 'noise_pollution',
                'response_hours' => 72,
                'resolution_hours' => 168,
                'escalation_enabled' => true,
                'country_code' => 'PH',
            ],
            [
                'violation_type' => 'wildlife_threat',
                'response_hours' => 48,
                'resolution_hours' => 168,
                'escalation_enabled' => true,
                'country_code' => 'PH',
            ],
        ];

        foreach ($configs as $config) {
            SlaConfig::updateOrCreate(
                ['violation_type' => $config['violation_type']],
                $config
            );
        }
    }
}
