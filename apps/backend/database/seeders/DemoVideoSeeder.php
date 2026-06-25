<?php

namespace Database\Seeders;

use App\Models\PartnerStore;
use App\Models\Report;
use App\Models\RewardPointLedger;
use App\Models\RewardsCatalog;
use App\Models\Ticket;
use App\Models\TicketEvidence;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoVideoSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── Partner Stores ────────────────────────────────────────────
        $stores = [
            ['name' => 'EcoBrew Coffee', 'category' => 'Food & Beverage', 'contact_name' => 'Ana Santos', 'contact_email' => 'ana@ecobrew.ph', 'city' => 'Iloilo City', 'province' => 'Iloilo'],
            ['name' => 'GreenBasket Market', 'category' => 'Grocery', 'contact_name' => 'Mark Lim', 'contact_email' => 'mark@greenbasket.ph', 'city' => 'Bacolod City', 'province' => 'Negros Occidental'],
            ['name' => 'Tides Surf Shop', 'category' => 'Retail', 'contact_name' => 'Jolo Reyes', 'contact_email' => 'jolo@tides.ph', 'city' => 'Siargao', 'province' => 'Surigao del Norte'],
            ['name' => 'Maligaya Pharmacy', 'category' => 'Health', 'contact_name' => 'Dr. Cruz', 'contact_email' => 'cruz@maligaya.ph', 'city' => 'Roxas City', 'province' => 'Capiz'],
            ['name' => 'Bamboo House Restaurant', 'category' => 'Food & Beverage', 'contact_name' => 'Liza Tan', 'contact_email' => 'liza@bamboohouse.ph', 'city' => 'Kalibo', 'province' => 'Aklan'],
        ];

        $storeIds = [];
        foreach ($stores as $store) {
            $s = PartnerStore::firstOrCreate(
                ['name' => $store['name']],
                array_merge($store, ['is_active' => true])
            );
            $storeIds[] = $s->id;
        }

        // ── Rewards Catalog ───────────────────────────────────────────
        $rewards = [
            ['store_idx' => 0, 'name' => 'Free Cold Brew', 'type' => 'voucher', 'cost' => 150, 'stock' => 100],
            ['store_idx' => 0, 'name' => '20% Off Any Drink', 'type' => 'voucher', 'cost' => 80, 'stock' => 200],
            ['store_idx' => 1, 'name' => 'Reusable Tote Bag', 'type' => 'merchandise', 'cost' => 200, 'stock' => 50],
            ['store_idx' => 1, 'name' => 'Organic Veggie Box', 'type' => 'voucher', 'cost' => 350, 'stock' => 30],
            ['store_idx' => 2, 'name' => 'Surf Wax Set', 'type' => 'merchandise', 'cost' => 250, 'stock' => 40],
            ['store_idx' => 2, 'name' => 'Rash Guard Discount', 'type' => 'voucher', 'cost' => 300, 'stock' => 25],
            ['store_idx' => 3, 'name' => 'Free Vitamins Pack', 'type' => 'voucher', 'cost' => 400, 'stock' => 60],
            ['store_idx' => 4, 'name' => 'Bamboo Utensil Set', 'type' => 'merchandise', 'cost' => 180, 'stock' => 80],
            ['store_idx' => 4, 'name' => 'Free Lunch Meal', 'type' => 'voucher', 'cost' => 500, 'stock' => 20],
        ];

        foreach ($rewards as $r) {
            RewardsCatalog::firstOrCreate(
                ['reward_name' => $r['name']],
                [
                    'partner_store_id' => $storeIds[$r['store_idx']],
                    'reward_type' => $r['type'],
                    'points_cost' => $r['cost'],
                    'stock_quantity' => $r['stock'],
                    'valid_from' => $now->copy()->subMonth(),
                    'valid_until' => $now->copy()->addYear(),
                    'is_active' => true,
                ]
            );
        }

        // ── Leaderboard Users (diverse Filipino names + points) ──────
        $leaderboardUsers = [
            ['name' => 'Maria Santos', 'email' => 'maria.santos@demo.ph', 'points' => 4250, 'trust' => 95],
            ['name' => 'Juan Dela Cruz', 'email' => 'juan.delacruz@demo.ph', 'points' => 3800, 'trust' => 92],
            ['name' => 'Ana Reyes', 'email' => 'ana.reyes@demo.ph', 'points' => 3200, 'trust' => 88],
            ['name' => 'Jose Garcia', 'email' => 'jose.garcia@demo.ph', 'points' => 2900, 'trust' => 85],
            ['name' => 'Patricia Cruz', 'email' => 'patricia.cruz@demo.ph', 'points' => 2650, 'trust' => 82],
            ['name' => 'Miguel Torres', 'email' => 'miguel.torres@demo.ph', 'points' => 2100, 'trust' => 78],
            ['name' => 'Sofia Mendoza', 'email' => 'sofia.mendoza@demo.ph', 'points' => 1850, 'trust' => 75],
            ['name' => 'Andres Villanueva', 'email' => 'andres.v@demo.ph', 'points' => 1500, 'trust' => 72],
            ['name' => 'Camille Lopez', 'email' => 'camille.lopez@demo.ph', 'points' => 1200, 'trust' => 68],
            ['name' => 'Rafael Bautista', 'email' => 'rafael.b@demo.ph', 'points' => 950, 'trust' => 65],
            ['name' => 'Isabella Santos', 'email' => 'isabella.s@demo.ph', 'points' => 750, 'trust' => 60],
            ['name' => 'Gabriel Ramos', 'email' => 'gabriel.r@demo.ph', 'points' => 500, 'trust' => 55],
        ];

        foreach ($leaderboardUsers as $lu) {
            $user = User::firstOrCreate(
                ['email' => $lu['email']],
                [
                    'supabase_auth_user_id' => (string) Str::uuid(),
                    'name' => $lu['name'],
                    'password' => bcrypt('password'),
                    'role' => 'citizen',
                    'trust_score' => $lu['trust'],
                    'reward_points_balance' => $lu['points'],
                ]
            );

            // Create ledger entries for each user
            $this->createLedgerEntries($user, $lu['points']);
        }

        // ── Ensure Maria Santos (demo citizen) has good data ─────────
        $maria = User::where('email', 'citizen@likaslens.ph')->first();
        if ($maria) {
            $maria->update([
                'reward_points_balance' => 1250,
                'trust_score' => 85,
            ]);
            $this->createLedgerEntries($maria, 1250);
        }

        // ── Ticket Evidence ───────────────────────────────────────────
        $tickets = Ticket::all();
        foreach ($tickets as $ticket) {
            TicketEvidence::firstOrCreate(
                ['ticket_id' => $ticket->id],
                [
                    'uploaded_by_user_id' => $ticket->reporter_user_id,
                    'storage_provider' => 'local',
                    'storage_bucket' => 'evidence',
                    'storage_path' => 'evidence/'.$ticket->created_at->format('Y/m/d').'/'.Str::uuid().'.jpg',
                    'checksum_sha256' => hash('sha256', Str::uuid().$ticket->id),
                    'mime_type' => 'image/jpeg',
                    'file_size_bytes' => mt_rand(200000, 5000000),
                    'captured_at' => $ticket->created_at,
                    'exif_removed_at' => $ticket->created_at,
                    'yolo_status' => 'completed',
                    'created_at' => $ticket->created_at,
                    'updated_at' => $now,
                ]
            );
        }

        // ── Reports from leaderboard users ────────────────────────────
        $demoUsers = User::where('email', 'like', '%@demo.ph')->get();
        $reportTickets = $tickets->random(min($tickets->count(), 15));

        foreach ($reportTickets as $i => $ticket) {
            $user = $demoUsers[$i % $demoUsers->count()];
            Report::create([
                'user_id' => $user->id,
                'latitude' => $ticket->latitude + (mt_rand(-50, 50) / 10000),
                'longitude' => $ticket->longitude + (mt_rand(-50, 50) / 10000),
                'image_path' => 'evidence/'.$ticket->created_at->format('Y/m/d').'/'.Str::uuid().'.jpg',
                'image_size' => mt_rand(500000, 4000000),
                'storage_disk' => 'local',
                'status' => 'submitted',
                'created_at' => $ticket->created_at,
                'updated_at' => $now,
            ]);
        }

        $this->command->info('Demo video seeder completed successfully.');
        $this->command->info('Partner Stores: '.PartnerStore::count());
        $this->command->info('Rewards: '.RewardsCatalog::count());
        $this->command->info('Ledger Entries: '.RewardPointLedger::count());
        $this->command->info('Ticket Evidence: '.TicketEvidence::count());
        $this->command->info('Reports: '.Report::count());
    }

    private function createLedgerEntries(User $user, int $totalPoints): void
    {
        // Skip if ledger already exists for this user
        if (RewardPointLedger::where('user_id', $user->id)->exists()) {
            return;
        }

        $now = now();
        $balance = 0;
        $entries = [];

        // Create 5-8 earning entries that sum close to totalPoints
        $numEntries = mt_rand(5, 8);
        $pointsPerEntry = (int) ($totalPoints / $numEntries);

        for ($i = 0; $i < $numEntries; $i++) {
            $pts = $i === $numEntries - 1
                ? $totalPoints - $balance  // last entry gets remainder
                : mt_rand((int) ($pointsPerEntry * 0.5), (int) ($pointsPerEntry * 1.5));

            $pts = max(10, $pts);
            $balance += $pts;

            $entries[] = [
                'user_id' => $user->id,
                'reference_type' => ['report_submit', 'report_verified', 'achievement_unlock'][$i % 3],
                'reference_id' => (string) Str::uuid(),
                'direction' => 'credit',
                'points' => $pts,
                'balance_after' => $balance,
                'notes' => [
                    'Report submitted and verified',
                    'LGU verified environmental report',
                    'Achievement unlocked: Sharp Shooter',
                ][$i % 3],
                'created_at' => $now->copy()->subDays(mt_rand(1, 60)),
            ];
        }

        // Add 1-2 redemption entries
        for ($i = 0; $i < mt_rand(1, 2); $i++) {
            $pts = mt_rand(50, 200);
            $balance -= $pts;

            $entries[] = [
                'user_id' => $user->id,
                'reference_type' => 'reward_redemption',
                'reference_id' => (string) Str::uuid(),
                'direction' => 'debit',
                'points' => $pts,
                'balance_after' => $balance,
                'notes' => 'Redeemed: '.['Free Cold Brew', 'Reusable Tote Bag', 'Bamboo Utensil Set'][$i % 3],
                'created_at' => $now->copy()->subDays(mt_rand(1, 14)),
            ];
        }

        foreach ($entries as $entry) {
            RewardPointLedger::create($entry);
        }
    }
}
