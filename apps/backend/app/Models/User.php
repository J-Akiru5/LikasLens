<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable, SoftDeletes;

    protected $fillable = [
        'supabase_auth_user_id',
        'name',
        'email',
        'role',
        'trust_score',
        'reward_points_balance',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'reporter_user_id');
    }

    public function ticketEvidence(): HasMany
    {
        return $this->hasMany(TicketEvidence::class, 'uploaded_by_user_id');
    }

    public function assignedTickets(): HasMany
    {
        return $this->hasMany(TicketAssignment::class, 'assigned_by_user_id');
    }

    public function rewardRedemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }

    public function pointLedger(): HasMany
    {
        return $this->hasMany(RewardPointLedger::class);
    }

    public function geminiConversations(): HasMany
    {
        return $this->hasMany(GeminiConversation::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }
}
