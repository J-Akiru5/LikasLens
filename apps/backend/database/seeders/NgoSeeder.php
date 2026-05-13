<?php

namespace Database\Seeders;

use App\Models\NgoGroup;
use Illuminate\Database\Seeder;

class NgoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        NgoGroup::create([
            'name' => 'Green Earth Coalition',
            'region' => 'NCR',
            'contact_email' => 'contact@greenearth.org',
            'contact_phone' => '+63 912 345 6789',
            'is_active' => true,
        ]);

        NgoGroup::create([
            'name' => 'Clean Rivers Foundation',
            'region' => 'Region IV-A',
            'contact_email' => 'hello@cleanrivers.org',
            'contact_phone' => '+63 998 765 4321',
            'is_active' => true,
        ]);
    }
}
