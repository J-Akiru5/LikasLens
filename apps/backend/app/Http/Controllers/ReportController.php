<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Store a newly created report in storage.
     */
    public function store(Request $request)
    {
        // Validate the incoming request
        $validated = $request->validate([
            'base64Image' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        // TODO: Process the report
        // - Store image to Supabase Storage
        // - Save report metadata to database
        // - Trigger AI analysis pipeline

        return response()->json([
            'success' => true,
            'message' => 'Report received and queued for processing',
            'data' => [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'imageSize' => strlen($validated['base64Image']),
            ],
        ], 201);
    }
}
