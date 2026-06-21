<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    public function tokenable()
    {
        return $this->morphTo()->withoutGlobalScope(TenantScope::class);
    }
}
