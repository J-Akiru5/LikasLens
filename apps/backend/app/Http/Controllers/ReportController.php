<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Ticket;
use App\Models\TicketEvidence;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\RankService;
use App\Services\TriageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    private const GHOST_USER_ID = '00000000-0000-0000-0000-000000000000';

    /**
     * Triage a report without storing it yet.
     */
    public function triage(Request $request)
    {
        $validated = $request->validate([
            'base64Image' => 'required|string',
        ]);

        try {
            $triage = app(TriageService::class)->analyze($validated['base64Image'], new Ticket);

            return response()->json([
                'success' => true,
                'has_concern' => $triage['has_concern'] ?? false,
                'indicators' => $triage['indicators'] ?? [],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Triage failed',
            ], 500);
        }
    }

    /**
     * Store a newly created report in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'base64Image' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'user_id' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:5000',
            'report_type' => 'nullable|string|max:100',
        ]);

        try {
            $imageData = base64_decode($validated['base64Image'], true);
            if ($imageData === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid base64 image data',
                ], 422);
            }

            $checksum = hash('sha256', $imageData);
            $mimeType = $this->detectMimeType($imageData);
            $extension = $this->mimeToExtension($mimeType);
            $filename = sprintf('%s_%s.%s', now()->format('Ymd_His'), Str::uuid7(), $extension);
            $storagePath = sprintf('evidence/%s/%s', now()->format('Y/m/d'), $filename);

            $userId = $this->resolveUserId($validated['user_id'] ?? null);

            $disk = $this->getStorageDisk();
            $disk->put($storagePath, $imageData, [
                'checksum' => $checksum,
                'ContentType' => $mimeType,
            ]);

            $reportTypeLabel = $this->reportTypeLabel($validated['report_type'] ?? null);
            $title = $reportTypeLabel
                ? $reportTypeLabel.' — '.now()->format('M j, Y g:i A')
                : 'Environmental Report - '.now()->format('M j, Y g:i A');
            $description = $validated['description'] ?? 'Automatically generated report from LikasLens mobile submission';

            // Step 1 — Persist core data in a transaction
            [$ticket, $evidence] = DB::transaction(function () use (
                $userId, $title, $description, $validated,
                $storagePath, $checksum, $mimeType, $imageData
            ) {
                $ticket = Ticket::create([
                    'reporter_user_id' => $userId,
                    'status' => 'open',
                    'title' => $title,
                    'description' => $description,
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                ]);

                $evidence = TicketEvidence::create([
                    'ticket_id' => $ticket->id,
                    'uploaded_by_user_id' => $userId,
                    'storage_provider' => config('filesystems.default'),
                    'storage_bucket' => $this->getBucketName(),
                    'storage_path' => $storagePath,
                    'checksum_sha256' => $checksum,
                    'mime_type' => $mimeType,
                    'file_size_bytes' => strlen($imageData),
                    'captured_at' => now(),
                    'exif_removed_at' => now(),
                    'yolo_status' => 'pending',
                ]);

                Report::create([
                    'user_id' => $userId,
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'image_path' => $storagePath,
                    'image_size' => strlen($imageData),
                    'storage_disk' => $this->getBucketName(),
                ]);

                return [$ticket, $evidence];
            });

            // Step 2 — AI triage (outside transaction — report survives even if AI is down)
            $triage = null;
            try {
                $triage = app(TriageService::class)->analyze($validated['base64Image'], $ticket);
            } catch (\Throwable $e) {
                Log::warning('ReportController: AI triage failed, continuing', [
                    'error' => $e->getMessage(),
                    'ticket_id' => $ticket->id,
                ]);
                $triage = ['success' => false, 'has_concern' => false, 'indicators' => []];
            }

            // Step 3 — Achievement & rank evaluation (non-critical, best-effort)
            if ($userId !== self::GHOST_USER_ID) {
                try {
                    $reporter = User::find($userId);
                    if ($reporter) {
                        $previousPoints = $reporter->reward_points_balance;

                        app(AchievementService::class)->evaluate($reporter, 'report_count');

                        $yoloClass = $triage['indicators'][0]['type'] ?? null;
                        if ($yoloClass) {
                            app(AchievementService::class)->evaluate($reporter, 'yolov8_class', [
                                'class' => strtolower(str_replace(' ', '_', $yoloClass)),
                            ]);
                        }

                        $reporter->refresh();
                        app(RankService::class)->handleRankUp($reporter, $previousPoints);
                    }
                } catch (\Throwable $e) {
                    Log::warning('ReportController: Achievement/rank evaluation failed, continuing', [
                        'error' => $e->getMessage(),
                        'user_id' => $userId,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Report submitted successfully',
                'data' => [
                    'ticket_id' => $ticket->id,
                    'evidence_id' => $evidence->id,
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'imageSize' => strlen($validated['base64Image']),
                    'checksum' => $checksum,
                    'triage' => $triage,
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('ReportController::store failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process report',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    private function reportTypeLabel(?string $type): ?string
    {
        return match ($type) {
            'illegal_logging' => 'Illegal Logging',
            'water_pollution' => 'Water Pollution',
            'illegal_fishing' => 'Illegal Fishing',
            'waste_dumping' => 'Waste Dumping',
            'wildlife_poaching' => 'Wildlife Poaching',
            'mining_violation' => 'Mining Violation',
            'air_pollution' => 'Air Pollution',
            'land_encroachment' => 'Land Encroachment',
            'other' => 'Other Environmental Concern',
            default => null,
        };
    }

    private function resolveUserId(?string $submittedUserId): string
    {
        if ($submittedUserId && $submittedUserId !== 'ANONYMOUS_GHOST') {
            $user = User::where('supabase_auth_user_id', $submittedUserId)->first();
            if ($user) {
                return $user->id;
            }
        }

        return $this->ensureGhostUser();
    }

    private function ensureGhostUser(): string
    {
        $ghost = User::where('supabase_auth_user_id', self::GHOST_USER_ID)->first();
        if ($ghost) {
            return $ghost->id;
        }

        return User::create([
            'supabase_auth_user_id' => self::GHOST_USER_ID,
            'name' => 'Anonymous Ghost',
            'email' => 'ghost@likaslens.local',
            'role' => 'ghost',
            'trust_score' => 0,
            'reward_points_balance' => 0,
            'password' => bcrypt(Str::random(32)),
        ])->id;
    }

    private function detectMimeType(string $data): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_buffer($finfo, $data);
        finfo_close($finfo);

        return $mime ?: 'image/jpeg';
    }

    private function mimeToExtension(string $mime): string
    {
        return match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'bin',
        };
    }

    private function getStorageDisk()
    {
        $config = config('filesystems.disks.supabase');
        if (! empty($config['key']) && ! empty($config['secret']) && ! empty($config['endpoint'])) {
            return Storage::disk('supabase');
        }

        return Storage::disk('local');
    }

    private function getBucketName(): string
    {
        $config = config('filesystems.disks.supabase');
        if (! empty($config['key']) && ! empty($config['secret']) && ! empty($config['endpoint'])) {
            return $config['bucket'];
        }

        return 'local';
    }

    private function resolveStorageDisk(): string
    {
        $config = config('filesystems.disks.supabase');

        if (! empty($config['key']) && ! empty($config['secret']) && ! empty($config['endpoint'])) {
            return 'supabase';
        }

        return 'local';
    }

    /**
     * LGU verification: mark a report as verified and trigger achievement hooks.
     */
    public function verify(Request $request)
    {
        $validated = $request->validate([
            'report_id' => 'required|uuid|exists:reports,id',
        ]);

        $report = Report::findOrFail($validated['report_id']);
        $report->status = 'verified';
        $report->save();

        $ticket = Ticket::where('reporter_user_id', $report->user_id)->latest()->first();
        if ($ticket) {
            $ticket->status = 'verified';
            $ticket->save();
        }

        if ($report->user_id) {
            $reporter = User::find($report->user_id);
            if ($reporter) {
                $previousPoints = $reporter->reward_points_balance;

                app(AchievementService::class)->evaluate($reporter, 'lgu_verified_count');

                $reporter->refresh();
                app(RankService::class)->handleRankUp($reporter, $previousPoints);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Report verified successfully.',
            'data' => [
                'report_id' => $report->id,
                'status' => $report->status,
            ],
        ]);
    }

    /**
     * Batch sync: accept an array of queued offline reports and process them.
     */
    public function batchSync(Request $request)
    {
        $validated = $request->validate([
            'reports' => 'required|array|min:1',
            'reports.*.base64Image' => 'required|string',
            'reports.*.latitude' => 'required|numeric',
            'reports.*.longitude' => 'required|numeric',
            'reports.*.user_id' => 'nullable|string|max:255',
            'reports.*.description' => 'nullable|string|max:5000',
            'reports.*.report_type' => 'nullable|string|max:100',
        ]);

        $results = [];
        $syncedCount = 0;

        foreach ($validated['reports'] as $queuedReport) {
            $subRequest = Request::create('/api/reports', 'POST', $queuedReport);
            $response = $this->store($subRequest);
            $result = json_decode($response->getContent(), true);

            if ($result['success'] ?? false) {
                $syncedCount++;
            }

            $results[] = $result;
        }

        if ($syncedCount > 0) {
            $userId = $this->resolveUserId($validated['reports'][0]['user_id'] ?? null);
            if ($userId !== self::GHOST_USER_ID) {
                $user = User::find($userId);
                if ($user) {
                    app(AchievementService::class)->evaluate($user, 'offline_sync', [
                        'increment' => $syncedCount,
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Synced {$syncedCount} of ".count($validated['reports']).' offline reports.',
            'data' => [
                'synced' => $syncedCount,
                'total' => count($validated['reports']),
                'results' => $results,
            ],
        ]);
    }
}
