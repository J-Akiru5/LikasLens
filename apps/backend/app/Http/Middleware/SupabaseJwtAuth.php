<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\UserCreated;
use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validate Supabase JWTs and resolve the Laravel user.
 *
 * This middleware replaces the Sanctum token-sync dance. The frontend sends
 * the Supabase `access_token` (a standard HS256 JWT) as a Bearer token.
 * We verify it locally using the SUPABASE_JWT_SECRET, extract the user
 * claims, and find-or-create the corresponding Laravel user.
 *
 * Industry 2026 pattern: Supabase owns auth, Laravel owns data.
 * No token sync, no cookie juggling, no race conditions.
 */
class SupabaseJwtAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->unauthorized('Missing Bearer token.');
        }

        $payload = $this->decodeJwt($token);

        if ($payload === null) {
            return $this->unauthorized('Invalid or expired token.');
        }

        $supabaseUserId = $payload['sub'] ?? null;
        $email = $payload['email'] ?? null;

        if (! $supabaseUserId) {
            return $this->unauthorized('Token missing user identifier.');
        }

        // Resolve tenant (ResolveTenant middleware already ran before us)
        $tenant = Tenant::current();

        $user = $this->resolveUser($supabaseUserId, $email, $tenant);

        if (! $user) {
            return $this->unauthorized('Could not resolve user.');
        }

        // Bind the authenticated user to the request
        $request->setUser($user);

        return $next($request);
    }

    /**
     * Decode and verify a Supabase HS256 JWT.
     */
    private function decodeJwt(string $token): ?array
    {
        $secret = config('services.supabase.jwt_secret');

        if (empty($secret)) {
            Log::error('[SupabaseJwtAuth] SUPABASE_JWT_SECRET is not configured.');
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header64, $payload64, $signature64] = $parts;

        // Verify algorithm is HS256
        $header = json_decode(base64_decode(strtr($header64, '-_', '+/')), true);
        if (! is_array($header) || ($header['alg'] ?? '') !== 'HS256') {
            return null;
        }

        // Verify signature
        $expectedSig = hash_hmac('sha256', "$header64.$payload64", $secret, true);
        $actualSig = base64_decode(strtr($signature64, '-_', '+/'));

        if (! hash_equals($expectedSig, $actualSig)) {
            Log::warning('[SupabaseJwtAuth] JWT signature mismatch.');
            return null;
        }

        // Decode payload
        $payload = json_decode(base64_decode(strtr($payload64, '-_', '+/')), true);

        if (! is_array($payload)) {
            return null;
        }

        // Check expiration
        $now = time();
        if (isset($payload['exp']) && $payload['exp'] < $now) {
            return null;
        }

        // Check issued-at (reject tokens from the future)
        if (isset($payload['iat']) && $payload['iat'] > $now + 60) {
            return null;
        }

        return $payload;
    }

    /**
     * Find or create the Laravel user from Supabase claims.
     */
    private function resolveUser(string $supabaseUserId, ?string $email, ?Tenant $tenant): ?User
    {
        // 1. Try to find existing user by Supabase ID (global lookup)
        $user = User::withoutGlobalScope(\App\Scopes\TenantScope::class)
            ->where('supabase_auth_user_id', $supabaseUserId)
            ->first();

        if ($user) {
            // Update email/name if they changed in Supabase
            $dirty = false;
            if ($email && $user->email !== $email) {
                $user->email = $email;
                $dirty = true;
            }
            if ($dirty) {
                $user->saveQuietly();
            }

            return $user;
        }

        // 2. Create new user
        if (! $tenant) {
            $tenant = Tenant::where('slug', 'default')->where('is_active', true)->first();
        }

        $user = User::create([
            'supabase_auth_user_id' => $supabaseUserId,
            'name' => $email ? explode('@', $email)[0] : 'Citizen',
            'email' => $email ?? $supabaseUserId . '@placeholder.local',
            'password' => Hash::make(Str::random(32)),
            'role' => 'citizen',
            'trust_score' => 0,
            'reward_points_balance' => 0,
            'tenant_id' => $tenant?->id,
        ]);

        UserCreated::dispatch($user);

        return $user;
    }

    private function unauthorized(string $message): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 401);
    }
}
