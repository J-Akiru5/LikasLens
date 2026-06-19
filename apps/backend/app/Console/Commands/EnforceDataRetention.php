<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\GeminiConversation;
use App\Models\RewardPointLedger;
use App\Models\Ticket;
use Illuminate\Console\Command;

class EnforceDataRetention extends Command
{
    protected $signature = 'likaslens:enforce-retention';

    protected $description = 'Purge expired data per the LikasLens privacy policy retention schedule';

    public function handle(): int
    {
        $this->line('Starting data retention enforcement...');

        // 1. Purge expired reward points (12-month expiry)
        $expiredPoints = RewardPointLedger::where('expires_at', '<', now())->delete();
        $this->line("Deleted {$expiredPoints} expired reward point ledger entries.");

        // 2. Purge audit logs older than 12 months
        $oldAuditLogs = AuditLog::where('created_at', '<', now()->subMonths(12))->delete();
        $this->line("Deleted {$oldAuditLogs} audit log entries older than 12 months.");

        // 3. Purge soft-deleted Gemini conversations older than 30 days
        $oldConversations = GeminiConversation::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays(30))
            ->delete();
        $this->line("Deleted {$oldConversations} soft-deleted Gemini conversations.");

        // 4. Purge resolved tickets older than 90 days (archive, don't delete)
        $staleResolved = Ticket::where('status', 'resolved')
            ->where('resolved_at', '<', now()->subDays(90))
            ->count();
        $this->line("Found {$staleResolved} resolved tickets older than 90 days (no action — manual review recommended).");

        $this->info('Data retention enforcement complete.');

        return self::SUCCESS;
    }
}
