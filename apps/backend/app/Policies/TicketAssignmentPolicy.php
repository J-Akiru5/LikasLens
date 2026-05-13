<?php

namespace App\Policies;

use App\Models\TicketAssignment;
use App\Models\User;

class TicketAssignmentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['analyst', 'super_admin']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['analyst', 'super_admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TicketAssignment $ticketAssignment): bool
    {
        return in_array($user->role, ['analyst', 'super_admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TicketAssignment $ticketAssignment): bool
    {
        return $user->role === 'super_admin';
    }
}
