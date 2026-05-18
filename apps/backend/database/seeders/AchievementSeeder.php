<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            // ── COMMON (Tier 1) ──────────────────────────────────────
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
                'name' => 'Pollution Buster',
                'description' => 'Report a water pollution hazard detected by AI — every drop counts.',
                'criteria_type' => 'yolov8_class',
                'criteria_value' => json_encode(['class' => 'water_pollution', 'threshold' => 1]),
                'icon' => '🚱',
                'tier' => 'common',
                'points_awarded' => 75,
                'is_hidden' => false,
                'sort_order' => 4,
            ],
            [
                'name' => 'Air Watch',
                'description' => 'Detect and report an air pollution hazard to help clear the skies.',
                'criteria_type' => 'yolov8_class',
                'criteria_value' => json_encode(['class' => 'air_pollution', 'threshold' => 1]),
                'icon' => '🌫️',
                'tier' => 'common',
                'points_awarded' => 75,
                'is_hidden' => false,
                'sort_order' => 5,
            ],

            // ── RARE (Tier 2) ────────────────────────────────────────
            [
                'name' => 'Offline Warrior',
                'description' => 'Queue an environmental report while disconnected and sync it when you are back online via the PWA.',
                'criteria_type' => 'offline_sync',
                'criteria_value' => json_encode(['threshold' => 1]),
                'icon' => '📡',
                'tier' => 'rare',
                'points_awarded' => 150,
                'is_hidden' => false,
                'sort_order' => 10,
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
                'sort_order' => 11,
            ],
            [
                'name' => 'Sharp Shooter',
                'description' => 'Submit five verified environmental reports — consistency builds trust.',
                'criteria_type' => 'report_count',
                'criteria_value' => json_encode(['threshold' => 5]),
                'icon' => '🎯',
                'tier' => 'rare',
                'points_awarded' => 200,
                'is_hidden' => false,
                'sort_order' => 12,
            ],
            [
                'name' => 'Perimeter Patrol',
                'description' => 'Verify five citizen reports within a 1000-meter geofence — strengthening community validation.',
                'criteria_type' => 'geofence_verify',
                'criteria_value' => json_encode(['threshold' => 5, 'radius_meters' => 1000]),
                'icon' => '🗺️',
                'tier' => 'rare',
                'points_awarded' => 250,
                'is_hidden' => false,
                'sort_order' => 13,
            ],
            [
                'name' => 'Night Watcher',
                'description' => 'Sync five environmental reports while offline — proving the PWA works even in remote areas.',
                'criteria_type' => 'offline_sync',
                'criteria_value' => json_encode(['threshold' => 5]),
                'icon' => '🦉',
                'tier' => 'rare',
                'points_awarded' => 250,
                'is_hidden' => false,
                'sort_order' => 14,
            ],

            // ── EPIC (Tier 3) ────────────────────────────────────────
            [
                'name' => 'Truth Seeker',
                'description' => 'Have five of your reports officially verified by a Local Government Unit (LGU).',
                'criteria_type' => 'lgu_verified_count',
                'criteria_value' => json_encode(['threshold' => 5]),
                'icon' => '⚖️',
                'tier' => 'epic',
                'points_awarded' => 500,
                'is_hidden' => false,
                'sort_order' => 20,
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
                'sort_order' => 21,
            ],
            [
                'name' => 'Town Cryer',
                'description' => 'Have ten of your reports verified by an LGU — your voice is heard by local governance.',
                'criteria_type' => 'lgu_verified_count',
                'criteria_value' => json_encode(['threshold' => 10]),
                'icon' => '📢',
                'tier' => 'epic',
                'points_awarded' => 600,
                'is_hidden' => false,
                'sort_order' => 22,
            ],
            [
                'name' => 'Forest Sentinel',
                'description' => 'Report three separate deforestation hazards confirmed by AI — a true guardian of the canopy.',
                'criteria_type' => 'yolov8_class',
                'criteria_value' => json_encode(['class' => 'deforestation', 'threshold' => 3]),
                'icon' => '🌲',
                'tier' => 'epic',
                'points_awarded' => 500,
                'is_hidden' => false,
                'sort_order' => 23,
            ],

            // ── LEGENDARY (Tier 4) ────────────────────────────────────
            [
                'name' => 'Eco Champion',
                'description' => 'Ascend to the highest citizen rank — the Eco Champion. True environmental leadership achieved.',
                'criteria_type' => 'rank_level',
                'criteria_value' => json_encode(['level' => 'Eco Champion']),
                'icon' => '👑',
                'tier' => 'legendary',
                'points_awarded' => 1000,
                'is_hidden' => true,
                'sort_order' => 30,
            ],
            [
                'name' => 'Century Mark',
                'description' => 'Submit one hundred environmental reports — a monumental contribution to the planet.',
                'criteria_type' => 'report_count',
                'criteria_value' => json_encode(['threshold' => 100]),
                'icon' => '💯',
                'tier' => 'legendary',
                'points_awarded' => 1500,
                'is_hidden' => false,
                'sort_order' => 31,
            ],
            [
                'name' => 'Ghost in the Machine',
                'description' => 'Sync ten reports while in Ghost Mode — the silent protector of the environment.',
                'criteria_type' => 'offline_sync',
                'criteria_value' => json_encode(['threshold' => 10]),
                'icon' => '👻',
                'tier' => 'legendary',
                'points_awarded' => 1200,
                'is_hidden' => true,
                'sort_order' => 32,
            ],
        ];

        foreach ($achievements as $data) {
            Achievement::create($data);
        }
    }
}
