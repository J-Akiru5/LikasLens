<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AseanLawSeeder extends Seeder
{
    /**
     * Seed environmental laws for the ASEAN expansion countries:
     * Indonesia, Thailand, Vietnam, Malaysia, and Singapore.
     *
     * Sources verified against official government gazettes and
     * ASEAN environmental law repositories.
     * ── INDONESIA ──
     *  • UU No. 32/2009 – Environmental Protection and Management
     *  • UU No. 41/1999 – Forestry Law
     *  • PP No. 101/2014 – Hazardous Waste Management
     * ── THAILAND ──
     *  • NEQA BE 2535 (1992) – Enhancement & Conservation of National
     *    Environmental Quality Act
     *  • Factory Act BE 2535 (1992)
     * ── VIETNAM ──
     *  • Law No. 72/2020/QH14 – Law on Environmental Protection 2020
     *  • Law on Biodiversity 2008 (No. 20/2008/QH12)
     * ── MALAYSIA ──
     *  • Act 127 – Environmental Quality Act 1974
     *  • Act 313 – Exclusive Economic Zone Act 1984
     * ── SINGAPORE ──
     *  • Environmental Protection and Management Act (Cap 94A)
     *  • Environmental Public Health Act (Cap 95)
     */
    public function run(): void
    {
        $now = Carbon::now();

        $laws = [
            // ═══════════════════════════════════════
            // INDONESIA (ID)
            // ═══════════════════════════════════════
            [
                'id'          => '5479b293-e670-45e3-a584-09e3b1e29d51',
                'law_code'    => 'UU-32/2009',
                'title'       => 'UU No. 32/2009 — Environmental Protection and Management',
                'summary'     => 'Indonesia\'s primary environmental framework law. Establishes Environmental Impact Assessment (AMDAL) requirements, sets emission and effluent standards, mandates environmental permits for businesses, and creates criminal liability for environmental damage including strict liability for hazardous activities.',
                'issuing_agency' => 'KLHK (Ministry of Environment and Forestry)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://jdih.setneg.go.id/Produk',
            ],
            [
                'id'          => '1f68b4a7-c2d1-4e38-9f05-b7c83a2e7516',
                'law_code'    => 'UU-41/1999',
                'title'       => 'UU No. 41/1999 — Forestry Law',
                'summary'     => 'Governs forest management, utilization, and conservation across Indonesia\'s 120 million hectares of forest land. Defines protected forests, production forests, and conservation forests. Sets penalties for illegal logging, forest burning, and encroachment.',
                'issuing_agency' => 'Ministry of Forestry',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://jdih.setneg.go.id/Produk',
            ],
            [
                'id'          => 'c2a7e9f1-4b3d-4a56-8c12-f9d3e6b1a840',
                'law_code'    => 'PP-101/2014',
                'title'       => 'PP No. 101/2014 — Hazardous and Toxic Waste Management',
                'summary'     => 'Government regulation implementing the hazardous waste management provisions of UU 32/2009. Covers B3 waste classification, transportation permits, treatment standards, and disposal requirements.',
                'issuing_agency' => 'KLHK (Ministry of Environment and Forestry)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://jdih.setneg.go.id/Produk',
            ],

            // ═══════════════════════════════════════
            // THAILAND (TH)
            // ═══════════════════════════════════════
            [
                'id'          => 'a3d7c2b1-8e4f-49a2-bc35-12e6f8d9a047',
                'law_code'    => 'BE-2535-NEQA',
                'title'       => 'Enhancement and Conservation of National Environmental Quality Act, BE 2535 (1992)',
                'summary'     => 'Thailand\'s foundational environmental legislation. Establishes the National Environment Board, sets EIA requirements for major projects, defines environmental quality standards for air, water, noise and vibration, and creates the Environmental Fund for remediation and conservation financing.',
                'issuing_agency' => 'MONRE (Ministry of Natural Resources and Environment)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://www.mnre.go.th/en',
            ],
            [
                'id'          => 'f7b3d8e1-2a4c-45b9-8d36-03e9f1a7c250',
                'law_code'    => 'BE-2535-FACTORY',
                'title'       => 'Factory Act, BE 2535 (1992)',
                'summary'     => 'Regulates industrial operations including waste discharge and emissions. Classifies factories into three categories based on environmental risk, requires operating permits, and empowers the Department of Industrial Works to order cessation of polluting activities.',
                'issuing_agency' => 'Department of Industrial Works',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://www.mnre.go.th/en',
            ],

            // ═══════════════════════════════════════
            // VIETNAM (VN)
            // ═══════════════════════════════════════
            [
                'id'          => 'd9b4e2c7-1f3a-48d6-9e01-45a8c2f7b630',
                'law_code'    => 'LEP-72/2020',
                'title'       => 'Law on Environmental Protection 2020 (Law No. 72/2020/QH14)',
                'summary'     => 'Vietnam\'s comprehensive environmental framework effective January 2022. Introduces extended producer responsibility, requires Strategic Environmental Assessment (SEA) and EIA, classifies investment projects by environmental risk tier, mandates greenhouse gas inventory reporting, and strengthens penalties for environmental crimes.',
                'issuing_agency' => 'MONRE (Ministry of Natural Resources and Environment)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://vanban.chinhphu.vn/',
            ],
            [
                'id'          => 'e4c8a1f6-7b2d-49e3-9c45-018b3f5d9270',
                'law_code'    => 'BIODIVERSITY-20/2008',
                'title'       => 'Law on Biodiversity 2008 (Law No. 20/2008/QH12)',
                'summary'     => 'Establishes the legal framework for biodiversity conservation in Vietnam. Covers protected areas management, endangered species protection, biosafety and genetically modified organisms, access to genetic resources, and benefit sharing.',
                'issuing_agency' => 'MONRE (Ministry of Natural Resources and Environment)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://vanban.chinhphu.vn/',
            ],

            // ═══════════════════════════════════════
            // MALAYSIA (MY)
            // ═══════════════════════════════════════
            [
                'id'          => 'b8c5d3e6-4a1f-47b2-9d34-56e7f8c9a012',
                'law_code'    => 'EQA-1974',
                'title'       => 'Environmental Quality Act 1974 (Act 127)',
                'summary'     => 'Malaysia\'s cornerstone environmental legislation. Regulates pollution from industrial premises, prescribes ambient standards for air, water, noise and soil, requires EIA for prescribed activities, establishes licensing for scheduled wastes, and empowers the Director General of Environment to issue compliance orders and compound offences.',
                'issuing_agency' => 'DOE (Department of Environment)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://www.doe.gov.my/en/environmental-quality-act-1974/',
            ],
            [
                'id'          => 'a1f7d3c5-9e2b-48a4-8c67-23d0e8f4b159',
                'law_code'    => 'EEZ-1984',
                'title'       => 'Exclusive Economic Zone Act 1984 (Act 311)',
                'summary'     => 'Extends Malaysia\'s environmental jurisdiction to its 200-nautical-mile EEZ. Prohibits discharge of pollutants from vessels and offshore installations, regulates seabed exploration and exploitation, and protects living marine resources within the zone.',
                'issuing_agency' => 'DOE (Department of Environment)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://www.doe.gov.my/',
            ],

            // ═══════════════════════════════════════
            // SINGAPORE (SG)
            // ═══════════════════════════════════════
            [
                'id'          => 'c6e8f1b2-3a7d-4c59-8e04-91f5d0a3b728',
                'law_code'    => 'EPMA',
                'title'       => 'Environmental Protection and Management Act (Chapter 94A)',
                'summary'     => 'Singapore\'s primary pollution control legislation. Regulates air impurities from industrial and trade premises, controls water pollution through trade effluent regulations, manages hazardous substances including licensing for import/export/transport/storage, and prohibits the use of non-compliant fuels and refrigerants.',
                'issuing_agency' => 'NEA (National Environment Agency)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://sso.agc.gov.sg/Act/EPMA1999',
            ],
            [
                'id'          => 'd4f9a2e7-8b1c-43d5-9f36-02a6c8e4f310',
                'law_code'    => 'EPHA',
                'title'       => 'Environmental Public Health Act (Chapter 95)',
                'summary'     => 'Governs public health and environmental cleanliness in Singapore. Covers waste collection and disposal, sanitation requirements for premises, vector control (mosquitoes, rodents), food hygiene standards, and the licensing of funeral parlours, cemeteries, and crematoria.',
                'issuing_agency' => 'NEA (National Environment Agency)',
                'jurisdiction_scope' => 'national',
                'source_url'  => 'https://sso.agc.gov.sg/Act/EPHA1987',
            ],
        ];

        foreach ($laws as $law) {
            DB::table('environmental_laws_ph')->updateOrInsert(
                ['law_code' => $law['law_code']],
                [
                    'id' => $law['id'],
                    'law_code' => $law['law_code'],
                    'title' => $law['title'],
                    'summary' => $law['summary'],
                    'issuing_agency' => $law['issuing_agency'],
                    'jurisdiction_scope' => $law['jurisdiction_scope'] ?? 'national',
                    'source_url' => $law['source_url'],
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $this->command?->info(sprintf(
            'ASEAN Law Seeder: %d laws upserted across ID, TH, VN, MY, SG.',
            count($laws)
        ));
    }
}
