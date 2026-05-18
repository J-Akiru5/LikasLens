<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\NgoGroup;
use App\Models\Report;
use App\Models\Ticket;
use App\Models\TicketEvidence;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LikasLensSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── Users ──────────────────────────────────────────────────────
        $users = [
            'citizen' => User::firstOrCreate(
                ['email' => 'citizen@likaslens.ph'],
                [
                    'supabase_auth_user_id' => (string) Str::uuid(),
                    'name' => 'Maria Santos',
                    'password' => Hash::make('password'),
                    'role' => 'citizen',
                    'trust_score' => 85,
                    'reward_points_balance' => 1250,
                ]
            ),
            'analyst' => User::firstOrCreate(
                ['email' => 'analyst@likaslens.ph'],
                [
                    'supabase_auth_user_id' => (string) Str::uuid(),
                    'name' => 'Juan Dela Cruz',
                    'password' => Hash::make('password'),
                    'role' => 'analyst',
                    'trust_score' => 92,
                    'reward_points_balance' => 3400,
                ]
            ),
            'super_admin' => User::firstOrCreate(
                ['email' => 'admin@likaslens.ph'],
                [
                    'supabase_auth_user_id' => (string) Str::uuid(),
                    'name' => 'Admin Reyes',
                    'password' => Hash::make('password'),
                    'role' => 'super_admin',
                    'trust_score' => 100,
                    'reward_points_balance' => 5000,
                ]
            ),
            'ghost' => User::firstOrCreate(
                ['email' => 'ghost@likaslens.local'],
                [
                    'supabase_auth_user_id' => '00000000-0000-0000-0000-000000000000',
                    'name' => 'Anonymous Ghost',
                    'password' => Hash::make('password'),
                    'role' => 'ghost',
                    'trust_score' => 0,
                    'reward_points_balance' => 0,
                ]
            ),
        ];

        // Additional citizens
        for ($i = 1; $i <= 4; $i++) {
            $user = User::firstOrCreate(
                ['email' => "citizen{$i}@likaslens.ph"],
                [
                    'supabase_auth_user_id' => (string) Str::uuid(),
                    'name' => 'Citizen ' . $i,
                    'password' => Hash::make('password'),
                    'role' => 'citizen',
                    'trust_score' => mt_rand(30, 95),
                    'reward_points_balance' => mt_rand(100, 2000),
                ]
            );
            $users["citizen_{$i}"] = $user;
        }

        // ── User Achievements (Demo unlocks) ──────────────────────────
        $allAchievements = Achievement::all()->keyBy('name');

        $nowForAchievements = now()->subDays(mt_rand(1, 30));

        // Helper: unlock or set progress for a user-achievement pair
        $setAchievement = function (User $user, string $achievementName, ?int $progress, ?string $unlockedAt) use ($allAchievements) {
            $ach = $allAchievements->get($achievementName);
            if (! $ach) {
                return;
            }
            UserAchievement::firstOrCreate(
                ['user_id' => $user->id, 'achievement_id' => $ach->id],
                [
                    'progress_value' => $progress ?? ($ach->criteria_value['threshold'] ?? 1),
                    'unlocked_at' => $unlockedAt,
                ]
            );
        };

        // Maria Santos: Steward level
        foreach (['First Report', 'Hawk Eye', 'Water Guardian', 'Pollution Buster', 'Community Watchdog', 'Sharp Shooter'] as $name) {
            $setAchievement($users['citizen'], $name, null, $nowForAchievements);
        }
        $setAchievement($users['citizen'], 'Environmental Guardian', 8, null);
        $setAchievement($users['citizen'], 'Perimeter Patrol', 3, null);

        // Juan Dela Cruz: Steward level
        foreach (['First Report', 'Hawk Eye', 'Water Guardian', 'Air Watch', 'Offline Warrior', 'Community Watchdog', 'Sharp Shooter', 'Environmental Guardian'] as $name) {
            $setAchievement($users['analyst'], $name, null, $nowForAchievements->copy()->subDays(mt_rand(1, 60)));
        }
        $setAchievement($users['analyst'], 'Truth Seeker', 3, null);
        $setAchievement($users['analyst'], 'Night Watcher', 2, null);

        // Admin Reyes: Guardian level
        foreach (['First Report', 'Hawk Eye', 'Water Guardian', 'Pollution Buster', 'Air Watch', 'Offline Warrior', 'Community Watchdog', 'Sharp Shooter', 'Environmental Guardian', 'Truth Seeker'] as $name) {
            $setAchievement($users['super_admin'], $name, null, $nowForAchievements->copy()->subDays(mt_rand(1, 90)));
        }
        $setAchievement($users['super_admin'], 'Eco Champion', 0, null);
        $setAchievement($users['super_admin'], 'Town Cryer', 7, null);
        $setAchievement($users['super_admin'], 'Century Mark', 42, null);

        // ── Tickets ─────────────────────────────────────────────────────
        $ticketData = [
            ['title' => 'Illegal Dumping Detected', 'status' => 'open', 'urgency' => 5, 'desc' => 'Large pile of construction debris and household waste dumped along the riverbank near Sector 4 residential area. Possible hazardous materials present.', 'address' => 'Sector 4, Riverside', 'lat' => 14.5833, 'lng' => 121.0000],
            ['title' => 'Air Quality Drop', 'status' => 'monitoring', 'urgency' => 3, 'desc' => 'Sustained drop in air quality index detected in downtown core area. PM2.5 levels exceeding safe thresholds for 48+ hours.', 'address' => 'Downtown Core', 'lat' => 14.5600, 'lng' => 121.0200],
            ['title' => 'Resolution Confirmed', 'status' => 'resolved', 'urgency' => 2, 'desc' => 'Previous report of illegal tree cutting in Park District has been investigated and resolved. Perpetrator identified and fined.', 'address' => 'Park District', 'lat' => 14.5900, 'lng' => 121.0400],
            ['title' => 'Water Contamination Alert', 'status' => 'investigating', 'urgency' => 4, 'desc' => 'Suspected industrial discharge into the river near the Riverside Industrial complex. Discolored water and fish kill observed.', 'address' => 'Riverside Industrial', 'lat' => 14.5700, 'lng' => 120.9900],
            ['title' => 'Deforestation Zone Detected', 'status' => 'open', 'urgency' => 5, 'desc' => 'Satellite imagery analysis indicates significant forest cover loss in Northern Ridge Forest area. Approximately 2 hectares affected.', 'address' => 'Northern Ridge Forest', 'lat' => 14.6200, 'lng' => 121.0800],
            ['title' => 'Noise Level Normalized', 'status' => 'resolved', 'urgency' => 1, 'desc' => 'Excessive noise from construction site in downtown core has been addressed. Contractor complied with noise ordinance.', 'address' => 'Downtown Core', 'lat' => 14.5550, 'lng' => 121.0150],
            ['title' => 'Wildfire Risk Assessment', 'status' => 'monitoring', 'urgency' => 3, 'desc' => 'Unusually dry conditions in Sector 7 forest zone. High risk of wildfire outbreak. Proactive monitoring recommended.', 'address' => 'Sector 7, Forest Zone', 'lat' => 14.6500, 'lng' => 121.1000],
            ['title' => 'Illegal Wildlife Trafficking', 'status' => 'investigating', 'urgency' => 5, 'desc' => 'Suspected wildlife trafficking operation near National Park boundary. Injured Philippine Eagle reported in the area.', 'address' => 'National Park Boundary', 'lat' => 14.5300, 'lng' => 121.1200],
            ['title' => 'Air Quality Improved', 'status' => 'resolved', 'urgency' => 2, 'desc' => 'Air quality in downtown core has returned to acceptable levels after industrial emission control measures were implemented.', 'address' => 'Downtown Core', 'lat' => 14.5620, 'lng' => 121.0220],
            ['title' => 'Coastal Erosion Threat', 'status' => 'open', 'urgency' => 4, 'desc' => 'Rapid coastal erosion detected along the shoreline near Barangay Maligaya. Several structures at risk within 50 meters.', 'address' => 'Barangay Maligaya Coastal', 'lat' => 14.4800, 'lng' => 120.9800],
            ['title' => 'Plastic Waste in Mangrove Forest', 'status' => 'monitoring', 'urgency' => 3, 'desc' => 'Accumulation of plastic waste in the mangrove forest rehabilitation area. Community cleanup needed.', 'address' => 'Mangrove Reserve, East District', 'lat' => 14.5100, 'lng' => 121.0500],
            ['title' => 'Chemical Spill at Industrial Park', 'status' => 'investigating', 'urgency' => 5, 'desc' => 'Unknown chemical spill reported at the Light Industry Park. Area evacuated. HAZMAT team dispatched.', 'address' => 'Light Industry Park', 'lat' => 14.5400, 'lng' => 120.9600],
            ['title' => 'Roadside Erosion Hazard', 'status' => 'open', 'urgency' => 3, 'desc' => 'Heavy rains caused significant soil erosion along the national highway. Road shoulder partially collapsed.', 'address' => 'National Highway, Section 12', 'lat' => 14.6000, 'lng' => 121.0300],
            ['title' => 'River Siltation Issue', 'status' => 'monitoring', 'urgency' => 2, 'desc' => 'Excessive silt buildup in the river delta affecting water flow and marine life habitats. Dredging可能需要。', 'address' => 'River Delta, South District', 'lat' => 14.4700, 'lng' => 121.0400],
            ['title' => 'Suspected Quarry Violation', 'status' => 'investigating', 'urgency' => 4, 'desc' => 'Unauthorized quarrying operation detected in the mountain ridge. Potential violation of mining regulations.', 'address' => 'Mountain Ridge, North District', 'lat' => 14.6800, 'lng' => 121.0900],
        ];

        $userIds = collect($users)->map->id->values()->toArray();
        $categories = ['Environmental Hazard', 'Pollution', 'Wildlife Protection', 'Land Use', 'Water Quality', 'Air Quality', 'Waste Management'];

        $tickets = collect();
        foreach ($ticketData as $i => $data) {
            $ticket = Ticket::create([
                'reporter_user_id' => $userIds[array_rand($userIds)],
                'status' => $data['status'],
                'title' => $data['title'],
                'description' => $data['desc'],
                'latitude' => $data['lat'],
                'longitude' => $data['lng'],
                'address_text' => $data['address'],
                'urgency_score' => $data['urgency'],
                'ai_triage_summary' => $categories[$i % count($categories)],
                'ai_confidence' => round(mt_rand(8500, 9900) / 10000, 4),
                'resolved_at' => in_array($data['status'], ['resolved']) ? $now->copy()->subHours(mt_rand(1, 72)) : null,
                'created_at' => $now->copy()->subHours(mt_rand(1, 168)),
                'updated_at' => $now,
            ]);
            $tickets->push($ticket);
        }

        // ── Ticket Evidence ─────────────────────────────────────────────
        foreach ($tickets as $ticket) {
            TicketEvidence::create([
                'ticket_id' => $ticket->id,
                'uploaded_by_user_id' => $ticket->reporter_user_id,
                'storage_provider' => 'local',
                'storage_bucket' => 'local',
                'storage_path' => 'evidence/'.$ticket->created_at->format('Y/m/d').'/'.Str::uuid7().'.jpg',
                'checksum_sha256' => hash('sha256', (string) Str::uuid()),
                'mime_type' => 'image/jpeg',
                'file_size_bytes' => mt_rand(100000, 5000000),
                'captured_at' => $ticket->created_at,
                'exif_removed_at' => $ticket->created_at,
                'yolo_status' => ['pending', 'completed', 'completed'][array_rand(['pending', 'completed', 'completed'])],
                'created_at' => $ticket->created_at,
                'updated_at' => $now,
            ]);
        }

        // ── Reports ─────────────────────────────────────────────────────
        foreach ($tickets->take(10) as $ticket) {
            $evidence = $ticket->evidence()->first();
            Report::create([
                'user_id' => $ticket->reporter_user_id,
                'latitude' => $ticket->latitude,
                'longitude' => $ticket->longitude,
                'image_path' => $evidence?->storage_path ?? 'evidence/default.jpg',
                'image_size' => $evidence?->file_size_bytes ?? 0,
                'storage_disk' => 'local',
                'created_at' => $ticket->created_at,
                'updated_at' => $now,
            ]);
        }

        // Ghost report
        Report::create([
            'user_id' => null,
            'latitude' => 14.5500,
            'longitude' => 121.0100,
            'image_path' => 'evidence/ghost/anonymous_submission.jpg',
            'image_size' => 2048576,
            'storage_disk' => 'local',
            'created_at' => $now->copy()->subHours(2),
            'updated_at' => $now,
        ]);

        // ── NGOs ─────────────────────────────────────────────────────────
        $ngos = [
            ['name' => 'Green Earth Coalition', 'region' => 'NCR', 'contact_email' => 'contact@greenearth.org', 'contact_phone' => '+63 912 345 6789'],
            ['name' => 'Clean Rivers Foundation', 'region' => 'Region IV-A', 'contact_email' => 'hello@cleanrivers.org', 'contact_phone' => '+63 998 765 4321'],
            ['name' => 'Philippine Reef Patrol', 'region' => 'Region VII', 'contact_email' => 'reef@philreefs.org', 'contact_phone' => '+63 917 234 5678'],
            ['name' => 'Forest Guardians PH', 'region' => 'CAR', 'contact_email' => 'guardians@forests.ph', 'contact_phone' => '+63 956 789 0123'],
            ['name' => 'Save Sierra Madre Alliance', 'region' => 'Region III', 'contact_email' => 'alliance@savesierra.ph', 'contact_phone' => '+63 945 678 9012'],
        ];

        $ngoIds = collect();
        foreach ($ngos as $ngo) {
            $ngoModel = NgoGroup::create([
                'name' => $ngo['name'],
                'region' => $ngo['region'],
                'contact_email' => $ngo['contact_email'],
                'contact_phone' => $ngo['contact_phone'],
                'is_active' => true,
            ]);
            $ngoIds->push($ngoModel->id);
        }
    }
}
