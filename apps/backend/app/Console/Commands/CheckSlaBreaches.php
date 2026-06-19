<?php

namespace App\Console\Commands;

use App\Services\SlaService;
use Illuminate\Console\Command;

class CheckSlaBreaches extends Command
{
    protected $signature = 'sla:check-breaches';

    protected $description = 'Check for SLA breaches on tickets and escalate if necessary';

    public function handle(SlaService $slaService): int
    {
        $this->info('Starting SLA breach check...');

        $results = $slaService->runEscalationCheck();

        $this->info('SLA Breach Check Results:');
        $this->info("  Response breaches found: {$results['response_breached']}");
        $this->info("  Resolution breaches found: {$results['resolution_breached']}");
        $this->info("  Tickets escalated: {$results['escalated']}");

        if ($results['response_breached'] > 0 || $results['resolution_breached'] > 0) {
            $this->warn('SLA breaches detected. Check the logs for details.');
        } else {
            $this->info('No SLA breaches found.');
        }

        return self::SUCCESS;
    }
}
