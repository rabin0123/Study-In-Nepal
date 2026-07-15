<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('users.view');
    }

    public function update(User $actor, User $target): bool
    {
        return $actor->can('users.update');
    }

    public function delete(User $actor, User $target): bool
    {
        if ($target->isProtected()) {
            return false; // developer account: never deletable, regardless of caller's permissions
        }

        return $actor->can('users.delete');
    }

    public function deactivate(User $actor, User $target): bool
    {
        if ($target->isProtected()) {
            return false;
        }

        return $actor->can('users.deactivate');
    }

    public function assignRole(User $actor, User $target): bool
    {
        return $actor->can('roles.assign');
    }
}
