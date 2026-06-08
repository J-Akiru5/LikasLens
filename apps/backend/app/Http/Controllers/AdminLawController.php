<?php

namespace App\Http\Controllers;

use App\Models\EnvironmentalLawPh;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLawController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EnvironmentalLawPh::with('penalties', 'violationTypes')->orderBy('law_code');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%")
                    ->orWhere('law_code', 'like', "%{$search}%");
            });
        }

        $laws = $query->paginate(min((int) $request->input('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $laws->items(),
            'meta' => [
                'current_page' => $laws->currentPage(),
                'last_page' => $laws->lastPage(),
                'per_page' => $laws->perPage(),
                'total' => $laws->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $law = EnvironmentalLawPh::with('penalties', 'violationTypes')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $law,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'law_code' => 'required|string|max:50|unique:environmental_laws_ph,law_code',
            'title' => 'required|string|max:255',
            'summary' => 'required|string',
            'issuing_agency' => 'required|string|max:255',
            'jurisdiction_scope' => 'nullable|string|max:100',
            'source_url' => 'nullable|url|max:500',
            'is_active' => 'boolean',
        ]);

        $law = EnvironmentalLawPh::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Environmental law created.',
            'data' => $law->load('penalties', 'violationTypes'),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $law = EnvironmentalLawPh::findOrFail($id);

        $validated = $request->validate([
            'law_code' => 'sometimes|string|max:50|unique:environmental_laws_ph,law_code,'.$id,
            'title' => 'sometimes|string|max:255',
            'summary' => 'sometimes|string',
            'issuing_agency' => 'sometimes|string|max:255',
            'jurisdiction_scope' => 'nullable|string|max:100',
            'source_url' => 'nullable|url|max:500',
            'is_active' => 'boolean',
        ]);

        $law->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Environmental law updated.',
            'data' => $law->fresh()->load('penalties', 'violationTypes'),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $law = EnvironmentalLawPh::findOrFail($id);
        $law->delete();

        return response()->json([
            'success' => true,
            'message' => 'Environmental law deleted.',
        ]);
    }
}
