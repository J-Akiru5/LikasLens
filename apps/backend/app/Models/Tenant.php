<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'branding',
        'config',
        'country_code',
        'timezone',
        'is_active',
    ];

    protected $casts = [
        'branding' => 'array',
        'config' => 'array',
        'is_active' => 'boolean',
    ];

    // ── Static tenant resolver (request-scoped) ───────────────────────────

    protected static ?Tenant $currentTenant = null;

    public static function current(): ?Tenant
    {
        return static::$currentTenant;
    }

    public static function setCurrent(?Tenant $tenant): void
    {
        static::$currentTenant = $tenant;
    }

    // ── Relationships ─────────────────────────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function ngoGroups(): HasMany
    {
        return $this->hasMany(NgoGroup::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Get a branding value by key (e.g., 'primary_color', 'logo_url').
     */
    public function getBranding(string $key, mixed $default = null): mixed
    {
        return $this->branding[$key] ?? $default;
    }

    /**
     * Get a config value by key (e.g., 'features', 'limits').
     */
    public function getConfig(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }

    /**
     * Resolve a tenant by subdomain slug or custom domain.
     */
    public static function resolveBySlug(string $slug): ?Tenant
    {
        return static::where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Resolve a tenant by custom domain (e.g., "cebu.likaslens.org").
     */
    public static function resolveByDomain(string $domain): ?Tenant
    {
        return static::where('domain', $domain)
            ->where('is_active', true)
            ->first();
    }
}
