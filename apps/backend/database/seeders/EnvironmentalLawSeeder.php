<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnvironmentalLawSeeder extends Seeder
{
    /**
     * Seed Philippine environmental laws and baseline penalties.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $laws = [
            [
                'law_code' => 'PD-1151',
                'title' => 'Philippine Environmental Policy',
                'summary' => 'Framework policy requiring integrated environmental protection and impact assessment practices.',
                'issuing_agency' => 'DENR',
                'source_url' => 'https://mirror.officialgazette.gov.ph/1977/06/06/presidential-decree-no-1151-s-1977/',
            ],
            [
                'law_code' => 'PD-1586',
                'title' => 'Philippine Environmental Impact Statement System',
                'summary' => 'Establishes the Environmental Impact Statement system and ECC requirements for environmentally critical projects.',
                'issuing_agency' => 'DENR',
                'source_url' => 'https://www.lawphil.net/statutes/presdecs/pd1978/pd_1586_1978.html',
            ],
            [
                'law_code' => 'RA-7611',
                'title' => 'Strategic Environmental Plan for Palawan Act of 1992',
                'summary' => 'Creates the SEP framework and ECAN strategy for sustainable development in Palawan.',
                'issuing_agency' => 'PCSD',
                'source_url' => 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/3542',
            ],
            [
                'law_code' => 'RA-9729',
                'title' => 'Climate Change Act of 2009',
                'summary' => 'Mainstreams climate change adaptation and mitigation in government policy and planning.',
                'issuing_agency' => 'Climate Change Commission',
                'source_url' => 'https://www.officialgazette.gov.ph/2009/10/23/republic-act-no-9729/',
            ],
            [
                'law_code' => 'AM-09-6-8-SC',
                'title' => 'Rules of Procedure for Environmental Cases (Writ of Kalikasan)',
                'summary' => 'Provides judicial remedies for environmental rights violations and continuing mandamus actions.',
                'issuing_agency' => 'Supreme Court of the Philippines',
                'source_url' => 'https://sc.judiciary.gov.ph/rules-of-procedure-for-environmental-cases/',
            ],
            [
                'law_code' => 'RA-10121',
                'title' => 'Philippine Disaster Risk Reduction and Management Act of 2010',
                'summary' => 'Strengthens disaster preparedness, risk reduction, and climate resilience programs nationwide.',
                'issuing_agency' => 'NDRRMC',
                'source_url' => 'https://www.officialgazette.gov.ph/2010/05/27/republic-act-no-10121/',
            ],
            [
                'law_code' => 'PD-856',
                'title' => 'Code on Sanitation of the Philippines',
                'summary' => 'Sets sanitation standards and regulates pollution-related public health risks.',
                'issuing_agency' => 'DOH',
                'source_url' => 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/26/15313',
            ],
            [
                'law_code' => 'PD-979',
                'title' => 'Marine Pollution Decree of 1976',
                'summary' => 'Prohibits unlawful discharge and dumping of wastes into Philippine waters.',
                'issuing_agency' => 'Philippine Coast Guard',
                'source_url' => 'https://coastguard.gov.ph/index.php/related-laws/29-auxiliary-menu/related-laws/191-presidential-decree-no-979',
            ],
            [
                'law_code' => 'PD-1067',
                'title' => 'Water Code of the Philippines',
                'summary' => 'Governs the ownership, allocation, use, and conservation of water resources.',
                'issuing_agency' => 'National Water Resources Board',
                'source_url' => 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/26/54002',
            ],
            [
                'law_code' => 'RA-6969',
                'title' => 'Toxic Substances and Hazardous and Nuclear Wastes Control Act of 1990',
                'summary' => 'Regulates hazardous substances and hazardous waste handling, importation, and disposal.',
                'issuing_agency' => 'DENR-EMB',
                'source_url' => 'https://www.officialgazette.gov.ph/1990/10/26/republic-act-no-6969/',
            ],
            [
                'law_code' => 'RA-8749',
                'title' => 'Philippine Clean Air Act of 1999',
                'summary' => 'Establishes air quality management, emissions controls, and permitting requirements.',
                'issuing_agency' => 'DENR-EMB',
                'source_url' => 'https://lawphil.net/statutes/repacts/ra1999/ra_8749_1999.html',
            ],
            [
                'law_code' => 'RA-9003',
                'title' => 'Ecological Solid Waste Management Act of 2000',
                'summary' => 'Creates a national ecological solid waste management system with segregation and landfill controls.',
                'issuing_agency' => 'NSWMC',
                'source_url' => 'https://mirror.officialgazette.gov.ph/2001/01/26/republic-act-no-9003-s-2001/',
            ],
            [
                'law_code' => 'RA-9275',
                'title' => 'Philippine Clean Water Act of 2004',
                'summary' => 'Provides the national framework for water quality protection and wastewater regulation.',
                'issuing_agency' => 'DENR-EMB',
                'source_url' => 'https://mirror.officialgazette.gov.ph/2004/03/22/republic-act-no-9275/',
            ],
        ];

        $lawIdByCode = [];

        foreach ($laws as $law) {
            $existing = DB::table('environmental_laws_ph')->where('law_code', $law['law_code'])->first();

            if ($existing !== null) {
                $lawIdByCode[$law['law_code']] = $existing->id;
                continue;
            }

            $id = (string) Str::uuid();
            $lawIdByCode[$law['law_code']] = $id;

            DB::table('environmental_laws_ph')->insert([
                'id' => $id,
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

        $penalties = [
            [
                'law_code' => 'RA-9003',
                'violation_name' => 'Improper waste segregation and illegal dumping',
                'penalty_type' => 'fine',
                'min_fine_php' => 300,
                'max_fine_php' => 100000,
                'notes' => 'Actual amount depends on offense class and local ordinance implementation.',
            ],
            [
                'law_code' => 'RA-8749',
                'violation_name' => 'Exceeding allowable air pollutant emissions',
                'penalty_type' => 'fine',
                'min_fine_php' => 10000,
                'max_fine_php' => 100000,
                'notes' => 'Applicable to stationary and mobile sources subject to permits.',
            ],
            [
                'law_code' => 'RA-9275',
                'violation_name' => 'Unauthorized wastewater discharge',
                'penalty_type' => 'mixed',
                'min_fine_php' => 10000,
                'max_fine_php' => 200000,
                'notes' => 'May include cleanup costs and additional sanctions.',
            ],
            [
                'law_code' => 'RA-6969',
                'violation_name' => 'Improper handling or disposal of hazardous substances',
                'penalty_type' => 'mixed',
                'min_fine_php' => 50000,
                'max_fine_php' => 500000,
                'min_imprisonment_days' => 30,
                'max_imprisonment_days' => 3650,
                'notes' => 'Ranges are baseline placeholders and should be validated against latest implementing rules.',
            ],
        ];

        $penaltyIdByLawCode = [];

        foreach ($penalties as $penalty) {
            if (! isset($lawIdByCode[$penalty['law_code']])) {
                continue;
            }

            $existing = DB::table('law_penalties')
                ->where('law_id', $lawIdByCode[$penalty['law_code']])
                ->where('violation_name', $penalty['violation_name'])
                ->first();

            if ($existing !== null) {
                $penaltyIdByLawCode[$penalty['law_code']] = $existing->id;
                continue;
            }

            $id = (string) Str::uuid();
            $penaltyIdByLawCode[$penalty['law_code']] = $id;

            DB::table('law_penalties')->insert([
                'id' => $id,
                'law_id' => $lawIdByCode[$penalty['law_code']],
                'violation_name' => $penalty['violation_name'],
                'penalty_type' => $penalty['penalty_type'],
                'min_fine_php' => $penalty['min_fine_php'] ?? null,
                'max_fine_php' => $penalty['max_fine_php'] ?? null,
                'min_imprisonment_days' => $penalty['min_imprisonment_days'] ?? null,
                'max_imprisonment_days' => $penalty['max_imprisonment_days'] ?? null,
                'notes' => $penalty['notes'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $violationTypes = [
            [
                'code' => 'SWM-ILLEGAL-DUMPING',
                'name' => 'Illegal Dumping of Solid Waste',
                'description' => 'Improper disposal, dumping, or open dumping violations under solid waste rules.',
                'law_code' => 'RA-9003',
            ],
            [
                'code' => 'AIR-EMISSION-VIOLATION',
                'name' => 'Air Emission Violation',
                'description' => 'Violation of allowable air pollutant emissions and air quality requirements.',
                'law_code' => 'RA-8749',
            ],
            [
                'code' => 'WATER-UNAUTHORIZED-DISCHARGE',
                'name' => 'Unauthorized Wastewater Discharge',
                'description' => 'Unauthorized or non-compliant discharge into water bodies.',
                'law_code' => 'RA-9275',
            ],
            [
                'code' => 'HAZWASTE-HANDLING',
                'name' => 'Hazardous Waste Handling Violation',
                'description' => 'Improper handling, storage, transport, or disposal of hazardous waste.',
                'law_code' => 'RA-6969',
            ],
        ];

        foreach ($violationTypes as $violationType) {
            $existing = DB::table('violation_types')->where('code', $violationType['code'])->first();

            if ($existing !== null) {
                continue;
            }

            DB::table('violation_types')->insert([
                'id' => (string) Str::uuid(),
                'code' => $violationType['code'],
                'name' => $violationType['name'],
                'description' => $violationType['description'],
                'law_id' => $lawIdByCode[$violationType['law_code']] ?? null,
                'default_penalty_id' => $penaltyIdByLawCode[$violationType['law_code']] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
