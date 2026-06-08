<?php

namespace App\Http\Controllers;

use App\Events\UserCreated;
use App\Models\User;
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

        $token = $user->createToken('api-token')->plainTextToken;

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

        $token = $user->createToken('api-token')->plainTextToken;

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
            'role' => 'nullable|string|in:citizen,ghost,analyst,super_admin',
        ]);

        $user = User::where('supabase_auth_user_id', $validated['supabase_auth_user_id'])->first();
        $role = $validated['role'] ?? 'citizen';

        if (! $user) {
            $user = User::create([
                'supabase_auth_user_id' => $validated['supabase_auth_user_id'],
                'name' => $validated['name'] ?? 'Citizen',
                'email' => $validated['email'],
                'password' => Hash::make(Str::random(32)),
                'role' => $role,
                'trust_score' => 0,
                'reward_points_balance' => 0,
            ]);

            UserCreated::dispatch($user);
        } else {
            $user->update([
                'email' => $validated['email'],
                'name' => $validated['name'] ?? $user->name,
                'role' => $role,
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

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

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
