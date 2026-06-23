<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LocationFuzzService
{
    private const EARTH_RADIUS_KM = 6371.0;

    /**
     * Snap coordinates to the nearest barangay centroid.
     * Returns [latitude, longitude] of the nearest centroid, or the original
     * coordinates if no centroid is found within $maxRadiusKm.
     */
    public function toCentroid(float $lat, float $lng, float $maxRadiusKm = 10.0): array
    {
        try {
            $nearest = DB::table('barangay_centroids')
                ->select('latitude', 'longitude')
                ->selectRaw(
                    '(? * ACOS(
                        COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                        COS(RADIANS(longitude) - RADIANS(?)) +
                        SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                    )) AS distance_km',
                    [self::EARTH_RADIUS_KM, $lat, $lng, $lat]
                )
                ->having('distance_km', '<=', $maxRadiusKm)
                ->orderBy('distance_km')
                ->first();

            if ($nearest) {
                Log::info('LocationFuzzService: Snapped to barangay centroid', [
                    'original' => ['lat' => $lat, 'lng' => $lng],
                    'centroid' => ['lat' => (float) $nearest->latitude, 'lng' => (float) $nearest->longitude],
                    'distance_km' => round($nearest->distance_km, 2),
                ]);

                return [(float) $nearest->latitude, (float) $nearest->longitude];
            }
        } catch (\Throwable $e) {
            // SQLite (testing) does not support ACOS/RADIANS — fall through
            Log::warning('LocationFuzzService: Centroid query failed, returning original', [
                'error' => $e->getMessage(),
            ]);
        }

        Log::warning('LocationFuzzService: No centroid found within radius, returning original coordinates', [
            'lat' => $lat,
            'lng' => $lng,
            'max_radius_km' => $maxRadiusKm,
        ]);

        return [$lat, $lng];
    }

    /**
     * Check whether the given coordinates match a known barangay centroid
     * (used to detect if fuzzing has already been applied).
     */
    public function isCentroid(float $lat, float $lng, float $toleranceKm = 0.1): bool
    {
        $count = DB::table('barangay_centroids')
            ->selectRaw(
                '(? * ACOS(
                    COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                    COS(RADIANS(longitude) - RADIANS(?)) +
                    SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                )) AS distance_km',
                [self::EARTH_RADIUS_KM, $lat, $lng, $lat]
            )
            ->having('distance_km', '<=', $toleranceKm)
            ->count();

        return $count > 0;
    }
}
