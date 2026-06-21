<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// SLA breach check: run every hour
Schedule::command('sla:check-breaches')->hourly();

// Data retention enforcement: run daily
Schedule::command('likaslens:enforce-retention')->daily();
