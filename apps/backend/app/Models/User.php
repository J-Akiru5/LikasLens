<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Scopes\TenantScope;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, SoftDeletes, HasUuids, Notifiable;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (self $user) {
            if (empty($user->tenant_id) && $tenant = Tenant::current()) {
                $user->tenant_id = $tenant->id;
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'supabase_auth_user_id',
        'name',
        'email',
        'country_code',
        'role',
        'trust_score',
        'reward_points_balance',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function wallet()
    {
        return $this->hasOne(CitizenWallet::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'user_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'reporter_user_id');
    }

    public function rewardLedger(): HasMany
    {
        return $this->hasMany(RewardPointLedger::class);
    }

    public function achievements()
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot('progress_value', 'unlocked_at')
            ->withTimestamps();
    }

    public function userAchievements()
    {
        return $this->hasMany(UserAchievement::class);
    }

    public function currencySetting()
    {
        return $this->belongsTo(CurrencySetting::class, 'country_code', 'country_code');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }
}
