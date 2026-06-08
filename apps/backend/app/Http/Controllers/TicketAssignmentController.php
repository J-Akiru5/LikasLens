<?php

namespace App\Http\Controllers;

use App\Models\TicketAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TicketAssignmentController extends Controller
{
    public function index()
    {
        Gate::authorize('viewAny', TicketAssignment::class);

        return response()->json([
            'success' => true,
            'data' => TicketAssignment::with(['ticket', 'ngoGroup', 'assignedBy'])->get(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', TicketAssignment::class);

        $validated = $request->validate([
            'ticket_id' => 'required|string|exists:tickets,id',
            'assigned_group_id' => 'required|string|exists:ngo_groups,id',
            'status' => 'required|string|in:assigned,in_progress,completed',
            'assignment_reason' => 'nullable|string|max:1000',
        ]);

        $assignment = TicketAssignment::create([
            ...$validated,
            'assigned_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket assignment created.',
            'data' => $assignment->load(['ticket', 'ngoGroup', 'assignedBy']),
        ], 201);
    }

    public function show(TicketAssignment $ticketAssignment)
    {
        Gate::authorize('view', $ticketAssignment);

        return response()->json([
            'success' => true,
            'data' => $ticketAssignment->load(['ticket', 'ngoGroup', 'assignedBy']),
        ]);
    }

    public function update(Request $request, TicketAssignment $ticketAssignment)
    {
        Gate::authorize('update', $ticketAssignment);

        $validated = $request->validate([
            'status' => 'required|string|in:assigned,in_progress,completed',
            'assignment_reason' => 'nullable|string|max:1000',
        ]);

        if ($validated['status'] === 'completed') {
            $validated['completed_at'] = now();
        }

        $ticketAssignment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Ticket assignment updated.',
            'data' => $ticketAssignment->fresh()->load(['ticket', 'ngoGroup', 'assignedBy']),
        ]);
    }

    public function destroy(TicketAssignment $ticketAssignment)
    {
        Gate::authorize('delete', $ticketAssignment);

        $ticketAssignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ticket assignment deleted.',
        ]);
    }
}
