<?php

namespace App\Http\Controllers;

use App\Models\CountryCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CountryCodeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CountryCode::query();

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('country_name', 'like', "%{$s}%")
                    ->orWhere('alpha2_code', 'like', "%{$s}%");
            });
        }

        $codes = $query->orderBy('country_name')->paginate(min((int) $request->input('per_page', 50), 100));

        return response()->json([
            'success' => true,
            'data' => $codes->items(),
            'meta' => [
                'current_page' => $codes->currentPage(),
                'last_page' => $codes->lastPage(),
                'per_page' => $codes->perPage(),
                'total' => $codes->total(),
            ],
        ]);
    }

    public function show(string $code): JsonResponse
    {
        $country = CountryCode::where('alpha2_code', $code)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $country,
        ]);
    }

    // Admin CRUD
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'alpha2_code' => 'required|string|size:2|unique:country_codes,alpha2_code',
            'numeric_code' => 'required|string|size:3|unique:country_codes,numeric_code',
            'country_name' => 'required|string|max:255',
            'currency_code' => 'nullable|string|max:3',
            'currency_name' => 'nullable|string|max:255',
            'eco_credit_rate' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $country = CountryCode::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Country code created.',
            'data' => $country,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $country = CountryCode::findOrFail($id);

        $validated = $request->validate([
            'alpha2_code' => 'sometimes|string|size:2|unique:country_codes,alpha2_code,' . $id,
            'numeric_code' => 'sometimes|string|size:3|unique:country_codes,numeric_code,' . $id,
            'country_name' => 'sometimes|string|max:255',
            'currency_code' => 'nullable|string|max:3',
            'currency_name' => 'nullable|string|max:255',
            'eco_credit_rate' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $country->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Country code updated.',
            'data' => $country,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $country = CountryCode::findOrFail($id);
        $country->delete();

        return response()->json([
            'success' => true,
            'message' => 'Country code deleted.',
        ]);
    }
}
