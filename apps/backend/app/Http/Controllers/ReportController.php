<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            'user_id' => 'nullable|string|max:255',
        ]);

        $base64Image = $validated['base64Image'];
        $extension = 'jpg';

        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $matches) === 1) {
            $extension = strtolower($matches[1]);
            $base64Image = substr($base64Image, strpos($base64Image, ',') + 1);
        }

        $binary = base64_decode($base64Image, true);
        if ($binary === false) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid base64 image payload.',
            ], 422);
        }

        $contentType = match ($extension) {
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };

        $filename = Str::uuid()->toString().'.'.$extension;
        $path = 'reports/'.now()->format('Y/m/d').'/'.$filename;

        Storage::disk('supabase')->put($path, $binary, [
            'visibility' => 'public',
            'ContentType' => $contentType,
        ]);

        $report = Report::create([
            'user_id' => $validated['user_id'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'image_path' => $path,
            'image_size' => strlen($binary),
            'storage_disk' => 'supabase',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report received and stored',
            'data' => [
                'reportId' => $report->id,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'imagePath' => $report->image_path,
            ],
        ], 201);
    }
}
