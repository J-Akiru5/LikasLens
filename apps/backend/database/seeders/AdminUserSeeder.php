<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    private string $supabaseUrl;

    private string $supabaseServiceKey;

    public function __construct()
    {
        $this->supabaseUrl = config('services.supabase.url') ?? env('NEXT_PUBLIC_SUPABASE_URL', 'https://sfklmmtimelotqvrldni.supabase.co');
        $this->supabaseServiceKey = env('SUPABASE_SERVICE_ROLE_KEY');
    }

    public function run(): void
    {
        if (empty($this->supabaseServiceKey)) {
            $this->command->error('SUPABASE_SERVICE_ROLE_KEY not set. Cannot create Supabase users.');

            return;
        }

        $users = [
            [
                'email' => 'admin@likaslens.ph',
                'password' => 'LikasLens2026!',
                'name' => 'Admin Reyes',
                'role' => 'super_admin',
            ],
            [
                'email' => 'analyst@likaslens.ph',
                'password' => 'LikasLens2026!',
                'name' => 'Juan Dela Cruz',
                'role' => 'analyst',
            ],
            [
                'email' => 'analyst2@likaslens.ph',
                'password' => 'LikasLens2026!',
                'name' => 'Maria Santos',
                'role' => 'analyst',
            ],
        ];

        foreach ($users as $userData) {
            $this->createAdminUser($userData);
        }

        $this->command->info('Admin and analyst users seeded successfully.');
    }

    private function createAdminUser(array $data): void
    {
        $email = $data['email'];

        // Check if user already exists in Laravel DB
        $existing = User::where('email', $email)->first();
        if ($existing) {
            $this->command->warn("User {$email} already exists in Laravel DB. Skipping.");

            return;
        }

        // Create user in Supabase Auth via Admin API
        $response = Http::withHeaders([
            'apikey' => $this->supabaseServiceKey,
            'Authorization' => 'Bearer '.$this->supabaseServiceKey,
            'Content-Type' => 'application/json',
        ])->post(rtrim($this->supabaseUrl, '/').'/auth/v1/admin/users', [
            'email' => $email,
            'password' => $data['password'],
            'email_confirm' => true,
            'user_metadata' => [
                'name' => $data['name'],
                'role' => $data['role'],
            ],
        ]);

        if ($response->failed()) {
            $body = $response->body();
            // Check if user already exists in Supabase
            if (str_contains($body, 'already been registered') || $response->status() === 422) {
                $this->command->warn("User {$email} already exists in Supabase. Syncing to Laravel DB...");
                $this->syncUserFromSupabase($email, $data);

                return;
            }
            $this->command->error("Failed to create Supabase user {$email}: {$body}");

            return;
        }

        $supabaseUser = $response->json();
        $authUserId = $supabaseUser['id'] ?? (string) Str::uuid();

        // Sync to Laravel DB
        User::updateOrCreate(
            ['email' => $email],
            [
                'supabase_auth_user_id' => $authUserId,
                'name' => $data['name'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'trust_score' => $data['role'] === 'super_admin' ? 100 : 92,
                'reward_points_balance' => $data['role'] === 'super_admin' ? 5000 : 3400,
            ]
        );

        $this->command->info("Created {$data['role']}: {$email} (Supabase ID: {$authUserId})");
    }

    private function syncUserFromSupabase(string $email, array $data): void
    {
        // Fetch user from Supabase to get the auth ID
        $response = Http::withHeaders([
            'apikey' => $this->supabaseServiceKey,
            'Authorization' => 'Bearer '.$this->supabaseServiceKey,
            'Content-Type' => 'application/json',
        ])->get(rtrim($this->supabaseUrl, '/').'/auth/v1/admin/users', [
            'email' => $email,
        ]);

        if ($response->failed()) {
            $this->command->error("Failed to fetch Supabase user {$email}: {$response->body()}");

            return;
        }

        $users = $response->json()['users'] ?? [];
        $supabaseUser = collect($users)->firstWhere('email', $email);

        if (! $supabaseUser) {
            $this->command->error("Could not find Supabase user {$email}");

            return;
        }

        $authUserId = $supabaseUser['id'];

        User::updateOrCreate(
            ['email' => $email],
            [
                'supabase_auth_user_id' => $authUserId,
                'name' => $data['name'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'trust_score' => $data['role'] === 'super_admin' ? 100 : 92,
                'reward_points_balance' => $data['role'] === 'super_admin' ? 5000 : 3400,
            ]
        );

        $this->command->info("Synced {$data['role']}: {$email} (Supabase ID: {$authUserId})");
    }
}
