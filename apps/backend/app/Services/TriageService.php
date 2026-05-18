<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketClassification;
use App\Models\ViolationType;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TriageService
{
    private string $aiServiceUrl;

    public function __construct()
    {
        $this->aiServiceUrl = rtrim(env('AI_SERVICE_URL', 'http://127.0.0.1:8001'), '/');
    }

    public function analyze(string $base64Image, Ticket $ticket): array
    {
        try {
            $response = Http::timeout(120)->post("{$this->aiServiceUrl}/analyze/base64", [
                'image' => $base64Image,
                'confidence' => 0.25,
            ]);

            if (! $response->successful()) {
                Log::warning('AI service analyze failed', [
                    'status' => $response->status(),
                    'ticket_id' => $ticket->id,
                ]);

                return $this->fallbackResult($ticket);
            }

            $analysis = $response->json('analysis', []);
            $assessment = $analysis['environmental_assessment'] ?? [];

            $this->storeAnalysis($ticket, $analysis);

            return [
                'success' => true,
                'has_concern' => $assessment['has_environmental_concern'] ?? false,
                'indicators' => $assessment['indicators'] ?? [],
                'detections' => $analysis['detections'] ?? [],
            ];
        } catch (\Throwable $e) {
            Log::error('AI service connection failed', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
            ]);

            return $this->fallbackResult($ticket);
        }
    }

    private function storeAnalysis(Ticket $ticket, array $analysis): void
    {
        $assessment = $analysis['environmental_assessment'] ?? [];
        $indicators = $assessment['indicators'] ?? [];

        foreach ($indicators as $indicator) {
            $violationType = ViolationType::where('code', strtoupper(str_replace(' ', '_', $indicator['type'] ?? 'UNKNOWN')))->first();
            if (! $violationType) {
                continue;
            }

            TicketClassification::create([
                'ticket_id' => $ticket->id,
                'violation_type_id' => $violationType->id,
                'classified_by' => 'ai-yolov8',
                'confidence_score' => 0.75,
            ]);
        }

        $ticket->update([
            'ai_triage_summary' => $this->buildSummary($analysis),
            'ai_confidence' => $this->calculateConfidence($analysis),
        ]);
    }

    private function buildSummary(array $analysis): string
    {
        $detectionCount = $analysis['detection_count'] ?? 0;
        $assessment = $analysis['environmental_assessment'] ?? [];
        $indicators = $assessment['indicators'] ?? [];

        $parts = ["YOLOv8 analysis: {$detectionCount} object(s) detected."];

        if (! empty($indicators)) {
            $labels = array_column($indicators, 'label');
            $parts[] = 'Indicators: '.implode(', ', $labels).'.';
        }

        $parts[] = 'Model: '.($analysis['model'] ?? 'unknown').'.';

        return implode(' ', $parts);
    }

    private function calculateConfidence(array $analysis): float
    {
        $assessment = $analysis['environmental_assessment'] ?? [];
        $indicators = $assessment['indicators'] ?? [];

        if (empty($indicators)) {
            return 0.0;
        }

        $maxConfidence = 0.0;
        foreach ($analysis['detections'] ?? [] as $detection) {
            $confidence = $detection['confidence'] ?? 0;
            if ($confidence > $maxConfidence) {
                $maxConfidence = $confidence;
            }
        }

        return round(min($maxConfidence, 0.99), 4);
    }

    private function fallbackResult(Ticket $ticket): array
    {
        return [
            'success' => false,
            'has_concern' => false,
            'indicators' => [],
            'detections' => [],
        ];
    }
}
