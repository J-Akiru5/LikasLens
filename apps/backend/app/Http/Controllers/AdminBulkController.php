<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\NgoGroup;
use App\Models\Ticket;
use App\Models\TicketAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBulkController extends Controller
{
    /**
     * Bulk update ticket statuses.
     * POST /admin/tickets/bulk-status
     */
    public function bulkTicketStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:tickets,id',
            'status' => 'required|string|in:open,investigating,monitoring,resolved,closed,verified',
        ]);

        $newStatus = $validated['status'];
        $updated = 0;
        $failed = [];

        $allowedTransitions = [
            'open' => ['investigating', 'closed'],
            'investigating' => ['monitoring', 'resolved', 'closed'],
            'monitoring' => ['resolved', 'investigating', 'closed'],
            'resolved' => ['verified', 'closed'],
            'pending_review' => ['open', 'investigating', 'closed'],
            'verified' => ['closed'],
            'closed' => [],
        ];

        foreach ($validated['ids'] as $ticketId) {
            $ticket = Ticket::find($ticketId);
            if (! $ticket) {
                $failed[] = $ticketId;

                continue;
            }

            $oldStatus = $ticket->status;

            if (! in_array($newStatus, $allowedTransitions[$oldStatus] ?? [])) {
                $failed[] = $ticketId;

                continue;
            }

            $updates = ['status' => $newStatus];
            if (in_array($newStatus, ['resolved', 'closed'], true)) {
                $updates['resolved_at'] = now();
            }

            $ticket->update($updates);
            $updated++;

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_ticket_status_changed',
                'entity_type' => 'ticket',
                'entity_id' => $ticket->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => $newStatus],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $message = "{$updated} ticket(s) updated to '{$newStatus}'.";
        if (count($failed) > 0) {
            $message .= ' '.count($failed).' ticket(s) skipped (invalid transition or not found).';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'updated' => $updated,
                'failed' => $failed,
            ],
        ]);
    }

    /**
     * Bulk assign tickets to an NGO/LGU.
     * POST /admin/tickets/bulk-assign
     */
    public function bulkTicketAssign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:tickets,id',
            'lgu_id' => 'required|string|exists:ngo_groups,id',
        ]);

        $ngo = NgoGroup::findOrFail($validated['lgu_id']);
        $created = 0;
        $skipped = 0;

        foreach ($validated['ids'] as $ticketId) {
            $existing = TicketAssignment::where('ticket_id', $ticketId)
                ->where('assigned_group_id', $validated['lgu_id'])
                ->first();

            if ($existing) {
                $skipped++;

                continue;
            }

            TicketAssignment::create([
                'ticket_id' => $ticketId,
                'assigned_group_id' => $validated['lgu_id'],
                'assigned_by_user_id' => $request->user()->id,
                'status' => 'assigned',
            ]);
            $created++;

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_ticket_assigned',
                'entity_type' => 'ticket',
                'entity_id' => $ticketId,
                'new_values' => [
                    'assigned_group_id' => $validated['lgu_id'],
                    'ngo_name' => $ngo->name,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $message = "{$created} ticket(s) assigned to '{$ngo->name}'.";
        if ($skipped > 0) {
            $message .= " {$skipped} ticket(s) already assigned — skipped.";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'created' => $created,
                'skipped' => $skipped,
            ],
        ]);
    }

    /**
     * Bulk delete tickets (soft-delete).
     * POST /admin/tickets/bulk-delete
     */
    public function bulkTicketDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:tickets,id',
        ]);

        $deleted = 0;
        $skipped = 0;

        foreach ($validated['ids'] as $ticketId) {
            $ticket = Ticket::find($ticketId);
            if (! $ticket) {
                $skipped++;

                continue;
            }

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_ticket_deleted',
                'entity_type' => 'ticket',
                'entity_id' => $ticket->id,
                'old_values' => ['title' => $ticket->title, 'status' => $ticket->status],
                'new_values' => ['deleted' => true],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $ticket->delete();
            $deleted++;
        }

        $message = "{$deleted} ticket(s) deleted.";
        if ($skipped > 0) {
            $message .= " {$skipped} ticket(s) skipped (not found).";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'deleted' => $deleted,
                'skipped' => $skipped,
            ],
        ]);
    }

    /**
     * Bulk update user roles.
     * POST /admin/users/bulk-role
     */
    public function bulkUserRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:users,id',
            'role' => 'required|string|in:citizen,ghost,lgu,partner,analyst,super_admin',
        ]);

        $newRole = $validated['role'];
        $updated = 0;
        $skipped = 0;

        foreach ($validated['ids'] as $userId) {
            $user = User::find($userId);
            if (! $user) {
                $skipped++;

                continue;
            }

            if ($user->role === $newRole) {
                $skipped++;

                continue;
            }

            $oldRole = $user->role;
            $user->update(['role' => $newRole]);
            $updated++;

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_role_change',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'old_values' => ['role' => $oldRole],
                'new_values' => ['role' => $newRole],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $message = "{$updated} user(s) role changed to '{$newRole}'.";
        if ($skipped > 0) {
            $message .= " {$skipped} user(s) skipped (already had that role).";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'updated' => $updated,
                'skipped' => $skipped,
            ],
        ]);
    }

    /**
     * Bulk deactivate users (soft-delete).
     * POST /admin/users/bulk-deactivate
     */
    public function bulkUserDeactivate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:users,id',
        ]);

        $deactivated = 0;
        $skipped = 0;
        $actingUserId = $request->user()->id;

        foreach ($validated['ids'] as $userId) {
            // Prevent self-deactivation
            if ($userId === $actingUserId) {
                $skipped++;

                continue;
            }

            $user = User::find($userId);
            if (! $user) {
                $skipped++;

                continue;
            }

            $user->delete();
            $deactivated++;

            AuditLog::create([
                'actor_user_id' => $actingUserId,
                'action' => 'bulk_user_deactivated',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'old_values' => ['deleted_at' => null],
                'new_values' => ['deleted_at' => now()->toISOString()],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $message = "{$deactivated} user(s) deactivated.";
        if ($skipped > 0) {
            $message .= " {$skipped} user(s) skipped (self or already inactive).";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'deactivated' => $deactivated,
                'skipped' => $skipped,
            ],
        ]);
    }

    /**
     * Bulk verify NGOs (set is_active = true).
     * POST /admin/ngos/bulk-verify
     */
    public function bulkNgoVerify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:ngo_groups,id',
        ]);

        $verified = 0;
        $skipped = 0;

        foreach ($validated['ids'] as $ngoId) {
            $ngo = NgoGroup::find($ngoId);
            if (! $ngo) {
                $skipped++;

                continue;
            }

            if ($ngo->is_active) {
                $skipped++;

                continue;
            }

            $ngo->update(['is_active' => true]);
            $verified++;

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_ngo_verified',
                'entity_type' => 'ngo_group',
                'entity_id' => $ngo->id,
                'old_values' => ['is_active' => false],
                'new_values' => ['is_active' => true],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $message = "{$verified} NGO(s) verified.";
        if ($skipped > 0) {
            $message .= " {$skipped} NGO(s) skipped (already active or not found).";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'verified' => $verified,
                'skipped' => $skipped,
            ],
        ]);
    }

    /**
     * Bulk delete NGOs.
     * POST /admin/ngos/bulk-delete
     */
    public function bulkNgoDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:ngo_groups,id',
        ]);

        $deleted = 0;
        $skipped = 0;

        foreach ($validated['ids'] as $ngoId) {
            $ngo = NgoGroup::find($ngoId);
            if (! $ngo) {
                $skipped++;

                continue;
            }

            // Check for active assignments before deleting
            $hasActiveAssignments = TicketAssignment::where('assigned_group_id', $ngoId)
                ->where('status', 'assigned')
                ->exists();

            if ($hasActiveAssignments) {
                $skipped++;

                continue;
            }

            $ngoName = $ngo->name;
            $ngo->delete();
            $deleted++;

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_ngo_deleted',
                'entity_type' => 'ngo_group',
                'entity_id' => $ngoId,
                'old_values' => ['name' => $ngoName],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $message = "{$deleted} NGO(s) deleted.";
        if ($skipped > 0) {
            $message .= " {$skipped} NGO(s) skipped (not found or has active assignments).";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'deleted' => $deleted,
                'skipped' => $skipped,
            ],
        ]);
    }
}
