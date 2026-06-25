<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
     * Gracefully degrades to single-tenant mode if the tenants table
     * does not exist or no tenant is configured.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;

        try {
            // 1. Explicit tenant UUID in header
            if ($tenantId = $request->header('X-Tenant-ID')) {
                $tenant = Tenant::where('id', $tenantId)
                    ->where('is_active', true)
                    ->first();
            }

            // 2. Tenant slug in header
            if (! $tenant && ($slug = $request->header('X-Tenant-Slug'))) {
                $tenant = Tenant::resolveBySlug($slug);
            }

            // 3. Subdomain extraction
            if (! $tenant) {
                $host = $request->getHost();
                $slug = $this->extractSubdomain($host);

                if ($slug && $slug !== 'www' && $slug !== 'api') {
                    $tenant = Tenant::resolveBySlug($slug);
                }
            }

            // 4. Fallback to default tenant (single-tenant backward compat)
            if (! $tenant) {
                $tenant = Tenant::where('slug', 'default')
                    ->where('is_active', true)
                    ->first();
            }

            if ($tenant) {
                $request->attributes->set('tenant', $tenant);
                $request->attributes->set('tenant_id', $tenant->id);
            }
        } catch (\Throwable $e) {
            Log::warning('ResolveTenant: could not resolve tenant, continuing in single-tenant mode', [
                'error' => $e->getMessage(),
                'host' => $request->getHost(),
            ]);
        }

        Tenant::setCurrent($tenant);

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
        // Handle localhost, IP addresses, and hosted domains (no subdomain)
        if (
            str_contains($host, 'localhost')
            || preg_match('/^\d+\.\d+\.\d+\.\d+$/', $host)
            || str_contains($host, '.run.app')           // Google Cloud Run
            || str_contains($host, '.a.run.app')         // Google Cloud Run (alternate)
            || str_contains($host, '.azurewebsites.net') // Azure
            || str_contains($host, '.azurecontainerapps.io') // Azure Container Apps
            || str_contains($host, '.vercel.app')        // Vercel
            || str_contains($host, '.onrender.com')      // Render
            || str_contains($host, '.herokuapp.com')     // Heroku
        ) {
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
