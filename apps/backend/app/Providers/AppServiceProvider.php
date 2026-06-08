<?php

namespace App\Providers;

use App\Models\TicketAssignment;
use App\Policies\TicketAssignmentPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(TicketAssignment::class, TicketAssignmentPolicy::class);

        RateLimiter::for('reports', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->ip()
            );
        });
    }
}
