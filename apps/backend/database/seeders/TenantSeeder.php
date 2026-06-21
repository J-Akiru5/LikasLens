<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    /**
     * Seed the default tenant.
     *
     * Every installation needs at least one tenant. The "default" tenant
     * serves as the primary/Philippines-wide instance and provides backward
     * compatibility for existing single-tenant deployments.
     */
    public function run(): void
    {
        Tenant::firstOrCreate(
            ['slug' => 'default'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'LikasLens Philippines',
                'slug' => 'default',
                'domain' => 'likaslens.org',
                'branding' => [
                    'primary_color' => '#1b4332',
                    'logo_url' => null,
                    'favicon_url' => null,
                ],
                'config' => [
                    'features' => ['reports', 'tickets', 'leaderboard', 'rewards', 'chat', 'map'],
                    'limits' => [
                        'max_reports_per_day' => 50,
                        'max_users' => null,
                    ],
                ],
                'country_code' => 'PH',
                'timezone' => 'Asia/Manila',
                'is_active' => true,
            ]
        );

        // Demo tenant for Cebu (used in multi-tenant testing)
        Tenant::firstOrCreate(
            ['slug' => 'cebu'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'City of Cebu',
                'slug' => 'cebu',
                'domain' => 'cebu.likaslens.org',
                'branding' => [
                    'primary_color' => '#00573F',
                    'logo_url' => null,
                    'favicon_url' => null,
                ],
                'config' => [
                    'features' => ['reports', 'tickets', 'leaderboard', 'map'],
                    'limits' => [
                        'max_reports_per_day' => 30,
                        'max_users' => 10000,
                    ],
                ],
                'country_code' => 'PH',
                'timezone' => 'Asia/Manila',
                'is_active' => true,
            ]
        );

        // Demo tenant for Davao
        Tenant::firstOrCreate(
            ['slug' => 'davao'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'City of Davao',
                'slug' => 'davao',
                'domain' => 'davao.likaslens.org',
                'branding' => [
                    'primary_color' => '#1B4D3E',
                    'logo_url' => null,
                    'favicon_url' => null,
                ],
                'config' => [
                    'features' => ['reports', 'tickets', 'leaderboard', 'map'],
                    'limits' => [
                        'max_reports_per_day' => 30,
                        'max_users' => 10000,
                    ],
                ],
                'country_code' => 'PH',
                'timezone' => 'Asia/Manila',
                'is_active' => true,
            ]
        );
    }
}
