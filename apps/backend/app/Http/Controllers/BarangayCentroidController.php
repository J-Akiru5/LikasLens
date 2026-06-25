<?php

namespace App\Http\Controllers;

use App\Models\BarangayCentroid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BarangayCentroidController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BarangayCentroid::query();

        if ($request->filled('region')) {
            $query->where('region', $request->input('region'));
        }
        if ($request->filled('province')) {
            $query->where('province', $request->input('province'));
        }
        if ($request->filled('city')) {
            $query->where('city_municipality', $request->input('city'));
        }

        $centroids = $query->paginate(min((int) $request->input('per_page', 50), 100));

        return response()->json([
            'success' => true,
            'data' => $centroids->items(),
            'meta' => [
                'current_page' => $centroids->currentPage(),
                'last_page' => $centroids->lastPage(),
                'per_page' => $centroids->perPage(),
                'total' => $centroids->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $centroid = BarangayCentroid::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $centroid,
        ]);
    }

    public function regions(): JsonResponse
    {
        $regions = BarangayCentroid::select('region')
            ->distinct()
            ->orderBy('region')
            ->pluck('region');

        return response()->json([
            'success' => true,
            'data' => $regions,
        ]);
    }

    public function provinces(Request $request): JsonResponse
    {
        $query = BarangayCentroid::select('province')
            ->distinct()
            ->orderBy('province');

        if ($request->filled('region')) {
            $query->where('region', $request->input('region'));
        }

        $provinces = $query->pluck('province');

        return response()->json([
            'success' => true,
            'data' => $provinces,
        ]);
    }

    public function cities(Request $request): JsonResponse
    {
        $query = BarangayCentroid::select('city_municipality')
            ->distinct()
            ->orderBy('city_municipality');

        if ($request->filled('region')) {
            $query->where('region', $request->input('region'));
        }
        if ($request->filled('province')) {
            $query->where('province', $request->input('province'));
        }

        $cities = $query->pluck('city_municipality');

        return response()->json([
            'success' => true,
            'data' => $cities,
        ]);
    }

    // Admin CRUD
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city_municipality' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'psgc_code' => 'nullable|string|max:20',
        ]);

        $centroid = BarangayCentroid::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Barangay centroid created.',
            'data' => $centroid,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $centroid = BarangayCentroid::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'city_municipality' => 'sometimes|string|max:255',
            'province' => 'sometimes|string|max:255',
            'region' => 'sometimes|string|max:255',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
            'psgc_code' => 'nullable|string|max:20',
        ]);

        $centroid->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Barangay centroid updated.',
            'data' => $centroid,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $centroid = BarangayCentroid::findOrFail($id);
        $centroid->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barangay centroid deleted.',
        ]);
    }
}
