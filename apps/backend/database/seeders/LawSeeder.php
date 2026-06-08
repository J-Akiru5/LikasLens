<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LawSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $laws = [
            [
                'law_code' => 'RA 9003',
                'title' => 'Ecological Solid Waste Management Act of 2000',
                'summary' => 'Provides for a comprehensive solid waste management program, including recycling, composting, and strict penalties for illegal dumping and littering.',
                'issuing_agency' => 'NSWMC',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://mirror.officialgazette.gov.ph/2001/01/26/republic-act-no-9003-s-2001/',
                'is_active' => true,
            ],
            [
                'law_code' => 'RA 8749',
                'title' => 'Philippine Clean Air Act of 1999',
                'summary' => 'A comprehensive air quality management policy and program which aims to achieve and maintain healthy air, including the strict ban on the open burning of waste.',
                'issuing_agency' => 'DENR-EMB',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://lawphil.net/statutes/repacts/ra1999/ra_8749_1999.html',
                'is_active' => true,
            ],
            [
                'law_code' => 'RA 9275',
                'title' => 'Philippine Clean Water Act of 2004',
                'summary' => 'Aims to protect the country\'s water bodies from pollution from land-based sources (industries and commercial establishments, agriculture and community/household activities).',
                'issuing_agency' => 'DENR-EMB',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://mirror.officialgazette.gov.ph/2004/03/22/republic-act-no-9275/',
                'is_active' => true,
            ],
            [
                'law_code' => 'RA 6969',
                'title' => 'Toxic Substances and Hazardous and Nuclear Wastes Control Act of 1990',
                'summary' => 'Regulates the importation, manufacture, processing, handling, storage, transportation, sale, distribution, use, and disposal of chemical substances and mixtures that present unreasonable risk to human health or the environment.',
                'issuing_agency' => 'DENR-EMB',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://www.officialgazette.gov.ph/1990/10/26/republic-act-no-6969/',
                'is_active' => true,
            ],
            [
                'law_code' => 'PD 1586',
                'title' => 'Philippine Environmental Impact Statement System',
                'summary' => 'Requires all agencies and instrumentalities of the national government, including government-owned or controlled corporations, as well as private corporations, firms, and entities to prepare an Environmental Impact Statement (EIS) for every proposed project and undertaking which significantly affects the quality of the environment.',
                'issuing_agency' => 'DENR',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://www.lawphil.net/statutes/presdecs/pd1978/pd_1586_1978.html',
                'is_active' => true,
            ],
            [
                'law_code' => 'PD 705',
                'title' => 'Revised Forestry Code of the Philippines',
                'summary' => 'Lays down the basic principles of forest management and conservation, regulates logging operations, and penalizes illegal deforestation.',
                'issuing_agency' => 'DENR',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/26/54708',
                'is_active' => true,
            ],
            [
                'law_code' => 'RA 9147',
                'title' => 'Wildlife Resources Conservation and Protection Act',
                'summary' => 'Provides for the conservation and protection of wildlife resources and their habitats.',
                'issuing_agency' => 'DENR-BMB',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://www.officialgazette.gov.ph/2001/07/30/republic-act-no-9147/',
                'is_active' => true,
            ],
            [
                'law_code' => 'RA 7586',
                'title' => 'National Integrated Protected Areas System (NIPAS) Act',
                'summary' => 'Secures the perpetual existence of all native plants and animals through the establishment of a comprehensive system of integrated protected areas.',
                'issuing_agency' => 'DENR-BMB',
                'jurisdiction_scope' => 'national',
                'source_url' => 'https://www.officialgazette.gov.ph/1992/06/01/republic-act-no-7586/',
                'is_active' => true,
            ],
        ];

        DB::table('environmental_laws_ph')->upsert(
            array_map(function (array $law) use ($now): array {
                $law['id'] = (string) Str::uuid();
                $law['created_at'] = $now;
                $law['updated_at'] = $now;

                return $law;
            }, $laws),
            ['law_code'],
            ['title', 'summary', 'issuing_agency', 'jurisdiction_scope', 'source_url', 'is_active', 'updated_at']
        );
    }
}
