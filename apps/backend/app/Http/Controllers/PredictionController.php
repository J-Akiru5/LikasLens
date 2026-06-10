<?php

namespace App\Http\Controllers;

use App\Services\PredictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    public function __construct(
        private PredictionService $predictionService
    ) {}

    /**
     * Return predicted environmental hotspots based on historical report data.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days_back' => 'nullable|integer|min:7|max:365',
            'top_n' => 'nullable|integer|min:1|max:50',
            'violation_type' => 'nullable|string|max:100',
        ]);

        $daysBack = $validated['days_back'] ?? 90;
        $topN = $validated['top_n'] ?? 10;
        $violationType = $validated['violation_type'] ?? null;

        $result = $this->predictionService->predictHotspots($daysBack, $topN, $violationType);

        return response()->json([
            'success' => true,
            'data' => $result['predictions'],
            'meta' => $result['meta'],
        ]);
    }
}
