<?php

namespace App\Http\Controllers;

use App\Events\UserCreated;
use App\Models\AuditLog;
use App\Models\User;
use App\Scopes\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'supabase_auth_user_id' => $request->input('supabase_auth_user_id', (string) Str::uuid()),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'citizen',
            'trust_score' => 0,
            'reward_points_balance' => 0,
        ]);

        UserCreated::dispatch($user);

        $token = $user->createToken('api-token', ['*'], now()->addHours(24))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        $token = $user->createToken('api-token', ['*'], now()->addHours(24))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ],
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supabase_auth_user_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'nullable|string|max:255',
        ]);

        $user = User::withoutGlobalScope(TenantScope::class)
            ->where('supabase_auth_user_id', $validated['supabase_auth_user_id'])
            ->first();

        if (! $user) {
            $user = User::create([
                'supabase_auth_user_id' => $validated['supabase_auth_user_id'],
                'name' => $validated['name'] ?? 'Citizen',
                'email' => $validated['email'],
                'password' => Hash::make(Str::random(32)),
                'role' => 'citizen',
                'trust_score' => 0,
                'reward_points_balance' => 0,
            ]);

            UserCreated::dispatch($user);
        } else {
            $user->update([
                'email' => $validated['email'],
                'name' => $validated['name'] ?? $user->name,
            ]);
        }

        $token = $user->createToken('api-token', ['*'], now()->addHours(24))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User synced successfully.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'trust_score' => $user->trust_score,
                    'reward_points_balance' => $user->reward_points_balance,
                ],
                'token' => $token,
            ],
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $accessToken = $user->currentAccessToken();

        // Revoke the old token
        $accessToken->delete();

        // Issue a new token with fresh expiry
        $token = $user->createToken('api-token', ['*'], now()->addHours(24))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully.',
            'data' => [
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    public function exportData(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'trust_score' => $user->trust_score,
                'reward_points_balance' => $user->reward_points_balance,
                'created_at' => $user->created_at,
            ],
            'reports' => $user->reports()->get(['id', 'latitude', 'longitude', 'image_path', 'created_at']),
            'tickets' => $user->tickets()->get(['id', 'status', 'title', 'description', 'created_at']),
            'achievements' => $user->achievements()->get(['name', 'description', 'tier', 'points_awarded']),
            'wallet' => $user->wallet,
            'reward_ledger' => $user->rewardLedger()->get(['direction', 'points', 'created_at', 'expires_at']),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        // Anonymize user data instead of hard delete
        $user->update([
            'name' => 'Deleted User',
            'email' => 'deleted_'.$user->id.'@removed.local',
            'password' => bcrypt(Str::random(32)),
            'role' => 'citizen',
            'trust_score' => 0,
            'reward_points_balance' => 0,
            'supabase_auth_user_id' => 'deleted_'.$user->id,
        ]);

        // Delete wallet and achievements
        $user->wallet()->delete();
        $user->userAchievements()->delete();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'account_deleted',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully.',
        ]);
    }
}
