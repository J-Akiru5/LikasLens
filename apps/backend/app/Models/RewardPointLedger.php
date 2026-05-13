<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RewardPointLedger extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'reward_point_ledger';

    protected $fillable = [
        'user_id',
        'reference_type',
        'reference_id',
        'direction',
        'points',
        'balance_after',
        'expires_at',
        'notes',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted(): void
    {
        static::creating(function (RewardPointLedger $ledger) {
            if (empty($ledger->expires_at) && $ledger->direction === 'credit') {
                $ledger->expires_at = now()->addMonths(12);
            }
        });
    }
}
