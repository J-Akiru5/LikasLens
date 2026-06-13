<?php

namespace App\Http\Controllers;

use App\Models\BiasRiskRegister;
use Illuminate\Http\JsonResponse;

class BiasRiskRegisterController extends Controller
{
    /**
     * Public-to-admin view of the bias / risk register.
     * GET /api/admin/bias-register
     */
    public function index(): JsonResponse
    {
        $rows = BiasRiskRegister::orderBy('category')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }
}
