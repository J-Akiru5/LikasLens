<?php

namespace App\Listeners;

use App\Events\UserCreated;
use App\Models\CitizenWallet;
use Illuminate\Support\Facades\DB;

class GrantWelcomeCredits
{
    private const WELCOME_AMOUNT = 50;

    public function handle(UserCreated $event): void
    {
        DB::transaction(function () use ($event) {
            CitizenWallet::create([
                'user_id' => $event->user->id,
                'available_credits' => self::WELCOME_AMOUNT,
                'lifetime_earned' => self::WELCOME_AMOUNT,
            ]);
        });
    }
}
