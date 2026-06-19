<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Ticket;
use App\Models\TicketClassification;
use App\Models\ViolationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTriageController extends Controller
{
    /**
     * GET /admin/triage
     * Returns tickets where AI confidence < 0.6000 or status is 'pending_review'.
     * Sorted by urgency_score DESC, then created_at ASC. Paginated.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);

        $query = Ticket::with(['reporter', 'evidence', 'classifications.violationType'])
            ->where(function ($q) {
                $q->where('ai_confidence', '<', 0.6000)
                    ->orWhere('status', 'pending_review');
            })
            ->orderByRaw('urgency_score IS NULL ASC, urgency_score DESC')
            ->orderBy('created_at', 'asc');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('address_text', 'like', "%{$search}%");
            });
        }

        $tickets = $query->paginate($perPage);

        $tickets->getCollection()->transform(function (Ticket $ticket) {
            $evidencePhoto = $ticket->evidence->first();

            return [
                'id' => $ticket->id,
                'display_id' => 'INC-'.strtoupper(substr($ticket->id, 0, 6)),
                'title' => $ticket->title,
                'description' => $ticket->description,
                'status' => $ticket->status,
                'ai_confidence' => $ticket->ai_confidence !== null
                    ? round((float) $ticket->ai_confidence * 100, 1)
                    : null,
                'ai_triage_summary' => $ticket->ai_triage_summary,
                'urgency_score' => $ticket->urgency_score,
                'location' => $ticket->address_text
                    ?? sprintf('%.4f, %.4f', $ticket->latitude ?? 0, $ticket->longitude ?? 0),
                'latitude' => $ticket->latitude,
                'longitude' => $ticket->longitude,
                'photo_url' => $evidencePhoto
                    ? "/storage/{$evidencePhoto->storage_path}"
                    : null,
                'photo_mime' => $evidencePhoto?->mime_type,
                'classifications' => $ticket->classifications->map(fn ($c) => [
                    'id' => $c->id,
                    'violation_type' => $c->violationType?->name ?? 'Unknown',
                    'confidence' => $c->confidence_score !== null
                        ? round((float) $c->confidence_score * 100, 1)
                        : null,
                ]),
                'reporter' => $ticket->reporter?->name ?? 'Anonymous',
                'created_at' => $ticket->created_at->toISOString(),
                'time_since' => $ticket->created_at->diffForHumans(),
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

    /**
     * GET /admin/triage/violation-types
     * Returns available violation types for the classify modal dropdown.
     */
    public function violationTypes(): JsonResponse
    {
        $types = ViolationType::select('id', 'code', 'name', 'description')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $types,
        ]);
    }

    /**
     * POST /admin/triage/{id}/classify
     * Admin manually classifies a report ticket.
     */
    public function classify(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'violation_type_id' => 'required|uuid|exists:violation_types,id',
            'severity' => 'required|integer|min:1|max:10',
            'notes' => 'nullable|string|max:2000',
        ]);

        $ticket = Ticket::findOrFail($id);
        $oldStatus = $ticket->status;

        // Create the manual classification
        TicketClassification::create([
            'ticket_id' => $ticket->id,
            'violation_type_id' => $validated['violation_type_id'],
            'classified_by' => 'manual_admin',
            'confidence_score' => 1.0,
        ]);

        // Update ticket status to investigating
        $ticket->update([
            'status' => 'investigating',
            'urgency_score' => max($ticket->urgency_score ?? 0, $validated['severity']),
        ]);

        // Audit log
        $violationType = ViolationType::find($validated['violation_type_id']);

        AuditLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'triage_manual_classify',
            'entity_type' => 'ticket',
            'entity_id' => $ticket->id,
            'old_values' => [
                'status' => $oldStatus,
                'urgency_score' => $ticket->getOriginal('urgency_score'),
            ],
            'new_values' => [
                'status' => 'investigating',
                'urgency_score' => $ticket->urgency_score,
                'violation_type_id' => $validated['violation_type_id'],
                'violation_type' => $violationType?->name,
                'severity' => $validated['severity'],
                'notes' => $validated['notes'] ?? null,
                'classified_by' => $request->user()->name ?? 'admin',
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket classified and moved to investigating.',
            'data' => [
                'id' => $ticket->id,
                'old_status' => $oldStatus,
                'new_status' => 'investigating',
                'violation_type' => $violationType?->name,
                'severity' => $validated['severity'],
            ],
        ]);
    }

    /**
     * POST /admin/triage/{id}/dismiss
     * Dismiss a triage ticket as spam.
     */
    public function dismiss(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);
        $oldStatus = $ticket->status;

        $ticket->update(['status' => 'closed']);

        AuditLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'triage_dismiss_spam',
            'entity_type' => 'ticket',
            'entity_id' => $ticket->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => 'closed', 'reason' => 'dismissed_as_spam'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket dismissed as spam.',
            'data' => [
                'id' => $ticket->id,
                'old_status' => $oldStatus,
                'new_status' => 'closed',
            ],
        ]);
    }

    /**
     * POST /admin/triage/{id}/escalate
     * Escalate a triage ticket to senior analyst.
     */
    public function escalate(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);
        $oldStatus = $ticket->status;
        $oldUrgency = $ticket->urgency_score;

        $newUrgency = min(($ticket->urgency_score ?? 5) + 3, 10);

        $ticket->update([
            'status' => 'open',
            'urgency_score' => $newUrgency,
        ]);

        AuditLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'triage_escalated',
            'entity_type' => 'ticket',
            'entity_id' => $ticket->id,
            'old_values' => ['status' => $oldStatus, 'urgency_score' => $oldUrgency],
            'new_values' => ['status' => 'open', 'urgency_score' => $newUrgency, 'reason' => 'escalated_to_senior'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket escalated to senior analyst.',
            'data' => [
                'id' => $ticket->id,
                'old_status' => $oldStatus,
                'new_status' => 'open',
                'urgency_score' => $newUrgency,
            ],
        ]);
    }
}
