<?php

namespace App\Http\Controllers;

use App\Models\CurrencySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CurrencySettingController extends Controller
{
    public function showRate(Request $request): JsonResponse
    {
        $countryCode = $request->query('country_code', 'PH');

        $setting = CurrencySetting::where('country_code', strtoupper($countryCode))
            ->where('is_active', true)
            ->first();

        if (! $setting) {
            return response()->json([
                'success' => false,
                'message' => 'No currency setting found for this country.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'country_code' => $setting->country_code,
                'country_name' => $setting->country_name,
                'currency_code' => $setting->currency_code,
                'currency_name' => $setting->currency_name,
                'eco_credit_rate' => (float) $setting->eco_credit_rate,
            ],
        ]);
    }

    public function listAll(): JsonResponse
    {
        $settings = CurrencySetting::orderBy('country_name')->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'country_code' => $s->country_code,
                'country_name' => $s->country_name,
                'currency_code' => $s->currency_code,
                'currency_name' => $s->currency_name,
                'eco_credit_rate' => (float) $s->eco_credit_rate,
                'is_active' => $s->is_active,
            ]);

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function index(): JsonResponse
    {
        return $this->listAll();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country_code' => 'required|string|size:2|unique:currency_settings,country_code',
            'country_name' => 'required|string|max:255',
            'currency_code' => 'required|string|max:5',
            'currency_name' => 'required|string|max:255',
            'eco_credit_rate' => 'required|numeric|min:0.0001',
            'is_active' => 'boolean',
        ]);

        $setting = CurrencySetting::create($validated);

        return response()->json([
            'success' => true,
            'data' => $setting,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $setting = CurrencySetting::findOrFail($id);

        $validated = $request->validate([
            'country_code' => ['sometimes', 'string', 'size:2', Rule::unique('currency_settings', 'country_code')->ignore($setting->id)],
            'country_name' => 'sometimes|string|max:255',
            'currency_code' => 'sometimes|string|max:5',
            'currency_name' => 'sometimes|string|max:255',
            'eco_credit_rate' => 'sometimes|numeric|min:0.0001',
            'is_active' => 'boolean',
        ]);

        $setting->update($validated);

        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $setting = CurrencySetting::findOrFail($id);
        $setting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Currency setting deleted.',
        ]);
    }
}
