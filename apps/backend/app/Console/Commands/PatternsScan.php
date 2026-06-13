<?php

namespace App\Console\Commands;

use App\Http\Controllers\PatternEscalationController;
use App\Models\AuditLog;
use App\Models\Ticket;
use App\Models\TicketTimeline;
use Illuminate\Console\Command;

/**
 * Scan recent tickets and promote clusters to systemic incidents.
 *
 *   php artisan patterns:scan
 *   php artisan patterns:scan --hours=24 --threshold=3 --radius-m=1500 --apply
 *
 * Without --apply the command runs in dry-run mode and prints clusters only.
 */
class PatternsScan extends Command
{
    protected $signature = 'patterns:scan
        {--hours=72 : Sliding window in hours}
        {--threshold=5 : Minimum tickets to flag a cluster}
        {--radius-m=2000 : Cluster radius in metres}
        {--apply : Persist the systemic_incident flag (default: dry-run)}';

    protected $description = 'Detect cross-barangay report clusters (LUWAS-inspired)';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $threshold = (int) $this->option('threshold');
        $radiusM = (int) $this->option('radius-m');
        $apply = (bool) $this->option('apply');

        $cutoff = now()->subHours($hours);
        $this->info("Scanning tickets created after {$cutoff->toIso8601String()} (window={$hours}h, threshold={$threshold}, radius={$radiusM}m)");

        $tickets = Ticket::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('created_at', '>=', $cutoff)
            ->orderBy('created_at', 'asc')
            ->get();

        $this->line("  Candidate tickets: {$tickets->count()}");

        $controller = app(PatternEscalationController::class);
        $reflect = new \ReflectionMethod($controller, 'clusterTickets');
        $reflect->setAccessible(true);
        $clusters = $reflect->invoke($controller, $tickets, $radiusM, $threshold);

        $this->line("  Clusters detected: " . count($clusters));
        foreach ($clusters as $i => $cluster) {
            $this->line("    [{$i}] centroid=({$cluster['centroid']['lat']},{$cluster['centroid']['lng']}) size={$cluster['count']}");
        }

        if ($apply) {
            foreach ($clusters as $cluster) {
                Ticket::whereIn('id', $cluster['ticket_ids'])->update([
                    'ai_triage_summary' => \DB::raw("CONCAT(COALESCE(ai_triage_summary,''), ' [SYSTEMIC CLUSTER]')"),
                ]);
                AuditLog::create([
                    'actor_user_id' => null,
                    'action' => 'pattern_escalation_cli',
                    'entity_type' => 'ticket_cluster',
                    'entity_id' => substr(md5(implode(',', $cluster['ticket_ids'])), 0, 12),
                    'new_values' => [
                        'cluster_size' => $cluster['count'],
                        'centroid' => $cluster['centroid'],
                        'ticket_ids' => $cluster['ticket_ids'],
                    ],
                ]);
            }
            $this->info('Applied systemic_incident flags.');
        } else {
            $this->warn('Dry-run. Pass --apply to persist.');
        }

        return self::SUCCESS;
    }
}
