<?php

namespace Database\Seeders;

use App\Models\CreditPool;
use Illuminate\Database\Seeder;

class EcoCreditPoolSeeder extends Seeder
{
    public function run(): void
    {
        CreditPool::create([
            'sponsor_name' => 'San Miguel ESG Demo Pool',
            'sponsor_type' => 'corporate',
            'contact_email' => 'esg@sanmiguel.com.ph',
            'total_credits' => 1000000,
            'remaining_credits' => 1000000,
            'valid_from' => now(),
            'valid_until' => now()->addYears(5),
            'is_active' => true,
        ]);
    }
}
