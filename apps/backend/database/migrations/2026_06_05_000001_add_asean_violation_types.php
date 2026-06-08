<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $now = Carbon::now();

        $laws = [
            [
                'law_code' => 'PD-705',
                'title' => 'Revised Forestry Code of the Philippines',
                'summary' => 'Governs forest management, timber utilization, reforestation, and penalizes illegal logging and deforestation.',
                'issuing_agency' => 'DENR',
                'source_url' => 'https://www.lawphil.net/statutes/presdecs/pd1975/pd_705_1975.html',
            ],
            [
                'law_code' => 'RA-9147',
                'title' => 'Wildlife Resources Conservation and Protection Act of 2001',
                'summary' => 'Provides for the conservation and protection of wildlife resources and their habitats, including coral reefs.',
                'issuing_agency' => 'DENR-BMB',
                'source_url' => 'https://www.officialgazette.gov.ph/2001/07/30/republic-act-no-9147/',
            ],
            [
                'law_code' => 'RA-7586',
                'title' => 'National Integrated Protected Areas System Act of 1992',
                'summary' => 'Establishes the NIPAS framework for the classification and administration of all protected areas.',
                'issuing_agency' => 'DENR-BMB',
                'source_url' => 'https://www.lawphil.net/statutes/repacts/ra1992/ra_7586_1992.html',
            ],
        ];

        foreach ($laws as $law) {
            $exists = DB::table('environmental_laws_ph')
                ->where('law_code', $law['law_code'])
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('environmental_laws_ph')->insert([
                'id' => (string) Str::uuid(),
                'law_code' => $law['law_code'],
                'title' => $law['title'],
                'summary' => $law['summary'],
                'issuing_agency' => $law['issuing_agency'],
                'jurisdiction_scope' => 'national',
                'source_url' => $law['source_url'],
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('environmental_laws_ph')
            ->whereIn('law_code', ['PD-705', 'RA-9147', 'RA-7586'])
            ->delete();
    }
};
