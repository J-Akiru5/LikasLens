<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    /**
     * GET /admin/tenants
     * List all tenants (super_admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::query();

        if ($request->boolean('include_inactive')) {
            $query->withTrashed();
        }

        $tenants = $query
            ->orderBy('name')
            ->get([
                'id', 'name', 'slug', 'domain', 'branding', 'config',
                'country_code', 'timezone', 'is_active', 'created_at', 'updated_at',
            ]);

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    /**
     * POST /admin/tenants
     * Create a new tenant.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:tenants,slug|regex:/^[a-z0-9\-]+$/',
            'domain' => 'nullable|string|max:255|unique:tenants,domain',
            'branding' => 'nullable|array',
            'branding.primary_color' => 'nullable|string|max:20',
            'branding.logo_url' => 'nullable|url|max:500',
            'branding.favicon_url' => 'nullable|url|max:500',
            'config' => 'nullable|array',
            'config.features' => 'nullable|array',
            'config.limits' => 'nullable|array',
            'country_code' => 'nullable|string|max:5',
            'timezone' => 'nullable|string|max:64',
            'is_active' => 'nullable|boolean',
        ]);

        $tenant = Tenant::create([
            'id' => (string) Str::uuid(),
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'domain' => $validated['domain'] ?? null,
            'branding' => $validated['branding'] ?? null,
            'config' => $validated['config'] ?? null,
            'country_code' => $validated['country_code'] ?? 'PH',
            'timezone' => $validated['timezone'] ?? 'Asia/Manila',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $tenant,
            'message' => 'Tenant created successfully.',
        ], 201);
    }

    /**
     * GET /admin/tenants/{id}
     * Show a single tenant.
     */
    public function show(string $id): JsonResponse
    {
        $tenant = Tenant::withTrashed()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $tenant,
        ]);
    }

    /**
     * PUT /admin/tenants/{id}
     * Update a tenant (including branding).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => "sometimes|required|string|max:100|unique:tenants,slug,{$tenant->id}|regex:/^[a-z0-9\-]+$/",
            'domain' => "nullable|string|max:255|unique:tenants,domain,{$tenant->id}",
            'branding' => 'nullable|array',
            'branding.primary_color' => 'nullable|string|max:20',
            'branding.logo_url' => 'nullable|url|max:500',
            'branding.favicon_url' => 'nullable|url|max:500',
            'config' => 'nullable|array',
            'config.features' => 'nullable|array',
            'config.limits' => 'nullable|array',
            'country_code' => 'nullable|string|max:5',
            'timezone' => 'nullable|string|max:64',
            'is_active' => 'nullable|boolean',
        ]);

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'data' => $tenant,
            'message' => 'Tenant updated successfully.',
        ]);
    }

    /**
     * DELETE /admin/tenants/{id}
     * Soft-delete a tenant.
     */
    public function destroy(string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        // Prevent deleting the default tenant
        if ($tenant->slug === 'default') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the default tenant.',
            ], 422);
        }

        $tenant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tenant deleted successfully.',
        ]);
    }
}
