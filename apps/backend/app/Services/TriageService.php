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

    private static int $circuitFailures = 0;

    private static int $circuitOpenedAt = 0;

    private const CIRCUIT_THRESHOLD = 3;

    private const CIRCUIT_COOLDOWN = 60;

    public function __construct()
    {
        $this->aiServiceUrl = rtrim(config('services.ai.url', 'http://127.0.0.1:8001'), '/');
    }

    public function analyze(string $base64Image, Ticket $ticket): array
    {
        if (self::$circuitFailures >= self::CIRCUIT_THRESHOLD) {
            $elapsed = time() - self::$circuitOpenedAt;
            if ($elapsed < self::CIRCUIT_COOLDOWN) {
                Log::warning('AI service circuit breaker open, skipping call', [
                    'ticket_id' => $ticket->id,
                    'failures' => self::$circuitFailures,
                    'retry_in' => self::CIRCUIT_COOLDOWN - $elapsed,
                ]);

                return $this->fallbackResult($ticket);
            }
            self::$circuitFailures = 0;
        }

        try {
            $response = Http::timeout(120)->post("{$this->aiServiceUrl}/analyze/base64", [
                'image' => $base64Image,
                'confidence' => 0.50,
            ]);

            if (! $response->successful()) {
                Log::warning('AI service analyze failed', [
                    'status' => $response->status(),
                    'ticket_id' => $ticket->id,
                ]);
                self::$circuitFailures++;
                if (self::$circuitFailures >= self::CIRCUIT_THRESHOLD) {
                    self::$circuitOpenedAt = time();
                }

                return $this->fallbackResult($ticket);
            }

            self::$circuitFailures = 0;

            $analysis = $response->json('analysis', []);
            $assessment = $analysis['environmental_assessment'] ?? [];
            $composite = $analysis['composite_confidence'] ?? 0.0;
            $disposition = $analysis['triage_disposition'] ?? 'pending_review';

            $this->storeAnalysis($ticket, $analysis, $composite, $disposition);

            return [
                'success' => true,
                'has_concern' => $assessment['has_environmental_concern'] ?? false,
                'indicators' => $assessment['indicators'] ?? [],
                'detections' => $analysis['detections'] ?? [],
                'composite_confidence' => $composite,
                'triage_disposition' => $disposition,
            ];
        } catch (\Throwable $e) {
            Log::error('AI service connection failed', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticket->id,
            ]);
            self::$circuitFailures++;
            if (self::$circuitFailures >= self::CIRCUIT_THRESHOLD) {
                self::$circuitOpenedAt = time();
            }

            return $this->fallbackResult($ticket);
        }
    }

    private function storeAnalysis(Ticket $ticket, array $analysis, float $composite, string $disposition): void
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
                'confidence_score' => $composite,
            ]);
        }

        $ticket->update([
            'ai_triage_summary' => $this->buildSummary($analysis),
            'ai_confidence' => $this->calculateConfidence($analysis),
            'composite_confidence' => $composite,
            'triage_disposition' => $disposition,
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

    /**
     * Check image similarity against existing report embeddings.
     *
     * Calls the AI service /analyze/similarity endpoint.  Returns an array
     * with `similar_reports` (list) and `embedding_stored` (bool).
     * On failure returns an empty result so the caller can continue.
     */
    public function checkSimilarity(string $base64Image, string $ticketId, string $violationType = 'unknown'): array
    {
        try {
            $apiKey = config('services.ai.api_key');
            $headers = $apiKey ? ['X-API-Key' => $apiKey] : [];

            $response = Http::timeout(120)
                ->withHeaders($headers)
                ->post("{$this->aiServiceUrl}/analyze/similarity", [
                    'image' => $base64Image,
                    'report_id' => $ticketId,
                    'violation_type' => $violationType,
                    'threshold' => 0.85,
                ]);

            if (! $response->successful()) {
                Log::warning('AI service similarity check failed', [
                    'status' => $response->status(),
                    'ticket_id' => $ticketId,
                ]);

                return ['similar_reports' => [], 'embedding_stored' => false];
            }

            $data = $response->json();

            return [
                'similar_reports' => $data['similar_reports'] ?? [],
                'embedding_stored' => $data['embedding_stored'] ?? false,
            ];
        } catch (\Throwable $e) {
            Log::warning('AI service similarity check failed', [
                'error' => $e->getMessage(),
                'ticket_id' => $ticketId,
            ]);

            return ['similar_reports' => [], 'embedding_stored' => false];
        }
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
