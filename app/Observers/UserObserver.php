<?php

namespace App\Observers;

use App\Exceptions\ProtectedUserException;
use App\Models\User;

/**
 * This observer is the last line of defense: even if a controller,
 * console command, artisan tinker session, or future dev forgets to
 * check isProtected(), these hooks fire on ANY save/delete and block it.
 *
 * Register in AppServiceProvider::boot(): User::observe(UserObserver::class);
 */
class UserObserver
{
    /**
     * Block hard deletes of protected users entirely.
     */
    public function deleting(User $user): bool
    {
        if ($user->isProtected()) {
            throw new ProtectedUserException(
                'The developer account cannot be deleted.'
            );
        }

        return true;
    }

    /**
     * Block deactivation, role stripping, or un-protecting via update.
     */
    public function updating(User $user): bool
    {
        if (! $user->isProtected()) {
            return true;
        }

        // Protected user is being deactivated
        if ($user->isDirty('is_active') && $user->is_active === false) {
            throw new ProtectedUserException(
                'The developer account cannot be deactivated.'
            );
        }

        // Someone trying to strip the protection flag itself
        if ($user->isDirty('is_protected') && $user->is_protected === false) {
            throw new ProtectedUserException(
                'The is_protected flag cannot be removed from this account.'
            );
        }

        return true;
    }
}
