<?php

namespace App\Services;

use App\Models\ReportChain;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChainService
{
    /**
     * Default radius in meters for considering reports as co-located.
     */
    private const DEFAULT_RADIUS_METERS = 100;

    /**
     * Default look-back window in days for finding nearby chains.
     */
    private const DEFAULT_DAYS_BACK = 7;

    /**
     * Urgency boost added to each report when linked to an existing chain.
     */
    private const URGENCY_BOOST_PER_LINK = 5;

    /**
     * Main entry point: process a newly created ticket for chain linking.
     *
     * Looks for a nearby existing chain. If found, links the ticket to it.
     * If not found, creates a new chain anchored on this ticket.
     *
     * Returns the ReportChain the ticket was linked to (or a newly created one).
     */
    public function processNewReport(Ticket $ticket): ReportChain
    {
        $chain = $this->findNearbyChain(
            (float) $ticket->latitude,
            (float) $ticket->longitude,
            self::DEFAULT_RADIUS_METERS,
            self::DEFAULT_DAYS_BACK,
        );

        if ($chain) {
            $this->addToChain($ticket, $chain);
        } else {
            $chain = $this->createChain($ticket);
        }

        return $chain;
    }

    /**
     * Find an existing chain within the given radius of the supplied coordinates.
     *
     * Uses the Haversine formula to compute great-circle distance in metres.
     * Returns the closest qualifying chain, or null if none exists.
     */
    public function findNearbyChain(
        float $lat,
        float $lng,
        int $radiusMeters = self::DEFAULT_RADIUS_METERS,
        int $daysBack = self::DEFAULT_DAYS_BACK,
    ): ?ReportChain {
        // Haversine sub-query: distance in metres between two lat/lng points.
        // Earth mean radius ~ 6371 km.
        $earthRadiusMeters = 6371000;

        $chain = ReportChain::where('status', 'active')
            ->where('last_reported_at', '>=', now()->subDays($daysBack))
            ->select('*')
            ->selectRaw(
                '(? * acos(
                    cos(radians(?)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(latitude))
                )) AS distance_meters',
                [$earthRadiusMeters, $lat, $lng, $lat],
            )
            ->having('distance_meters', '<=', $radiusMeters)
            ->orderBy('distance_meters')
            ->first();

        if ($chain) {
            Log::info('ChainService: Found nearby chain', [
                'chain_id' => $chain->id,
                'distance_meters' => round($chain->distance_meters, 2),
                'total_reports' => $chain->total_reports,
            ]);
        }

        return $chain;
    }

    /**
     * Link a ticket to an existing chain.
     *
     * Updates the ticket's chain_id, increments the chain's report count,
     * refreshes the last_reported_at timestamp, and bumps the urgency boost.
     */
    public function addToChain(Ticket $ticket, ReportChain $chain): void
    {
        $ticket->update(['chain_id' => $chain->id]);

        $chain->update([
            'total_reports' => $chain->total_reports + 1,
            'urgency_boost' => $chain->urgency_boost + self::URGENCY_BOOST_PER_LINK,
            'last_reported_at' => now(),
        ]);

        Log::info('ChainService: Ticket linked to existing chain', [
            'ticket_id' => $ticket->id,
            'chain_id' => $chain->id,
            'new_total_reports' => $chain->fresh()->total_reports,
            'new_urgency_boost' => $chain->fresh()->urgency_boost,
        ]);
    }

    /**
     * Create a new chain anchored on the given ticket.
     */
    public function createChain(Ticket $ticket): ReportChain
    {
        $chain = ReportChain::create([
            'id' => Str::uuid(),
            'primary_ticket_id' => $ticket->id,
            'latitude' => $ticket->latitude,
            'longitude' => $ticket->longitude,
            'radius_meters' => self::DEFAULT_RADIUS_METERS,
            'total_reports' => 1,
            'urgency_boost' => 0,
            'first_reported_at' => now(),
            'last_reported_at' => now(),
            'status' => 'active',
        ]);

        $ticket->update(['chain_id' => $chain->id]);

        Log::info('ChainService: New chain created', [
            'chain_id' => $chain->id,
            'primary_ticket_id' => $ticket->id,
            'latitude' => $ticket->latitude,
            'longitude' => $ticket->longitude,
        ]);

        return $chain;
    }

    /**
     * Get a chain by ID with its linked tickets.
     */
    public function getChainDetails(string $chainId): ?ReportChain
    {
        return ReportChain::with(['tickets', 'primaryTicket'])
            ->where('id', $chainId)
            ->first();
    }
}
