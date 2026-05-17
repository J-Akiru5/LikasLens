<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            EnvironmentalLawSeeder::class,
            LawSeeder::class,
            NgoSeeder::class,
            AchievementSeeder::class,
            CurrencySettingSeeder::class,
            EcoCreditPoolSeeder::class,
        ]);

        User::factory()->create([
            'supabase_auth_user_id' => '11111111-1111-1111-1111-111111111111',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'citizen',
        ]);
    }
}
