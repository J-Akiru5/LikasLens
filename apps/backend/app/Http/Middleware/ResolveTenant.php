<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    /**
     * Resolve the active tenant from the incoming request.
     *
     * Resolution order:
     *   1. X-Tenant-ID header (UUID)  — used by API clients / mobile apps
     *   2. X-Tenant-Slug header       — used by frontend middleware
     *   3. Subdomain                   — e.g. cebu.likaslens.org
     *   4. Default tenant (slug="default") — fallback for single-tenant mode
     *
     * Returns 404 if a tenant identifier is provided but no active tenant matches.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;

        // 1. Explicit tenant UUID in header
        if ($tenantId = $request->header('X-Tenant-ID')) {
            $tenant = Tenant::where('id', $tenantId)
                ->where('is_active', true)
                ->first();

            if (! $tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant not found or inactive.',
                ], 404);
            }
        }

        // 2. Tenant slug in header
        if (! $tenant && ($slug = $request->header('X-Tenant-Slug'))) {
            $tenant = Tenant::resolveBySlug($slug);

            if (! $tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant not found or inactive.',
                ], 404);
            }
        }

        // 3. Subdomain extraction
        if (! $tenant) {
            $host = $request->getHost();
            $slug = $this->extractSubdomain($host);

            if ($slug && $slug !== 'www' && $slug !== 'api') {
                $tenant = Tenant::resolveBySlug($slug);

                if (! $tenant) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tenant not found or inactive.',
                    ], 404);
                }
            }
        }

        // 4. Fallback to default tenant (single-tenant backward compat)
        if (! $tenant) {
            $tenant = Tenant::where('slug', 'default')
                ->where('is_active', true)
                ->first();
        }

        // Set the resolved tenant on the request and globally
        Tenant::setCurrent($tenant);

        if ($tenant) {
            $request->attributes->set('tenant', $tenant);
            $request->attributes->set('tenant_id', $tenant->id);
        }

        return $next($request);
    }

    /**
     * Extract the subdomain portion from a hostname.
     *
     * "cebu.likaslens.org" → "cebu"
     * "likaslens.org"      → null
     * "localhost"          → null
     */
    private function extractSubdomain(string $host): ?string
    {
        // Handle localhost and IP addresses — no subdomain
        if (str_contains($host, 'localhost') || preg_match('/^\d+\.\d+\.\d+\.\d+$/', $host)) {
            return null;
        }

        $parts = explode('.', $host);

        // Need at least 3 parts for a subdomain (sub.domain.tld)
        if (count($parts) < 3) {
            return null;
        }

        return $parts[0];
    }
}
