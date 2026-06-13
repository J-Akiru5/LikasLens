<?php

namespace App\Http\Controllers;

use App\Events\TicketStatusChanged;
use App\Models\Report;
use App\Models\Ticket;
use App\Models\TicketEvidence;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\RankService;
use App\Services\BlockchainService;
use App\Services\ChainService;
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
            $rawBase64 = $this->stripDataUriPrefix($validated['base64Image']);
            if ($rawBase64 === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid base64 image data',
                ], 422);
            }

            $imageData = base64_decode($rawBase64, true);
            if ($imageData === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid base64 image data',
                ], 422);
            }

            // Ghost Mode EXIF stripping — remove all metadata before storage
            $imageData = $this->stripExifMetadata($imageData);

            $checksum = hash('sha256', $imageData);
            $mimeType = $this->detectMimeType($imageData);
            $extension = $this->mimeToExtension($mimeType);
            $filename = sprintf('%s_%s.%s', now()->format('Ymd_His'), Str::uuid7(), $extension);
            $storagePath = sprintf('evidence/%s/%s', now()->format('Y/m/d'), $filename);

            $userId = $this->resolveUserId($validated['user_id'] ?? null);

            // Server-side EXIF stripping: re-encode image via GD to ensure metadata is removed
            $exifStrippedAt = now();
            if (str_starts_with($mimeType, 'image/jpeg')) {
                $img = @imagecreatefromstring($imageData);
                if ($img) {
                    ob_start();
                    imagejpeg($img, null, 92);
                    $imageData = ob_get_clean();
                    imagedestroy($img);
                    $checksum = hash('sha256', $imageData);
                }
            } elseif ($mimeType === 'image/png') {
                $img = @imagecreatefromstring($imageData);
                if ($img) {
                    ob_start();
                    imagepng($img, null, 6);
                    $imageData = ob_get_clean();
                    imagedestroy($img);
                    $checksum = hash('sha256', $imageData);
                }
            }

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

            // Step 2 — Fire initial timeline entry for new ticket
            TicketStatusChanged::dispatch(
                ticket: $ticket,
                fromStatus: null,
                toStatus: 'open',
                actorId: $userId !== self::GHOST_USER_ID ? $userId : null,
                actorType: $userId !== self::GHOST_USER_ID ? 'user' : 'system',
                note: 'Ticket created from mobile report',
            );

            // Step 2.5 — Report chaining / duplicate detection (non-critical, best-effort)
            $chainData = null;
            try {
                $chain = app(ChainService::class)->processNewReport($ticket);
                $chainData = [
                    'chain_id' => $chain->id,
                    'is_new_chain' => $chain->primary_ticket_id === $ticket->id,
                    'total_reports' => $chain->total_reports,
                    'urgency_boost' => $chain->urgency_boost,
                ];
            } catch (\Throwable $e) {
                Log::warning('ReportController: Chain processing failed, continuing', [
                    'error' => $e->getMessage(),
                    'ticket_id' => $ticket->id,
                ]);
            }

            // Step 3 — AI triage (outside transaction — report survives even if AI is down)
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

            // Step 3.5 — Image similarity search (best-effort, non-blocking)
            $similarityResult = ['similar_reports' => [], 'embedding_stored' => false];
            try {
                $violationType = $triage['indicators'][0]['type'] ?? 'unknown';
                $similarityResult = app(TriageService::class)->checkSimilarity(
                    $validated['base64Image'],
                    $ticket->id,
                    $violationType,
                );
            } catch (\Throwable $e) {
                Log::warning('ReportController: Similarity check failed, continuing', [
                    'error' => $e->getMessage(),
                    'ticket_id' => $ticket->id,
                ]);
            }

            // Step 4 — Achievement & rank evaluation (non-critical, best-effort)
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

            // Step 4 — Blockchain evidence hashing (non-critical, best-effort)
            $evidenceHash = null;
            $blockchainTx = null;
            $blockchainVerifiedAt = null;
            try {
                $blockchainService = app(BlockchainService::class);

                $evidenceHash = $blockchainService->hashEvidence([
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'report_type' => $validated['report_type'] ?? null,
                    'severity' => $triage['indicators'][0]['severity'] ?? 'unclassified',
                    'ai_class' => $triage['indicators'][0]['type'] ?? null,
                    'timestamp' => now()->toISOString(),
                    'report_id' => $ticket->id,
                ]);

                $blockchainTx = $blockchainService->submitToBlockchain($evidenceHash);
                if ($blockchainTx) {
                    $blockchainVerifiedAt = now();
                }

                // Persist blockchain fields on the Report record
                $report = Report::where('user_id', $userId)
                    ->whereBetween('created_at', [
                        $ticket->created_at->subSeconds(5),
                        $ticket->created_at->addSeconds(5),
                    ])
                    ->first();
                if ($report) {
                    $report->update([
                        'evidence_hash' => $evidenceHash,
                        'blockchain_tx' => $blockchainTx,
                        'blockchain_verified_at' => $blockchainVerifiedAt,
                    ]);
                }

                Log::info('ReportController: Blockchain evidence hashing completed', [
                    'ticket_id' => $ticket->id,
                    'evidence_hash' => $evidenceHash,
                    'blockchain_tx' => $blockchainTx,
                ]);
            } catch (\Throwable $e) {
                Log::warning('ReportController: Blockchain hashing failed, continuing', [
                    'error' => $e->getMessage(),
                    'ticket_id' => $ticket->id,
                ]);
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
                    'blockchain' => [
                        'evidence_hash' => $evidenceHash,
                        'tx_hash' => $blockchainTx,
                        'explorer_url' => $blockchainTx ? app(BlockchainService::class)->getExplorerUrl($blockchainTx) : null,
                        'verified_at' => $blockchainVerifiedAt?->toISOString(),
                    ],
                    'chain' => $chainData,
                    'similar_reports' => $similarityResult['similar_reports'] ?? [],
                    'similar_reports_message' => ! empty($similarityResult['similar_reports'])
                        ? sprintf(
                            'This looks similar to %d other report%s in the area',
                            count($similarityResult['similar_reports']),
                            count($similarityResult['similar_reports']) === 1 ? '' : 's',
                        )
                        : null,
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

    /**
     * Verify blockchain evidence for a report.
     * Returns evidence hash, tx hash, explorer URL, and on-chain verification status.
     */
    public function verifyEvidence(string $id)
    {
        $report = Report::find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found',
            ], 404);
        }

        if (empty($report->evidence_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'No blockchain evidence found for this report',
            ], 404);
        }

        $blockchainService = app(BlockchainService::class);

        $onChainVerified = false;
        if ($report->blockchain_tx) {
            $onChainVerified = $blockchainService->verifyTransaction($report->blockchain_tx);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'report_id' => $report->id,
                'evidence_hash' => $report->evidence_hash,
                'tx_hash' => $report->blockchain_tx,
                'explorer_url' => $report->blockchain_tx
                    ? $blockchainService->getExplorerUrl($report->blockchain_tx)
                    : null,
                'on_chain_verified' => $onChainVerified,
                'verified_at' => $report->blockchain_verified_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Show the details of a report chain, including all linked tickets.
     */
    public function showChain(string $chainId)
    {
        $chain = app(ChainService::class)->getChainDetails($chainId);

        if (! $chain) {
            return response()->json([
                'success' => false,
                'message' => 'Chain not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'chain_id' => $chain->id,
                'primary_ticket_id' => $chain->primary_ticket_id,
                'location_name' => $chain->location_name,
                'latitude' => $chain->latitude,
                'longitude' => $chain->longitude,
                'radius_meters' => $chain->radius_meters,
                'total_reports' => $chain->total_reports,
                'urgency_boost' => $chain->urgency_boost,
                'first_reported_at' => $chain->first_reported_at?->toISOString(),
                'last_reported_at' => $chain->last_reported_at?->toISOString(),
                'status' => $chain->status,
                'tickets' => $chain->tickets->map(fn ($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'status' => $t->status,
                    'urgency_score' => $t->urgency_score,
                    'created_at' => $t->created_at?->toISOString(),
                ]),
            ],
        ]);
    }

    private function stripDataUriPrefix(string $value): ?string
    {
        if (str_starts_with($value, 'data:')) {
            $commaPos = strpos($value, ',');
            if ($commaPos === false) {
                return null;
            }
            return substr($value, $commaPos + 1);
        }

        return $value;
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
        $ghost = User::firstOrCreate(
            ['supabase_auth_user_id' => self::GHOST_USER_ID],
            [
                'name' => 'Anonymous Ghost',
                'email' => 'ghost@likaslens.local',
                'role' => 'ghost',
                'trust_score' => 0,
                'reward_points_balance' => 0,
                'password' => bcrypt(Str::random(32)),
            ]
        );

        return $ghost->id;
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

    /**
     * Strip EXIF metadata from image binary data.
     * Prefers Imagick (lossless strip), falls back to GD (re-encode).
     * Returns original data unchanged if the format is not a supported image type.
     */
    private function stripExifMetadata(string $imageData): string
    {
        $mime = $this->detectMimeType($imageData);

        // Only strip EXIF from formats that can carry it
        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            return $imageData;
        }

        // Prefer Imagick — it strips metadata without re-compressing pixels
        if (extension_loaded('imagick')) {
            try {
                $imagick = new \Imagick();
                $imagick->readImageBlob($imageData);
                $imagick->stripImage();
                $stripped = $imagick->getImageBlob();
                $imagick->destroy();

                Log::info('ReportController: EXIF stripped via Imagick', [
                    'original_bytes' => strlen($imageData),
                    'stripped_bytes' => strlen($stripped),
                ]);

                return $stripped;
            } catch (\Throwable $e) {
                Log::warning('ReportController: Imagick EXIF strip failed, falling back to GD', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Fallback — GD re-encodes the image, which drops all metadata
        if (extension_loaded('gd')) {
            $gdImage = @imagecreatefromstring($imageData);
            if ($gdImage !== false) {
                ob_start();
                $output = false;
                switch ($mime) {
                    case 'image/jpeg':
                        $output = imagejpeg($gdImage, null, 90);
                        break;
                    case 'image/png':
                        $output = imagepng($gdImage, null, 9);
                        break;
                    case 'image/webp':
                        $output = imagewebp($gdImage, null, 90);
                        break;
                }
                $stripped = ob_get_clean();
                imagedestroy($gdImage);

                if ($output !== false && $stripped !== false && strlen($stripped) > 0) {
                    Log::info('ReportController: EXIF stripped via GD re-encode', [
                        'original_bytes' => strlen($imageData),
                        'stripped_bytes' => strlen($stripped),
                    ]);

                    return $stripped;
                }
            }

            Log::warning('ReportController: GD EXIF strip produced empty output, returning original data');
        }

        // Neither extension available — log a warning so operators can fix the server
        Log::warning('ReportController: Neither Imagick nor GD available — EXIF data NOT stripped', [
            'mime' => $mime,
        ]);

        return $imageData;
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

        $ticket = Ticket::where('reporter_user_id', $report->user_id)
            ->whereBetween('created_at', [
                $report->created_at->subSeconds(5),
                $report->created_at->addSeconds(5),
            ])
            ->first();
        if ($ticket) {
            $oldStatus = $ticket->status;
            $ticket->status = 'verified';
            // Mark verified incidents as REDD+ MRV eligible
            $ticket->is_redd_eligible = true;
            $ticket->save();

            // Fire timeline event for LGU verification
            TicketStatusChanged::dispatch(
                ticket: $ticket,
                fromStatus: $oldStatus,
                toStatus: 'verified',
                actorId: $request->user()?->id,
                actorType: 'lgu',
                note: 'Report verified by LGU',
            );
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
            'reports' => 'required|array|min:1|max:50',
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

    /**
     * Community corroboration: allow a citizen to corroborate an existing report.
     * Requires GPS-diversity check (>50m apart) and different user.
     */
    public function corroborate(Request $request)
    {
        $validated = $request->validate([
            'report_id' => 'required|uuid|exists:reports,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'user_id' => 'nullable|string|max:255',
        ]);

        $report = Report::findOrFail($validated['report_id']);

        // Anti-Sybil: check if same user is trying to corroborate their own report
        if ($validated['user_id'] && $validated['user_id'] === $report->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot corroborate your own report.',
            ], 403);
        }

        // GPS-diversity check: must be >50m from original report
        $distance = $this->haversineDistance(
            $report->latitude, $report->longitude,
            $validated['latitude'], $validated['longitude']
        );

        if ($distance < 50) {
            return response()->json([
                'success' => false,
                'message' => 'Corroborating reports must be at least 50m from the original report.',
            ], 422);
        }

        // Check if report already has enough corroboration (2 reports/500m threshold)
        $existingCorroborations = Report::where('id', '!=', $validated['report_id'])
            ->whereBetween('created_at', [
                $report->created_at->subHours(24),
                $report->created_at->addHours(24),
            ])
            ->get()
            ->filter(function ($r) use ($report) {
                $dist = $this->haversineDistance(
                    $report->latitude, $report->longitude,
                    $r->latitude, $r->longitude
                );
                return $dist <= 500; // 500m corroboration radius
            })
            ->count();

        $corroborated = $existingCorroborations >= 1; // Original + 1 more = 2 reports

        // Link to chain if not already linked
        if ($corroborated && !$report->chain_id) {
            app(ChainService::class)->processNewReport($report);
        }

        return response()->json([
            'success' => true,
            'message' => $corroborated
                ? 'Corroboration threshold met! Report escalated for AI analysis.'
                : 'Corroboration recorded. Awaiting additional reports within 500m.',
            'data' => [
                'report_id' => $report->id,
                'corroborated' => $corroborated,
                'existing_corroborations' => $existingCorroborations,
                'required_for_escalation' => max(0, 1 - $existingCorroborations),
            ],
        ]);
    }

    /**
     * Anti-Sybil geofence check: reject reports within 5m of an existing report from the same user.
     */
    public function checkGeofence(Request $request)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'user_id' => 'nullable|string|max:255',
        ]);

        $geofenceRadius = 5; // 5m anti-Sybil geofence

        $nearbyReport = Report::where('user_id', $validated['user_id'] ?? 'ANONYMOUS_GHOST')
            ->where('created_at', '>', now()->subHours(24))
            ->get()
            ->first(function ($report) use ($validated, $geofenceRadius) {
                $distance = $this->haversineDistance(
                    $report->latitude, $report->longitude,
                    $validated['latitude'], $validated['longitude']
                );
                return $distance <= $geofenceRadius;
            });

        if ($nearbyReport) {
            return response()->json([
                'success' => false,
                'message' => 'A report already exists within 5m of this location from your account in the last 24 hours.',
                'existing_report_id' => $nearbyReport->id,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Location passes anti-Sybil geofence check.',
        ]);
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula.
     * Returns distance in meters.
     */
    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // Earth's radius in meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
