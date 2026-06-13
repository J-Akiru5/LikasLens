<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the bias / risk register — the data structure backing the
 * "Risk Register" section of the submission report. Five rows, one per
 * known risk surface: COCO bias, Indigenous practice misclassification,
 * Ghost Mode abuse, Linguistic gap, Gemini data sovereignty.
 *
 * Run: php artisan db:seed --class=BiasRiskRegisterSeeder
 */
class BiasRiskRegisterSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'risk' => 'COCO pre-training bias',
                'category' => 'model',
                'likelihood' => 'medium',
                'impact' => 'medium',
                'mitigation' => 'Fine-tune on Philippine coastal imagery; cap confidence at 0.65 until LGU verification.',
                'status' => 'mitigated',
                'evidence_url' => null,
            ],
            [
                'risk' => 'Indigenous practice misclassification (fish corrals / kaingin)',
                'category' => 'model',
                'likelihood' => 'medium',
                'impact' => 'high',
                'mitigation' => 'Geo-fence known ancestral domains; require LGU cultural officer sign-off before enforcement.',
                'status' => 'mitigated',
                'evidence_url' => null,
            ],
            [
                'risk' => 'Ghost Mode abuse for false reports',
                'category' => 'system',
                'likelihood' => 'low',
                'impact' => 'medium',
                'mitigation' => 'Mandatory 2-report GPS-diverse corroboration within 500 m before escalation; device-level rate limiting (Q3 2026).',
                'status' => 'partial',
                'evidence_url' => null,
            ],
            [
                'risk' => 'Linguistic gap (Hiligaynon, Cebuano, Waray not yet in pipeline)',
                'category' => 'i18n',
                'likelihood' => 'high',
                'impact' => 'medium',
                'mitigation' => 'Filipino + English live; Tagalog + Cebuano roadmap Q4 2026; community-driven glossary for Hiligaynon/Waray.',
                'status' => 'open',
                'evidence_url' => null,
            ],
            [
                'risk' => 'Gemini API data sovereignty (non-resident data egress)',
                'category' => 'compliance',
                'likelihood' => 'low',
                'impact' => 'high',
                'mitigation' => 'PII stripped on-device before transmission; only minimal context shared; DPA assessment filed; fall back to local open-weight model for sensitive classifications.',
                'status' => 'mitigated',
                'evidence_url' => null,
            ],
        ];

        foreach ($rows as $row) {
            DB::table('bias_risk_register')->updateOrInsert(
                ['risk' => $row['risk']],
                $row + ['updated_at' => now(), 'created_at' => now()],
            );
        }
    }
}
