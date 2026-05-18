<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Achievement extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'criteria_type',
        'criteria_value',
        'icon',
        'tier',
        'points_awarded',
        'is_hidden',
        'sort_order',
    ];

    protected $casts = [
        'criteria_value' => 'array',
        'is_hidden' => 'boolean',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_achievements')
            ->withPivot('progress_value', 'unlocked_at')
            ->withTimestamps();
    }

    public function userAchievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }
}
