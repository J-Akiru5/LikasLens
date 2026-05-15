<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RewardsCatalog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rewards_catalog';

    protected $fillable = [
        'partner_store_id',
        'reward_name',
        'reward_type',
        'points_cost',
        'stock_quantity',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function partnerStore(): BelongsTo
    {
        return $this->belongsTo(PartnerStore::class, 'partner_store_id');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class, 'reward_id');
    }

    public function decrementStock(int $amount = 1): bool
    {
        if ($this->stock_quantity >= $amount) {
            $this->decrement('stock_quantity', $amount);

            return true;
        }

        return false;
    }
}
