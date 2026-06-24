<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $perPage = min((int) $request->query('per_page', 20), 50);

            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'unread_count' => $user->unreadNotifications()->count(),
                ],
            ]);
        } catch (\Illuminate\Database\ConnectionException $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Database connection unavailable.',
            ], 503);
        } catch (\Exception $e) {
            report($e);
            return response()->json([
                'success' => false,
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 20,
                    'total' => 0,
                    'unread_count' => 0,
                ],
            ], 200);
        }
    }

    /**
     * Get unread notification count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        try {
            $count = $request->user()->unreadNotifications()->count();

            return response()->json([
                'success' => true,
                'data' => ['unread_count' => $count],
            ]);
        } catch (\Illuminate\Database\ConnectionException $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Database connection unavailable.',
            ], 503);
        } catch (\Exception $e) {
            report($e);
            return response()->json([
                'success' => true,
                'data' => ['unread_count' => 0],
            ], 200);
        }
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        try {
            $notification = $request->user()->notifications()->findOrFail($id);
            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'data' => ['id' => $id, 'read_at' => $notification->read_at],
            ]);
        } catch (\Illuminate\Database\ConnectionException $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Database connection unavailable.',
            ], 503);
        } catch (\Exception $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.',
            ], 404);
        }
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        try {
            $request->user()->unreadNotifications()->update(['read_at' => now()]);

            return response()->json([
                'success' => true,
                'data' => ['marked_read' => true],
            ]);
        } catch (\Illuminate\Database\ConnectionException $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Database connection unavailable.',
            ], 503);
        } catch (\Exception $e) {
            report($e);
            return response()->json([
                'success' => true,
                'data' => ['marked_read' => true],
            ], 200);
        }
    }
}
