<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AdminUserController extends Controller
{
    /**
     * Synchronize local users table with Supabase Auth identities.
     */
    private function syncUsersWithSupabase(): void
    {
        $supabaseUrl = env('SUPABASE_URL');
        $serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');

        // Safety check: Don't attempt to sync if keys aren't configured yet
        if (!$supabaseUrl || !$serviceKey) {
            return;
        }

        try {
            // Fetch users directly from the administrative Supabase Auth endpoint
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $serviceKey,
                'apikey' => $serviceKey,
            ])->get($supabaseUrl . '/auth/v1/admin/users');

            if ($response->successful() && isset($response->json()['users'])) {
                $supabaseUsers = $response->json()['users'];

                foreach ($supabaseUsers as $sUser) {
                    // Sync by checking if the supabase user ID matches our local database record
                    User::updateOrCreate(
                        ['supabase_auth_user_id' => $sUser['id']], // Unique lookup column
                        [
                            'email' => $sUser['email'],
                            // Use metadata name if available, otherwise fall back to email username splitting
                            'name' => $sUser['user_metadata']['full_name'] ?? explode('@', $sUser['email'])[0],
                            // Set default values for new profiles if they don't exist yet
                            'role' => $sUser['user_metadata']['role'] ?? 'citizen',
                            'trust_score' => 100, // Default starting value
                            'reward_points_balance' => 50, // Default welcome grant values
                        ]
                    );
                }
            }
        } catch (\Exception $e) {
            // Silent catch to prevent the entire endpoint from breaking if Supabase is temporarily unreachable
            logger('Supabase synchronization error: ' . $e->getMessage());
        }
    }

    public function index(Request $request): JsonResponse
    {
        // 1. Run the sync process first to fetch fresh profiles from Supabase
        $this->syncUsersWithSupabase();

        // 2. Continue with your existing local database filtering, search, and pagination query logic
        $query = User::query()->orderBy('created_at', 'desc');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $users = $query->paginate(min((int) $request->input('per_page', 20), 50));

        // 3. Keep your existing structured response format exactly the same
        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'supabase_auth_user_id' => $user->supabase_auth_user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'trust_score' => $user->trust_score,
                'reward_points_balance' => $user->reward_points_balance,
                'created_at' => $user->created_at,
                'deleted_at' => $user->deleted_at,
            ],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'trust_score' => 'sometimes|integer|min:0|max:100',
            'reward_points_balance' => 'sometimes|integer|min:0',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated.',
            'data' => $user->fresh(),
        ]);
    }

    public function updateRole(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:citizen,ghost,analyst,super_admin',
        ]);

        $user = User::findOrFail($id);
        $oldRole = $user->role;
        $user->update(['role' => $validated['role']]);

        AuditLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'role_change',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'old_values' => ['role' => $oldRole],
            'new_values' => ['role' => $validated['role']],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "User role changed from '{$oldRole}' to '{$validated['role']}'.",
            'data' => $user->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deactivated.',
        ]);
    }
}