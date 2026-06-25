<?php

namespace App\Http\Controllers;

use App\Models\SlaConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSlaConfigController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SlaConfig::query();

        if ($request->filled('violation_type')) {
            $query->where('violation_type', $request->input('violation_type'));
        }

        $configs = $query->paginate(min((int) $request->input('per_page', 50), 100));

        return response()->json([
            'success' => true,
            'data' => $configs->items(),
            'meta' => [
                'current_page' => $configs->currentPage(),
                'last_page' => $configs->lastPage(),
                'per_page' => $configs->perPage(),
                'total' => $configs->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $config = SlaConfig::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $config,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'violation_type' => 'required|string|max:100|unique:sla_configs,violation_type',
            'response_hours' => 'required|integer|min:1',
            'resolution_hours' => 'required|integer|min:1',
            'escalation_enabled' => 'boolean',
            'country_code' => 'nullable|string|max:2',
        ]);

        $config = SlaConfig::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'SLA configuration created.',
            'data' => $config,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $config = SlaConfig::findOrFail($id);

        $validated = $request->validate([
            'violation_type' => 'sometimes|string|max:100|unique:sla_configs,violation_type,' . $id,
            'response_hours' => 'sometimes|integer|min:1',
            'resolution_hours' => 'sometimes|integer|min:1',
            'escalation_enabled' => 'boolean',
            'country_code' => 'nullable|string|max:2',
        ]);

        $config->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'SLA configuration updated.',
            'data' => $config,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $config = SlaConfig::findOrFail($id);
        $config->delete();

        return response()->json([
            'success' => true,
            'message' => 'SLA configuration deleted.',
        ]);
    }
}
