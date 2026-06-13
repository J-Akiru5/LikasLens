<?php

namespace App\Scopes;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * Automatically filters by tenant_id when a tenant is set in the
     * current request context. Queries without a current tenant are
     * unfiltered (e.g., CLI commands, super-admin cross-tenant queries).
     */
    public function apply(Builder $builder, Model $model): void
    {
        if ($tenant = Tenant::current()) {
            $builder->where($model->getTable().'.tenant_id', $tenant->id);
        }
    }
}
