<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            [
                'name' => 'First Report',
                'description' => 'Submit your very first environmental hazard report and join the community of eco guardians.',
                'criteria_type' => 'report_count',
                'criteria_value' => json_encode(['threshold' => 1]),
                'icon' => '📋',
                'tier' => 'common',
                'points_awarded' => 50,
                'is_hidden' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Hawk Eye',
                'description' => 'Spot and report a deforestation hazard — the YOLOv8 AI confirms your sharp observation.',
                'criteria_type' => 'yolov8_class',
                'criteria_value' => json_encode(['class' => 'deforestation', 'threshold' => 1]),
                'icon' => '🌳',
                'tier' => 'common',
                'points_awarded' => 75,
                'is_hidden' => false,
                'sort_order' => 2,
            ],
            [
                'name' => 'Water Guardian',
                'description' => 'Identify and report a waterway blockage hazard to protect aquatic ecosystems.',
                'criteria_type' => 'yolov8_class',
                'criteria_value' => json_encode(['class' => 'waterway_blockage', 'threshold' => 1]),
                'icon' => '💧',
                'tier' => 'common',
                'points_awarded' => 75,
                'is_hidden' => false,
                'sort_order' => 3,
            ],
            [
                'name' => 'Offline Warrior',
                'description' => 'Queue an environmental report while disconnected and sync it when you are back online via the PWA.',
                'criteria_type' => 'offline_sync',
                'criteria_value' => json_encode(['threshold' => 1]),
                'icon' => '📡',
                'tier' => 'rare',
                'points_awarded' => 150,
                'is_hidden' => false,
                'sort_order' => 4,
            ],
            [
                'name' => 'Community Watchdog',
                'description' => 'Corroborate a fellow citizen report by verifying it within a 500-meter geofence radius.',
                'criteria_type' => 'geofence_verify',
                'criteria_value' => json_encode(['threshold' => 1, 'radius_meters' => 500]),
                'icon' => '🛡️',
                'tier' => 'rare',
                'points_awarded' => 150,
                'is_hidden' => false,
                'sort_order' => 5,
            ],
            [
                'name' => 'Truth Seeker',
                'description' => 'Have five of your reports officially verified by a Local Government Unit (LGU).',
                'criteria_type' => 'lgu_verified_count',
                'criteria_value' => json_encode(['threshold' => 5]),
                'icon' => '⚖️',
                'tier' => 'epic',
                'points_awarded' => 500,
                'is_hidden' => false,
                'sort_order' => 6,
            ],
            [
                'name' => 'Environmental Guardian',
                'description' => 'File ten or more verified environmental reports and establish yourself as a committed steward.',
                'criteria_type' => 'report_count',
                'criteria_value' => json_encode(['threshold' => 10]),
                'icon' => '🌿',
                'tier' => 'epic',
                'points_awarded' => 400,
                'is_hidden' => false,
                'sort_order' => 7,
            ],
            [
                'name' => 'Eco Champion',
                'description' => 'Ascend to the highest citizen rank — the Eco Champion. True environmental leadership achieved.',
                'criteria_type' => 'rank_level',
                'criteria_value' => json_encode(['level' => 'Eco Champion']),
                'icon' => '👑',
                'tier' => 'legendary',
                'points_awarded' => 1000,
                'is_hidden' => true,
                'sort_order' => 8,
            ],
        ];

        foreach ($achievements as $data) {
            Achievement::create($data);
        }
    }
}
