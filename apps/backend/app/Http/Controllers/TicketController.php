<?php

namespace App\Http\Controllers;

use App\Events\TicketStatusChanged;
use App\Models\AuditLog;
use App\Models\Ticket;
use App\Models\TicketTimeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with('reporter')
            ->orderBy('created_at', 'desc');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('address_text', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        $tickets = $query->paginate($perPage);

        $tickets->getCollection()->transform(function (Ticket $ticket) {
            return [
                'id' => $ticket->id,
                'display_id' => 'INC-'.strtoupper(substr($ticket->id, 0, 6)),
                'category' => $ticket->ai_triage_summary ?? 'Uncategorized',
                'title' => $ticket->title,
                'description' => $ticket->description,
                'location' => $ticket->address_text ?? sprintf('%.4f, %.4f', $ticket->latitude ?? 0, $ticket->longitude ?? 0),
                'latitude' => $ticket->latitude,
                'longitude' => $ticket->longitude,
                'status' => ucfirst($ticket->status),
                'urgency_score' => $ticket->urgency_score,
                'reporter' => $ticket->reporter?->name ?? 'Anonymous',
                'created_at' => $ticket->created_at->toISOString(),
                'resolved_at' => $ticket->resolved_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $tickets->items(),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $ticket = Ticket::with(['reporter', 'evidence.uploadedBy', 'classifications', 'assignments.ngoGroup'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ticket->id,
                'display_id' => 'INC-'.strtoupper(substr($ticket->id, 0, 6)),
                'title' => $ticket->title,
                'description' => $ticket->description,
                'status' => $ticket->status,
                'latitude' => $ticket->latitude,
                'longitude' => $ticket->longitude,
                'address_text' => $ticket->address_text,
                'urgency_score' => $ticket->urgency_score,
                'ai_triage_summary' => $ticket->ai_triage_summary,
                'ai_confidence' => $ticket->ai_confidence,
                'reporter' => $ticket->reporter?->only(['id', 'name']),
                'evidence' => $ticket->evidence,
                'classifications' => $ticket->classifications,
                'assignments' => $ticket->assignments,
                'created_at' => $ticket->created_at,
                'resolved_at' => $ticket->resolved_at,
            ],
        ]);
    }

    /**
     * Return the full status timeline for a ticket.
     * Ghost-mode safe: reporter identity is not exposed.
     */
    public function timeline(string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);

        $entries = TicketTimeline::forTicket($ticket->id)
            ->with('actor:id,name,role')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function (TicketTimeline $entry) {
                $data = [
                    'id' => $entry->id,
                    'from_status' => $entry->from_status,
                    'to_status' => $entry->to_status,
                    'transition_label' => $entry->transition_label,
                    'actor_type' => $entry->actor_type,
                    'note' => $entry->note,
                    'metadata' => $entry->metadata,
                    'created_at' => $entry->created_at->toISOString(),
                ];

                // Only expose actor details for non-ghost, non-system entries
                if ($entry->actor && $entry->actor->role !== 'ghost') {
                    $data['actor'] = [
                        'id' => $entry->actor->id,
                        'name' => $entry->actor->name,
                        'role' => $entry->actor->role,
                    ];
                } else {
                    $data['actor'] = null;
                }

                return $data;
            });

        return response()->json([
            'success' => true,
            'data' => [
                'ticket_id' => $ticket->id,
                'display_id' => 'INC-' . strtoupper(substr($ticket->id, 0, 6)),
                'timeline' => $entries,
            ],
        ]);
    }

    /**
     * Transition ticket status with validation.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:open,investigating,monitoring,resolved,closed,verified',
        ]);

        $ticket = Ticket::findOrFail($id);
        $oldStatus = $ticket->status;
        $newStatus = $validated['status'];

        $allowedTransitions = [
            'open' => ['investigating', 'closed'],
            'investigating' => ['monitoring', 'resolved', 'closed'],
            'monitoring' => ['resolved', 'investigating', 'closed'],
            'resolved' => ['verified', 'closed'],
            'pending_review' => ['open', 'investigating', 'closed'],
            'verified' => ['closed'],
            'closed' => [],
        ];

        if (! in_array($newStatus, $allowedTransitions[$oldStatus] ?? [])) {
            return response()->json([
                'success' => false,
                'message' => "Cannot transition from '{$oldStatus}' to '{$newStatus}'.",
            ], 422);
        }

        $updates = ['status' => $newStatus];
        if (in_array($newStatus, ['resolved', 'closed'])) {
            $updates['resolved_at'] = now();
        }

        $ticket->update($updates);

        AuditLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'ticket_status_changed',
            'entity_type' => 'ticket',
            'entity_id' => $ticket->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $newStatus],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Fire the status-changed event for timeline tracking + notifications
        $actorType = in_array($request->user()->role, ['analyst', 'super_admin']) ? 'user' : 'lgu';
        TicketStatusChanged::dispatch(
            ticket: $ticket,
            fromStatus: $oldStatus,
            toStatus: $newStatus,
            actorId: $request->user()->id,
            actorType: $actorType,
        );

        // Notify AI routing learner when a ticket is resolved
        if ($newStatus === 'resolved' && $ticket->created_at) {
            $this->notifyRoutingLearner($ticket);
        }

        return response()->json([
            'success' => true,
            'message' => "Ticket status changed from '{$oldStatus}' to '{$newStatus}'.",
            'data' => [
                'id' => $ticket->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'resolved_at' => $ticket->resolved_at,
            ],
        ]);
    }

    /**
     * Explain mode (Althena-inspired): surface the rule chain that fired for a ticket.
     *
     * Returns the graph traversal the AI service used to route this ticket:
     * the rule that matched, the statute it maps to, the agency that owns
     * the response, the breakdown of confidence by indicator, and the
     * neighbouring tickets in the same geographic / categorical cluster.
     *
     * GET /api/tickets/{id}/explain
     */
    public function explain(string $id): JsonResponse
    {
        $ticket = Ticket::with(['reporter', 'classifications', 'assignments.ngoGroup'])->findOrFail($id);

        $aiUrl = config('services.ai.url');
        $apiKey = config('services.ai.api_key');

        $ruleChain = null;
        if ($aiUrl && $apiKey) {
            try {
                $response = Http::withHeaders(['X-API-Key' => $apiKey])
                    ->timeout(3)
                    ->get($aiUrl . '/routing/explain', [
                        'ticket_id' => $ticket->id,
                        'category' => $ticket->ai_triage_summary,
                        'confidence' => (float) $ticket->ai_confidence,
                    ]);
                if ($response->successful()) {
                    $ruleChain = $response->json('data');
                }
            } catch (\Throwable $e) {
                Log::warning('Explain mode AI call failed', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $confidence = (float) ($ticket->ai_confidence ?? 0);
        $neighbours = $ticket->ai_triage_summary
            ? Ticket::where('ai_triage_summary', $ticket->ai_triage_summary)
                ->where('id', '!=', $ticket->id)
                ->where('created_at', '>=', now()->subDays(30))
                ->limit(5)
                ->get(['id', 'title', 'status', 'ai_confidence', 'created_at'])
            : collect();

        return response()->json([
            'success' => true,
            'data' => [
                'ticket_id' => $ticket->id,
                'display_id' => 'INC-' . strtoupper(substr($ticket->id, 0, 6)),
                'category' => $ticket->ai_triage_summary,
                'confidence' => $confidence,
                'confidence_breakdown' => [
                    'visual' => $confidence,
                    'community_corroboration' => $ticket->chain_id ? 1.0 : 0.4,
                    'geo_within_known_zone' => $this->isWithinKnownZone($ticket) ? 0.9 : 0.5,
                ],
                'rule_chain' => $ruleChain ?? [
                    'rule_fired' => $ticket->ai_triage_summary
                        ? "category:{$ticket->ai_triage_summary} → routing"
                        : 'no_rule',
                    'statute' => $this->statuteFor($ticket->ai_triage_summary),
                    'agency' => $this->agencyFor($ticket->ai_triage_summary),
                ],
                'neighbours' => $neighbours,
            ],
        ]);
    }

    private function isWithinKnownZone(Ticket $ticket): bool
    {
        if (! $ticket->latitude || ! $ticket->longitude) {
            return false;
        }
        return Ticket::where('id', '!=', $ticket->id)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereRaw('ABS(latitude - ?) < 0.05', [$ticket->latitude])
            ->whereRaw('ABS(longitude - ?) < 0.05', [$ticket->longitude])
            ->exists();
    }

    private function statuteFor(?string $category): ?string
    {
        return match ($category) {
            'Illegal Dumping', 'solid_waste' => 'RA 9003 (Ecological Solid Waste Management Act)',
            'Deforestation', 'vegetation' => 'PD 705 (Revised Forestry Code) / RA 7161',
            'Water Pollution' => 'RA 9275 (Clean Water Act)',
            'Air Pollution' => 'RA 8749 (Clean Air Act)',
            'Wildlife', 'fauna' => 'RA 9147 (Wildlife Resources Conservation Act)',
            default => null,
        };
    }

    private function agencyFor(?string $category): ?string
    {
        return match ($category) {
            'Illegal Dumping', 'solid_waste' => 'DENR Region VI / LGU Solid Waste Office',
            'Deforestation', 'vegetation' => 'DENR Region VI / PENRO',
            'Water Pollution' => 'DENR Region VI / EMB',
            'Air Pollution' => 'DENR Region VI / EMB',
            'Wildlife', 'fauna' => 'DENR Region VI / BMB / PNP-Maritime',
            default => null,
        };
    }

    /**
     * Notify the AI service routing learner about a resolved ticket.
     *
     * Calculates hours from ticket creation to resolution and sends the
     * resolution time so the learner can update its scoring table.
     */
    private function notifyRoutingLearner(Ticket $ticket): void
    {
        $aiUrl = config('services.ai.url');
        $apiKey = config('services.ai.api_key');

        if (! $aiUrl || ! $apiKey) {
            return;
        }

        $violationType = $ticket->ai_triage_summary ?? 'unknown';
        $lguId = $ticket->assignments()->first()?->ngo_group_id;

        if (! $lguId) {
            return;
        }

        $hours = $ticket->created_at->diffInMinutes(now()) / 60;

        try {
            Http::withHeaders(['X-API-Key' => $apiKey])
                ->timeout(5)
                ->post($aiUrl . '/routing/record-resolution', [
                    'violation_type' => $violationType,
                    'lgu_id' => (string) $lguId,
                    'resolution_hours' => round($hours, 2),
                ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to notify AI routing learner', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
