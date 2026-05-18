<?php

namespace App\Http\Controllers;

use App\Models\NgoGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNgoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NgoGroup::orderBy('name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($region = $request->input('region')) {
            $query->where('region', $region);
        }

        $ngos = $query->paginate(min((int) $request->input('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $ngos->items(),
            'meta' => [
                'current_page' => $ngos->currentPage(),
                'last_page' => $ngos->lastPage(),
                'per_page' => $ngos->perPage(),
                'total' => $ngos->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $ngo = NgoGroup::with('assignments')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $ngo,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'region' => 'required|string|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $ngo = NgoGroup::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'NGO created.',
            'data' => $ngo,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'region' => 'sometimes|string|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $ngo->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'NGO updated.',
            'data' => $ngo->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);
        $ngo->delete();

        return response()->json([
            'success' => true,
            'message' => 'NGO deleted.',
        ]);
    }
}
