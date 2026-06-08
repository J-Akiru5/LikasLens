<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\CitizenWallet;
use App\Models\CreditPool;
use App\Models\NgoGroup;
use App\Models\Ticket;
use App\Models\TicketAssignment;
use App\Models\TicketClassification;
use App\Models\TicketEvidence;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\ViolationType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ═══════════════════════════════════════════════════════════════
        // 1. USERS (8)
        // ═══════════════════════════════════════════════════════════════
        $maria = User::firstOrCreate(
            ['email' => 'maria.santos@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Maria Santos',
                'password' => Hash::make('password'),
                'role' => 'citizen',
                'trust_score' => 92,
                'reward_points_balance' => 4500,
                'total_verified_reports' => 27,
                'total_xp' => 8750,
                'ranking_tier' => 3,
            ]
        );

        $juan = User::firstOrCreate(
            ['email' => 'juan.delacruz@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Juan dela Cruz',
                'password' => Hash::make('password'),
                'role' => 'citizen',
                'trust_score' => 38,
                'reward_points_balance' => 120,
                'total_verified_reports' => 3,
                'total_xp' => 340,
                'ranking_tier' => 1,
            ]
        );

        $ana = User::firstOrCreate(
            ['email' => 'ana.reyes@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Ana Reyes',
                'password' => Hash::make('password'),
                'role' => 'citizen',
                'trust_score' => 0,
                'reward_points_balance' => 0,
                'total_verified_reports' => 15,
                'total_xp' => 2200,
                'ranking_tier' => 2,
            ]
        );

        $carlo = User::firstOrCreate(
            ['email' => 'carlo.mendoza@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Carlo Mendoza',
                'password' => Hash::make('password'),
                'role' => 'analyst',
                'trust_score' => 88,
                'reward_points_balance' => 6700,
                'total_verified_reports' => 42,
                'total_xp' => 12300,
                'ranking_tier' => 3,
            ]
        );

        $admin = User::firstOrCreate(
            ['email' => 'super.admin@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'trust_score' => 100,
                'reward_points_balance' => 10000,
                'total_verified_reports' => 0,
                'total_xp' => 0,
                'ranking_tier' => 1,
            ]
        );

        $citizen1 = User::firstOrCreate(
            ['email' => 'ricardo.gomez@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Ricardo Gomez',
                'password' => Hash::make('password'),
                'role' => 'citizen',
                'trust_score' => 74,
                'reward_points_balance' => 2100,
                'total_verified_reports' => 12,
                'total_xp' => 3400,
                'ranking_tier' => 2,
            ]
        );

        $citizen2 = User::firstOrCreate(
            ['email' => 'lorna.bautista@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Lorna Bautista',
                'password' => Hash::make('password'),
                'role' => 'citizen',
                'trust_score' => 65,
                'reward_points_balance' => 950,
                'total_verified_reports' => 8,
                'total_xp' => 1800,
                'ranking_tier' => 2,
            ]
        );

        $citizen3 = User::firstOrCreate(
            ['email' => 'pedro.estrada@likaslens.ph'],
            [
                'supabase_auth_user_id' => (string) Str::uuid(),
                'name' => 'Pedro Estrada',
                'password' => Hash::make('password'),
                'role' => 'citizen',
                'trust_score' => 81,
                'reward_points_balance' => 3800,
                'total_verified_reports' => 19,
                'total_xp' => 5600,
                'ranking_tier' => 3,
            ]
        );

        $allUsers = [
            'maria' => $maria,
            'juan' => $juan,
            'ana' => $ana,
            'carlo' => $carlo,
            'admin' => $admin,
            'citizen1' => $citizen1,
            'citizen2' => $citizen2,
            'citizen3' => $citizen3,
        ];

        // ═══════════════════════════════════════════════════════════════
        // 2. NGOs (5)
        // ═══════════════════════════════════════════════════════════════
        $ngoData = [
            [
                'name' => 'Green Dingle Initiative',
                'focus_area' => 'Watershed Protection & Reforestation',
                'region' => 'Region VI',
                'province' => 'Aklan',
                'city_municipality' => 'Malay',
                'contact_email' => 'info@greendingle.org',
                'contact_phone' => '+63 936 123 4567',
                'is_verified' => true,
            ],
            [
                'name' => 'Bantay Kalikasan',
                'focus_area' => 'River Cleanup & Solid Waste Management',
                'region' => 'Region VI',
                'province' => 'Iloilo',
                'city_municipality' => 'Iloilo City',
                'contact_email' => 'bantay@kalikasan.ph',
                'contact_phone' => '+63 917 234 5678',
                'is_verified' => true,
            ],
            [
                'name' => 'Coastal Guardians PH',
                'focus_area' => 'Marine Conservation & Coral Reef Restoration',
                'region' => 'Region VI',
                'province' => 'Guimaras',
                'city_municipality' => 'Jordan',
                'contact_email' => 'patrol@coastalguardians.ph',
                'contact_phone' => '+63 998 345 6789',
                'is_verified' => true,
            ],
            [
                'name' => 'Forest Watch Negros',
                'focus_area' => 'Forest Protection & Anti-Poaching',
                'region' => 'Region VI',
                'province' => 'Negros Occidental',
                'city_municipality' => 'Silay',
                'contact_email' => 'alert@forestwatchnegros.org',
                'contact_phone' => '+63 945 456 7890',
                'is_verified' => true,
            ],
            [
                'name' => 'Panay Eco Warriors',
                'focus_area' => 'Biodiversity Conservation & Indigenous Land Rights',
                'region' => 'Region VI',
                'province' => 'Antique',
                'city_municipality' => 'Sibalom',
                'contact_email' => 'warriors@panayeco.ph',
                'contact_phone' => '+63 956 567 8901',
                'is_verified' => true,
            ],
        ];

        $ngos = [];
        foreach ($ngoData as $data) {
            $ngos[] = NgoGroup::firstOrCreate(
                ['name' => $data['name']],
                [
                    'focus_area' => $data['focus_area'],
                    'region' => $data['region'],
                    'province' => $data['province'],
                    'city_municipality' => $data['city_municipality'],
                    'contact_email' => $data['contact_email'],
                    'contact_phone' => $data['contact_phone'],
                    'is_active' => true,
                    'is_verified' => $data['is_verified'],
                ]
            );
        }
        $ngoGreenDingle = $ngos[0];
        $ngoBantayKalikasan = $ngos[1];
        $ngoCoastalGuard = $ngos[2];
        $ngoForestWatch = $ngos[3];
        $ngoPanayEco = $ngos[4];

        // ═══════════════════════════════════════════════════════════════
        // 3. CREDIT POOL (System Pool)
        // ═══════════════════════════════════════════════════════════════
        CreditPool::firstOrCreate(
            ['sponsor_name' => 'San Miguel ESG Demo Pool'],
            [
                'sponsor_type' => 'corporate',
                'contact_email' => 'esg@sanmiguel.com.ph',
                'total_credits' => 1000000,
                'remaining_credits' => 1000000,
                'valid_from' => $now,
                'valid_until' => $now->copy()->addYears(5),
                'is_active' => true,
            ]
        );

        // ═══════════════════════════════════════════════════════════════
        // 4. ECO-CREDIT WALLETS
        // ═══════════════════════════════════════════════════════════════
        CitizenWallet::firstOrCreate(
            ['user_id' => $maria->id],
            [
                'available_credits' => 2500,
                'lifetime_earned' => 5000,
            ]
        );

        CitizenWallet::firstOrCreate(
            ['user_id' => $juan->id],
            [
                'available_credits' => 150,
                'lifetime_earned' => 200,
            ]
        );

        // ═══════════════════════════════════════════════════════════════
        // 5. USER ACHIEVEMENTS (Demo unlocks for leaderboard depth)
        // ═══════════════════════════════════════════════════════════════
        $allAchievements = Achievement::all()->keyBy('name');
        $achNow = $now->copy()->subDays(mt_rand(1, 30));

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

        // Maria Santos — top citizen, Steward level
        foreach (['First Report', 'Hawk Eye', 'Water Guardian', 'Pollution Buster', 'Community Watchdog', 'Sharp Shooter'] as $name) {
            $setAchievement($maria, $name, null, $achNow);
        }
        $setAchievement($maria, 'Environmental Guardian', 1, $achNow->copy()->subDays(3));
        $setAchievement($maria, 'Forest Sentinel', 2, null);
        $setAchievement($maria, 'Truth Seeker', 4, null);
        $setAchievement($maria, 'Perimeter Patrol', 3, null);

        // Juan dela Cruz — newbie citizen
        $setAchievement($juan, 'First Report', 1, $achNow->copy()->subDays(14));

        // Pedro Estrada — high-tier citizen
        foreach (['First Report', 'Hawk Eye', 'Sharp Shooter'] as $name) {
            $setAchievement($citizen3, $name, null, $achNow->copy()->subDays(mt_rand(5, 20)));
        }
        $setAchievement($citizen3, 'Environmental Guardian', 1, $achNow->copy()->subDays(5));
        $setAchievement($citizen3, 'Pollution Buster', 1, $achNow->copy()->subDays(7));

        // Ricardo Gomez — mid-tier citizen
        foreach (['First Report', 'Pollution Buster', 'Sharp Shooter'] as $name) {
            $setAchievement($citizen1, $name, null, $achNow->copy()->subDays(mt_rand(5, 25)));
        }
        $setAchievement($citizen1, 'Environmental Guardian', 1, $achNow->copy()->subDays(4));
        $setAchievement($citizen1, 'Forest Sentinel', 2, null);

        // Lorna Bautista — mid-tier citizen
        foreach (['First Report', 'Water Guardian', 'Sharp Shooter'] as $name) {
            $setAchievement($citizen2, $name, null, $achNow->copy()->subDays(mt_rand(7, 21)));
        }

        // Ana Reyes — ghost-mode citizen
        $setAchievement($ana, 'First Report', 1, $achNow->copy()->subDays(28));
        $setAchievement($ana, 'Offline Warrior', 1, $achNow->copy()->subDays(20));
        $setAchievement($ana, 'Ghost in the Machine', 8, null);

        // ═══════════════════════════════════════════════════════════════
        // 6. TICKETS (18) — Western Visayas, varied statuses & violation types
        // ═══════════════════════════════════════════════════════════════

        // Only seed tickets if they don't already exist
        if (Ticket::where('title', 'Oil Spill Near Boracay Shoreline')->exists()) {
            return;
        }

        $ticketData = [
            // ── AKLAN ────────────────────────────────────────────────
            [
                'title' => 'Oil Spill Near Boracay Shoreline',
                'status' => 'investigating',
                'description' => 'Dark oil slick observed along the western shoreline of Boracay Island near Station 1. Approximately 200 meters of coastline affected. Dead fish and seabirds spotted. Coast Guard notified.',
                'latitude' => 11.9674,
                'longitude' => 121.9248,
                'address_text' => 'Station 1, White Beach, Malay, Aklan',
                'urgency_score' => 5,
                'ai_triage_summary' => 'Marine Pollution — high-confidence oil slick detection via satellite and drone imagery cross-referenced with PCG reports.',
                'ai_confidence' => 0.96,
                'reporter' => 'citizen1',
                'resolved_at' => null,
            ],
            [
                'title' => 'Mangrove Clearing in Kalibo Wetlands',
                'status' => 'open',
                'description' => 'Illegal mangrove clearing operation discovered along the Kalibo River estuary. At least 0.5 hectares of young mangroves cut down. Heavy equipment spotted on site.',
                'latitude' => 11.7077,
                'longitude' => 122.3643,
                'address_text' => 'Kalibo River Estuary, Kalibo, Aklan',
                'urgency_score' => 4,
                'ai_triage_summary' => 'Mangrove Destruction — vegetation loss detected via NDVI change analysis over 14-day period.',
                'ai_confidence' => 0.91,
                'reporter' => 'maria',
                'resolved_at' => null,
            ],
            [
                'title' => 'Numancia Landfill Leachate Contamination',
                'status' => 'monitoring',
                'description' => 'Leachate from the Numancia municipal landfill has breached containment, seeping into adjacent farmland. Water samples show elevated heavy metal levels.',
                'latitude' => 11.7180,
                'longitude' => 122.3300,
                'address_text' => 'Municipal Landfill, Numancia, Aklan',
                'urgency_score' => 3,
                'ai_triage_summary' => 'Hazardous Waste — leachate plume mapped via soil conductivity sensors and water quality tests.',
                'ai_confidence' => 0.88,
                'reporter' => 'citizen2',
                'resolved_at' => null,
            ],

            // ── ANTIQUE ──────────────────────────────────────────────
            [
                'title' => 'Sibalom Forest Illegal Logging Operation',
                'status' => 'investigating',
                'description' => 'Unauthorized chainsaw operations inside the Sibalom Natural Park buffer zone. Several old-growth Narra trees felled. DENR rangers deployed.',
                'latitude' => 10.7900,
                'longitude' => 122.0170,
                'address_text' => 'Sibalom Natural Park, Sibalom, Antique',
                'urgency_score' => 5,
                'ai_triage_summary' => 'Illegal Logging — chainsaw acoustic signatures matched against DENR patrol audio logs.',
                'ai_confidence' => 0.97,
                'reporter' => 'citizen1',
                'resolved_at' => null,
            ],
            [
                'title' => 'Fish Kill in San Jose Coastal Waters',
                'status' => 'resolved',
                'description' => 'Mass fish kill reported along a 3-kilometer stretch of coastline near San Jose. Source traced to an illegal wastewater discharge from a nearby fish processing plant.',
                'latitude' => 10.7440,
                'longitude' => 121.9435,
                'address_text' => 'Barangay Funda-Dalipe Coastal, San Jose, Antique',
                'urgency_score' => 5,
                'ai_triage_summary' => 'Water Pollution — water samples confirmed elevated ammonia and BOD levels. Plant issued a cease-and-desist order.',
                'ai_confidence' => 0.93,
                'reporter' => 'maria',
                'resolved_at' => '2026-06-01 14:00:00',
            ],
            [
                'title' => 'Culasi Marine Turtle Nesting Site Disturbance',
                'status' => 'open',
                'description' => 'Marine turtle nesting site at Culasi beach disrupted by unauthorized beachfront construction. Freshly laid turtle eggs found crushed during active nesting season.',
                'latitude' => 11.4260,
                'longitude' => 122.0550,
                'address_text' => 'Barangay Malalison Beach, Culasi, Antique',
                'urgency_score' => 4,
                'ai_triage_summary' => 'Wildlife Protection — turtle nest geo-locations cross-referenced with construction permit boundaries.',
                'ai_confidence' => 0.92,
                'reporter' => 'citizen2',
                'resolved_at' => null,
            ],

            // ── CAPIZ ────────────────────────────────────────────────
            [
                'title' => 'Roxas City Fish Port Waste Discharge',
                'status' => 'open',
                'description' => 'Untreated fish processing waste and bloodwater discharged directly into the sea from the Roxas City fish port complex. Strong odor complaints from nearby residents.',
                'latitude' => 11.5853,
                'longitude' => 122.7511,
                'address_text' => 'Roxas City Fish Port, Roxas City, Capiz',
                'urgency_score' => 4,
                'ai_triage_summary' => 'Marine Pollution — effluent plume detected via multispectral satellite imagery.',
                'ai_confidence' => 0.89,
                'reporter' => 'juan',
                'resolved_at' => null,
            ],
            [
                'title' => 'Panay Riverbank Collapse Rehabilitation',
                'status' => 'resolved',
                'description' => 'A 50-meter section of the Panay River riverbank collapsed due to heavy monsoon rains. DPWH completed rehabilitation and slope stabilization. Vegetative cover re-established.',
                'latitude' => 11.5560,
                'longitude' => 122.7920,
                'address_text' => 'Panay River, Panay, Capiz',
                'urgency_score' => 2,
                'ai_triage_summary' => 'Land Use — erosion risk model confirmed slope failure probability >85% pre-remediation.',
                'ai_confidence' => 0.95,
                'reporter' => 'citizen3',
                'resolved_at' => '2026-05-28 10:30:00',
            ],
            [
                'title' => 'Pontevedra Sugarcane Field Burning',
                'status' => 'open',
                'description' => 'Widespread sugarcane field burning across Pontevedra during harvest season. Air quality has reached hazardous levels. Nearby schools suspended classes.',
                'latitude' => 11.4830,
                'longitude' => 122.8350,
                'address_text' => 'Barangay San Juan Farmlands, Pontevedra, Capiz',
                'urgency_score' => 3,
                'ai_triage_summary' => 'Air Quality — thermal hotspots detected via MODIS satellite fire detection.',
                'ai_confidence' => 0.87,
                'reporter' => 'juan',
                'resolved_at' => null,
            ],

            // ── GUIMARAS ─────────────────────────────────────────────
            [
                'title' => 'Jordan Marine Protected Area Intrusion',
                'status' => 'monitoring',
                'description' => 'Commercial fishing vessels repeatedly encroaching into the Jordan Marine Protected Area. Local bantay dagat volunteers report inadequate enforcement.',
                'latitude' => 10.6598,
                'longitude' => 122.5959,
                'address_text' => 'Jordan MPA, Jordan, Guimaras',
                'urgency_score' => 3,
                'ai_triage_summary' => 'Protected Area Violation — vessel tracking AIS data cross-referenced with MPA boundary polygons.',
                'ai_confidence' => 0.86,
                'reporter' => 'citizen2',
                'resolved_at' => null,
            ],
            [
                'title' => 'Buenavista Open Dumpsite Fire',
                'status' => 'resolved',
                'description' => 'Spontaneous combustion fire at the Buenavista open dumpsite burned for 3 days, releasing toxic smoke. BFP extinguished. Site now cordoned and capped.',
                'latitude' => 10.7030,
                'longitude' => 122.6270,
                'address_text' => 'Municipal Dumpsite, Buenavista, Guimaras',
                'urgency_score' => 2,
                'ai_triage_summary' => 'Waste Management — thermal anomaly detection triggered automated alert to BFP and EMB.',
                'ai_confidence' => 0.91,
                'reporter' => 'citizen3',
                'resolved_at' => '2026-05-25 08:00:00',
            ],
            [
                'title' => 'Nueva Valencia Sea Grass Degradation',
                'status' => 'monitoring',
                'description' => 'Sea grass beds in Nueva Valencia showing significant degradation. Decline linked to increased boat traffic and anchor damage from unregulated tourism.',
                'latitude' => 10.5150,
                'longitude' => 122.5400,
                'address_text' => 'Tando Island Waters, Nueva Valencia, Guimaras',
                'urgency_score' => 3,
                'ai_triage_summary' => 'Marine Ecosystem Damage — seagrass density change mapped via Sentinel-2 benthic habitat analysis.',
                'ai_confidence' => 0.83,
                'reporter' => 'maria',
                'resolved_at' => null,
            ],

            // ── ILOILO ───────────────────────────────────────────────
            [
                'title' => 'Iloilo River Domestic Waste Pollution',
                'status' => 'monitoring',
                'description' => 'Elevated fecal coliform levels in Iloilo River water samples. Source traced to informal settlements lacking proper sanitation along the riverbank.',
                'latitude' => 10.7202,
                'longitude' => 122.5621,
                'address_text' => 'Iloilo River, near Molo Bridge, Iloilo City',
                'urgency_score' => 3,
                'ai_triage_summary' => 'Water Quality — coliform levels exceed DENR Class C standards by 12x based on 3 sampling stations.',
                'ai_confidence' => 0.92,
                'reporter' => 'citizen1',
                'resolved_at' => null,
            ],
            [
                'title' => 'Dingle Watershed Flash Flood Rehabilitation',
                'status' => 'resolved',
                'description' => 'Flash flood caused by deforestation in upper Dingle watershed damaged 30 homes and 3 irrigation canals. Relief completed. Reforestation of 15 hectares underway.',
                'latitude' => 10.9975,
                'longitude' => 122.6717,
                'address_text' => 'Barangay Lumboy, Dingle, Iloilo',
                'urgency_score' => 2,
                'ai_triage_summary' => 'Environmental Hazard — flood model correlated with forest cover loss data from Global Forest Watch.',
                'ai_confidence' => 0.93,
                'reporter' => 'maria',
                'resolved_at' => '2026-05-20 16:00:00',
            ],
            [
                'title' => 'Oton Shoreline Plastic Accumulation',
                'status' => 'open',
                'description' => 'Massive accumulation of plastic debris along Oton shoreline following recent typhoon. Community cleanup overwhelmed by volume. Estimated 5 tons collected so far.',
                'latitude' => 10.6930,
                'longitude' => 122.4740,
                'address_text' => 'Barangay Trapiche Shoreline, Oton, Iloilo',
                'urgency_score' => 3,
                'ai_triage_summary' => 'Solid Waste — debris density mapped via drone survey; 80% single-use plastics identified.',
                'ai_confidence' => 0.84,
                'reporter' => 'juan',
                'resolved_at' => null,
            ],

            // ── NEGROS OCCIDENTAL ────────────────────────────────────
            [
                'title' => 'Bacolod Smog Alert: Cane Field Burning',
                'status' => 'open',
                'description' => 'Air quality in Bacolod reached hazardous levels due to widespread sugar cane field burning. Respiratory cases up 40% this week in hospitals.',
                'latitude' => 10.6713,
                'longitude' => 122.9511,
                'address_text' => 'Bacolod City Metro, Negros Occidental',
                'urgency_score' => 4,
                'ai_triage_summary' => 'Air Quality — PM2.5 readings exceeded 250 µg/m³ at 3 EMB monitoring stations.',
                'ai_confidence' => 0.94,
                'reporter' => 'citizen3',
                'resolved_at' => null,
            ],
            [
                'title' => 'Northern Negros Natural Park Poaching',
                'status' => 'investigating',
                'description' => 'Suspected poaching activity inside NNNP near Silay. Traps and snares discovered. Critically endangered Visayan warty pig and Negros bleeding-heart pigeon at risk.',
                'latitude' => 10.8000,
                'longitude' => 123.0000,
                'address_text' => 'NNNP - Patag Sector, Silay, Negros Occidental',
                'urgency_score' => 5,
                'ai_triage_summary' => 'Wildlife Trafficking — camera trap images matched against known poacher profiles in PAWB database.',
                'ai_confidence' => 0.95,
                'reporter' => 'maria',
                'resolved_at' => null,
            ],
            [
                'title' => 'Victorias Sugar Mill Wastewater Spill',
                'status' => 'investigating',
                'description' => 'Untreated molasses wastewater from Victorias sugar mill overflowed into Malihao River. Water turned dark brown with foul odor for 5 km downstream.',
                'latitude' => 10.9000,
                'longitude' => 123.0700,
                'address_text' => 'Malihao River, Victorias, Negros Occidental',
                'urgency_score' => 5,
                'ai_triage_summary' => 'Water Pollution — BOD levels 35x above DENR effluent standards. Fish kill documented.',
                'ai_confidence' => 0.97,
                'reporter' => 'citizen1',
                'resolved_at' => null,
            ],
        ];

        // ── Build reporter map ───────────────────────────────────────
        $reporterMap = [
            'maria' => $maria->id,
            'juan' => $juan->id,
            'ana' => $ana->id,
            'carlo' => $carlo->id,
            'admin' => $admin->id,
            'citizen1' => $citizen1->id,
            'citizen2' => $citizen2->id,
            'citizen3' => $citizen3->id,
        ];

        // ── Violation type mapping ───────────────────────────────────
        $violationTypes = ViolationType::all()->keyBy('code');

        $ticketViolationMap = [
            'Oil Spill Near Boracay Shoreline' => 'MARINE-POLLUTION',
            'Mangrove Clearing in Kalibo Wetlands' => 'MANGROVE-DESTRUCTION',
            'Numancia Landfill Leachate Contamination' => 'HAZWASTE-HANDLING',
            'Sibalom Forest Illegal Logging Operation' => 'ILLEGAL-LOGGING',
            'Fish Kill in San Jose Coastal Waters' => 'WATER-UNAUTHORIZED-DISCHARGE',
            'Culasi Marine Turtle Nesting Site Disturbance' => 'WILDLIFE-TRAFFICKING',
            'Roxas City Fish Port Waste Discharge' => 'MARINE-POLLUTION',
            'Panay Riverbank Collapse Rehabilitation' => 'PROTECTED-AREA-INTRUSION',
            'Pontevedra Sugarcane Field Burning' => 'OPEN-BURNING',
            'Jordan Marine Protected Area Intrusion' => 'PROTECTED-AREA-INTRUSION',
            'Buenavista Open Dumpsite Fire' => 'SWM-ILLEGAL-DUMPING',
            'Nueva Valencia Sea Grass Degradation' => 'CORAL-REEF-DAMAGE',
            'Iloilo River Domestic Waste Pollution' => 'WATER-UNAUTHORIZED-DISCHARGE',
            'Dingle Watershed Flash Flood Rehabilitation' => 'ILLEGAL-LOGGING',
            'Oton Shoreline Plastic Accumulation' => 'SWM-ILLEGAL-DUMPING',
            'Bacolod Smog Alert: Cane Field Burning' => 'AIR-EMISSION-VIOLATION',
            'Northern Negros Natural Park Poaching' => 'WILDLIFE-TRAFFICKING',
            'Victorias Sugar Mill Wastewater Spill' => 'WATER-UNAUTHORIZED-DISCHARGE',
        ];

        // ── NGO assignment map (for resolved + investigating tickets) ─
        $ticketNgoMap = [
            'Oil Spill Near Boracay Shoreline' => $ngoCoastalGuard,
            'Mangrove Clearing in Kalibo Wetlands' => $ngoGreenDingle,
            'Sibalom Forest Illegal Logging Operation' => $ngoPanayEco,
            'Fish Kill in San Jose Coastal Waters' => $ngoPanayEco,
            'Buenavista Open Dumpsite Fire' => $ngoCoastalGuard,
            'Dingle Watershed Flash Flood Rehabilitation' => $ngoGreenDingle,
            'Northern Negros Natural Park Poaching' => $ngoForestWatch,
            'Victorias Sugar Mill Wastewater Spill' => $ngoForestWatch,
        ];

        $createdTickets = [];

        foreach ($ticketData as $data) {
            $ticket = Ticket::create([
                'reporter_user_id' => $reporterMap[$data['reporter']],
                'status' => $data['status'],
                'title' => $data['title'],
                'description' => $data['description'],
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'address_text' => $data['address_text'],
                'urgency_score' => $data['urgency_score'],
                'ai_triage_summary' => $data['ai_triage_summary'],
                'ai_confidence' => $data['ai_confidence'],
                'resolved_at' => $data['resolved_at'],
                'created_at' => $now->copy()->subHours(rand(1, 720)),
                'updated_at' => $now,
            ]);

            $createdTickets[$data['title']] = $ticket;

            // ── Ticket Evidence ────────────────────────────────────
            TicketEvidence::create([
                'ticket_id' => $ticket->id,
                'uploaded_by_user_id' => $ticket->reporter_user_id,
                'storage_provider' => 'local',
                'storage_bucket' => 'local',
                'storage_path' => 'evidence/'.$ticket->created_at->format('Y/m/d').'/'.Str::uuid7().'.jpg',
                'checksum_sha256' => hash('sha256', (string) Str::uuid()),
                'mime_type' => 'image/jpeg',
                'file_size_bytes' => rand(100000, 5000000),
                'captured_at' => $ticket->created_at,
                'exif_removed_at' => $ticket->created_at,
                'yolo_status' => ['pending', 'completed', 'completed'][array_rand(['pending', 'completed', 'completed'])],
                'created_at' => $ticket->created_at,
                'updated_at' => $now,
            ]);

            // ── Ticket Classification ──────────────────────────────
            $violationCode = $ticketViolationMap[$data['title']] ?? null;
            if ($violationCode && isset($violationTypes[$violationCode])) {
                TicketClassification::create([
                    'ticket_id' => $ticket->id,
                    'violation_type_id' => $violationTypes[$violationCode]->id,
                    'classified_by' => 'ai',
                    'confidence_score' => round($data['ai_confidence'] - mt_rand(0, 5) / 100, 4),
                ]);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 7. TICKET ASSIGNMENTS (8 tickets → NGOs)
        // ═══════════════════════════════════════════════════════════════
        foreach ($ticketNgoMap as $ticketTitle => $ngoGroup) {
            if (! isset($createdTickets[$ticketTitle])) {
                continue;
            }
            $ticket = $createdTickets[$ticketTitle];

            TicketAssignment::create([
                'ticket_id' => $ticket->id,
                'assigned_group_id' => $ngoGroup->id,
                'assigned_by_user_id' => $admin->id,
                'status' => $ticket->status === 'resolved' ? 'completed' : 'assigned',
                'assignment_reason' => sprintf(
                    'Auto-assigned based on %s jurisdiction and focus area match.',
                    $ngoGroup->province
                ),
                'completed_at' => $ticket->status === 'resolved' ? $ticket->resolved_at : null,
                'created_at' => $ticket->created_at,
                'updated_at' => $now,
            ]);
        }
    }
}
