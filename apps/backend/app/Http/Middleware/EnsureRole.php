<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        foreach ($roles as $role) {
            if ($user->role === $role) {
                return $next($request);
            }
        }

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'rbac_denied',
            'entity_type' => 'route',
            'entity_id' => $request->method().' '.$request->path(),
            'old_values' => ['role' => $user->role],
            'new_values' => ['required_roles' => $roles],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Forbidden. Requires one of: '.implode(', ', $roles).'.',
        ], 403);
    }
}
