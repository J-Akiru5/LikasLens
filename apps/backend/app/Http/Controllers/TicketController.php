<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                'display_id' => 'INC-' . str_pad((string) Ticket::where('created_at', '<=', $ticket->created_at)->count(), 3, '0', STR_PAD_LEFT),
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
                'title' => $ticket->title,
                'description' => $ticket->description,
                'status' => $ticket->status,
                'latitude' => $ticket->latitude,
                'longitude' => $ticket->longitude,
                'address_text' => $ticket->address_text,
                'urgency_score' => $ticket->urgency_score,
                'ai_triage_summary' => $ticket->ai_triage_summary,
                'ai_confidence' => $ticket->ai_confidence,
                'reporter' => $ticket->reporter?->only(['id', 'name', 'email']),
                'evidence' => $ticket->evidence,
                'classifications' => $ticket->classifications,
                'assignments' => $ticket->assignments,
                'created_at' => $ticket->created_at,
                'resolved_at' => $ticket->resolved_at,
            ],
        ]);
    }
}
