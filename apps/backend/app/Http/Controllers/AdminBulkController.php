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

        foreach ($validated['ids'] as $ticketId) {
            $ticket = Ticket::find($ticketId);
            if (! $ticket) {
                $failed[] = $ticketId;

                continue;
            }

            $oldStatus = $ticket->status;
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
                $failed[] = $ticketId;

                continue;
            }

            $updates = ['status' => $newStatus];
            if (in_array($newStatus, ['resolved', 'closed'])) {
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

        return response()->json([
            'success' => true,
            'message' => "{$updated} ticket(s) updated to '{$newStatus}'.",
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

        foreach ($validated['ids'] as $ticketId) {
            $existing = TicketAssignment::where('ticket_id', $ticketId)
                ->where('assigned_group_id', $validated['lgu_id'])
                ->first();

            if ($existing) {
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
                'new_values' => ['assigned_group_id' => $validated['lgu_id'], 'ngo_name' => $ngo->name],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "{$created} ticket(s) assigned to '{$ngo->name}'.",
            'data' => [
                'created' => $created,
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

        foreach ($validated['ids'] as $userId) {
            $user = User::find($userId);
            if (! $user) {
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

        return response()->json([
            'success' => true,
            'message' => "{$updated} user(s) role changed to '{$newRole}'.",
            'data' => [
                'updated' => $updated,
            ],
        ]);
    }

    /**
     * Bulk deactivate users.
     * POST /admin/users/bulk-deactivate
     */
    public function bulkUserDeactivate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|string|exists:users,id',
        ]);

        $deactivated = 0;

        foreach ($validated['ids'] as $userId) {
            $user = User::find($userId);
            if (! $user || $user->deleted_at) {
                continue;
            }

            $user->delete();
            $deactivated++;

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_user_deactivated',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'old_values' => ['deleted_at' => null],
                'new_values' => ['deleted_at' => now()->toISOString()],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "{$deactivated} user(s) deactivated.",
            'data' => [
                'deactivated' => $deactivated,
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

        foreach ($validated['ids'] as $ngoId) {
            $ngo = NgoGroup::find($ngoId);
            if (! $ngo) {
                continue;
            }

            $wasActive = $ngo->is_active;
            $ngo->update(['is_active' => true]);
            $verified++;

            AuditLog::create([
                'actor_user_id' => $request->user()->id,
                'action' => 'bulk_ngo_verified',
                'entity_type' => 'ngo_group',
                'entity_id' => $ngo->id,
                'old_values' => ['is_active' => $wasActive],
                'new_values' => ['is_active' => true],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "{$verified} NGO(s) verified.",
            'data' => [
                'verified' => $verified,
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

        foreach ($validated['ids'] as $ngoId) {
            $ngo = NgoGroup::find($ngoId);
            if (! $ngo) {
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

        return response()->json([
            'success' => true,
            'message' => "{$deleted} NGO(s) deleted.",
            'data' => [
                'deleted' => $deleted,
            ],
        ]);
    }
}
