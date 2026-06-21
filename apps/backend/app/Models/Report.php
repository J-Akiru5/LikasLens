<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasUuids;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (self $report) {
            if (empty($report->tenant_id) && $tenant = Tenant::current()) {
                $report->tenant_id = $tenant->id;
            }
        });
    }

    protected $fillable = [
        'tenant_id',
        'user_id',
        'latitude',
        'longitude',
        'image_path',
        'image_size',
        'storage_disk',
        'status',
        'evidence_hash',
        'blockchain_tx',
        'blockchain_verified_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'blockchain_verified_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
