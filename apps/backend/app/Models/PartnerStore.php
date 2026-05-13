<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerStore extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'category',
        'contact_name',
        'contact_email',
        'contact_phone',
        'address',
        'city',
        'province',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function rewards(): HasMany
    {
        return $this->hasMany(RewardsCatalog::class, 'partner_store_id');
    }
}
