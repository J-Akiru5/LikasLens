<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class LeaderboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                [
                    'id' => 'demo-1',
                    'name' => 'Charlyn Aguirre',
                    'eco_credits' => 120,
                    'score' => 120,
                ],
                [
                    'id' => 'demo-2',
                    'name' => 'Katherine Rivera',
                    'eco_credits' => 95,
                    'score' => 95,
                ],
                [
                    'id' => 'demo-3',
                    'name' => 'Roseby Santos',
                    'eco_credits' => 70,
                    'score' => 70,
                ],
            ],
        ]);
    }
}
