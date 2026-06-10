<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicApiController extends Controller
{
    /**
     * Retrieve a paginated list of verified reports for the public API.
     */
    public function reports(Request $request): JsonResponse
    {
        $query = Report::where('status', 'verified')->orderBy('created_at', 'desc');

        $reports = $query->paginate(min((int) $request->input('per_page', 20), 100));

        return response()->json([
            'success' => true,
            'data' => $reports->items(),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }
}
