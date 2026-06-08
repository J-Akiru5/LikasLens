<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CitizenWallet extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'citizen_wallets';

    protected $fillable = [
        'user_id',
        'available_credits',
        'lifetime_earned',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
