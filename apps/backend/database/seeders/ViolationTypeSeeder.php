<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ViolationTypeSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $requiredLawCodes = ['PD-705', 'RA-9147', 'PD-979', 'RA-8749', 'RA-7611', 'RA-7586'];

        $laws = DB::table('environmental_laws_ph')
            ->whereIn('law_code', $requiredLawCodes)
            ->pluck('id', 'law_code');

        $missingLawCodes = array_diff($requiredLawCodes, $laws->keys()->toArray());

        if (! empty($missingLawCodes)) {
            $lawDefaults = [
                'PD-705' => [
                    'title' => 'Revised Forestry Code of the Philippines',
                    'summary' => 'Governs forest management, timber utilization, reforestation, and penalizes illegal logging and deforestation.',
                    'issuing_agency' => 'DENR',
                    'source_url' => 'https://www.lawphil.net/statutes/presdecs/pd1975/pd_705_1975.html',
                ],
                'RA-9147' => [
                    'title' => 'Wildlife Resources Conservation and Protection Act of 2001',
                    'summary' => 'Provides for the conservation and protection of wildlife resources and their habitats, including coral reefs.',
                    'issuing_agency' => 'DENR-BMB',
                    'source_url' => 'https://www.officialgazette.gov.ph/2001/07/30/republic-act-no-9147/',
                ],
                'RA-7586' => [
                    'title' => 'National Integrated Protected Areas System Act of 1992',
                    'summary' => 'Establishes the NIPAS framework for the classification and administration of all protected areas.',
                    'issuing_agency' => 'DENR-BMB',
                    'source_url' => 'https://www.lawphil.net/statutes/repacts/ra1992/ra_7586_1992.html',
                ],
            ];

            foreach ($missingLawCodes as $code) {
                if (! isset($lawDefaults[$code])) {
                    continue;
                }

                $id = (string) Str::uuid();
                $laws[$code] = $id;

                DB::table('environmental_laws_ph')->insert([
                    'id' => $id,
                    'law_code' => $code,
                    'title' => $lawDefaults[$code]['title'],
                    'summary' => $lawDefaults[$code]['summary'],
                    'issuing_agency' => $lawDefaults[$code]['issuing_agency'],
                    'jurisdiction_scope' => 'national',
                    'source_url' => $lawDefaults[$code]['source_url'],
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $penalties = [
            [
                'key' => 'ILLEGAL-LOGGING',
                'law_code' => 'PD-705',
                'violation_name' => 'Illegal logging and deforestation',
                'penalty_type' => 'mixed',
                'min_fine_php' => 50000,
                'max_fine_php' => 500000,
                'min_imprisonment_days' => 2190,
                'max_imprisonment_days' => 4380,
                'notes' => 'PHP 50K-500K + 6-12 yrs imprisonment',
            ],
            [
                'key' => 'WILDLIFE-TRAFFICKING',
                'law_code' => 'RA-9147',
                'violation_name' => 'Wildlife trafficking and trade of endangered species',
                'penalty_type' => 'mixed',
                'min_fine_php' => 100000,
                'max_fine_php' => 1000000,
                'min_imprisonment_days' => 1460,
                'max_imprisonment_days' => 2190,
                'notes' => 'PHP 100K-1M + 4-6 yrs imprisonment',
            ],
            [
                'key' => 'MARINE-POLLUTION',
                'law_code' => 'PD-979',
                'violation_name' => 'Unlawful discharge and dumping of wastes into Philippine waters',
                'penalty_type' => 'mixed',
                'min_fine_php' => 50000,
                'max_fine_php' => 200000,
                'min_imprisonment_days' => 2190,
                'max_imprisonment_days' => 2920,
                'notes' => 'PHP 50K-200K + 6-8 yrs imprisonment',
            ],
            [
                'key' => 'OPEN-BURNING',
                'law_code' => 'RA-8749',
                'violation_name' => 'Open burning of solid, hazardous, or agricultural waste',
                'penalty_type' => 'mixed',
                'min_fine_php' => 10000,
                'max_fine_php' => 100000,
                'min_imprisonment_days' => 180,
                'max_imprisonment_days' => 2190,
                'notes' => 'PHP 10K-100K + 6 mos-6 yrs imprisonment',
            ],
            [
                'key' => 'MANGROVE-DESTRUCTION',
                'law_code' => 'RA-7611',
                'violation_name' => 'Unauthorized clearing or destruction of mangrove forests',
                'penalty_type' => 'mixed',
                'min_fine_php' => 50000,
                'max_fine_php' => 500000,
                'min_imprisonment_days' => 1460,
                'max_imprisonment_days' => 2920,
                'notes' => 'PHP 50K-500K + 4-8 yrs imprisonment',
            ],
            [
                'key' => 'CORAL-REEF-DAMAGE',
                'law_code' => 'RA-9147',
                'violation_name' => 'Destruction, collection, or trade of coral reef resources',
                'penalty_type' => 'mixed',
                'min_fine_php' => 100000,
                'max_fine_php' => 1000000,
                'min_imprisonment_days' => 1460,
                'max_imprisonment_days' => 2190,
                'notes' => 'PHP 100K-1M + 4-6 yrs imprisonment',
            ],
            [
                'key' => 'PROTECTED-AREA-INTRUSION',
                'law_code' => 'RA-7586',
                'violation_name' => 'Unauthorized entry, occupation, or exploitation of protected areas',
                'penalty_type' => 'mixed',
                'min_fine_php' => 20000,
                'max_fine_php' => 200000,
                'min_imprisonment_days' => 365,
                'max_imprisonment_days' => 1460,
                'notes' => 'PHP 20K-200K + 1-4 yrs imprisonment',
            ],
        ];

        $penaltyIdByKey = [];

        foreach ($penalties as $penalty) {
            $lawId = $laws[$penalty['law_code']] ?? null;

            if ($lawId === null) {
                continue;
            }

            $existing = DB::table('law_penalties')
                ->where('law_id', $lawId)
                ->where('violation_name', $penalty['violation_name'])
                ->first();

            if ($existing !== null) {
                $penaltyIdByKey[$penalty['key']] = $existing->id;

                continue;
            }

            $id = (string) Str::uuid();
            $penaltyIdByKey[$penalty['key']] = $id;

            DB::table('law_penalties')->insert([
                'id' => $id,
                'law_id' => $lawId,
                'violation_name' => $penalty['violation_name'],
                'penalty_type' => $penalty['penalty_type'],
                'min_fine_php' => $penalty['min_fine_php'],
                'max_fine_php' => $penalty['max_fine_php'],
                'min_imprisonment_days' => $penalty['min_imprisonment_days'],
                'max_imprisonment_days' => $penalty['max_imprisonment_days'],
                'notes' => $penalty['notes'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $violationTypes = [
            [
                'code' => 'ILLEGAL-LOGGING',
                'name' => 'Illegal Logging / Deforestation',
                'description' => 'Unauthorized cutting, gathering, collection, or timber poaching in forest lands.',
                'law_code' => 'PD-705',
                'penalty_key' => 'ILLEGAL-LOGGING',
            ],
            [
                'code' => 'WILDLIFE-TRAFFICKING',
                'name' => 'Wildlife Trafficking',
                'description' => 'Collection, trade, transport, or possession of threatened or endangered wildlife species.',
                'law_code' => 'RA-9147',
                'penalty_key' => 'WILDLIFE-TRAFFICKING',
            ],
            [
                'code' => 'MARINE-POLLUTION',
                'name' => 'Marine Pollution',
                'description' => 'Unlawful discharge, dumping, or spilling of wastes, oil, and noxious substances into Philippine waters.',
                'law_code' => 'PD-979',
                'penalty_key' => 'MARINE-POLLUTION',
            ],
            [
                'code' => 'OPEN-BURNING',
                'name' => 'Open Burning',
                'description' => 'Prohibited open burning of solid, hazardous, or agricultural materials that releases toxic air pollutants.',
                'law_code' => 'RA-8749',
                'penalty_key' => 'OPEN-BURNING',
            ],
            [
                'code' => 'MANGROVE-DESTRUCTION',
                'name' => 'Mangrove Clearing',
                'description' => 'Unauthorized cutting, clearing, or conversion of mangrove ecosystems within protected zones.',
                'law_code' => 'RA-7611',
                'penalty_key' => 'MANGROVE-DESTRUCTION',
            ],
            [
                'code' => 'CORAL-REEF-DAMAGE',
                'name' => 'Coral Reef Destruction',
                'description' => 'Destruction, collection, extraction, or trade of corals and coral-reef-dependent species.',
                'law_code' => 'RA-9147',
                'penalty_key' => 'CORAL-REEF-DAMAGE',
            ],
            [
                'code' => 'PROTECTED-AREA-INTRUSION',
                'name' => 'Protected Area Violation',
                'description' => 'Unauthorized entry, occupation, extraction, or development within declared protected areas.',
                'law_code' => 'RA-7586',
                'penalty_key' => 'PROTECTED-AREA-INTRUSION',
            ],
        ];

        foreach ($violationTypes as $violationType) {
            $existing = DB::table('violation_types')
                ->where('code', $violationType['code'])
                ->first();

            if ($existing !== null) {
                continue;
            }

            DB::table('violation_types')->insert([
                'id' => (string) Str::uuid(),
                'code' => $violationType['code'],
                'name' => $violationType['name'],
                'description' => $violationType['description'],
                'law_id' => $laws[$violationType['law_code']] ?? null,
                'default_penalty_id' => $penaltyIdByKey[$violationType['penalty_key']] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
