<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserVerificationController extends Controller
{
    /**
     * Landing page reached via the signed email link. If the visitor isn't
     * authenticated yet, the 'auth' middleware on this route will redirect
     * them to login first and bounce them back here afterwards (standard
     * Laravel "intended URL" behavior) — so by the time this method runs,
     * $request->user() is always the person who just logged in.
     */
    public function show(Request $request, User $user): Response|RedirectResponse
    {
        $currentUser = $request->user();

        if (! $this->canVerify($currentUser, $user)) {
            abort(403, 'You are not authorized to verify this user.');
        }

        if ($user->is_manually_verified) {
            return redirect()->route('users.index')->with('status', $user->name.' is already verified.');
        }

        return Inertia::render('users/verify-agent', [
            'pendingUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'agency_name' => $user->agency_name,
                'country' => $user->country,
                'contact_number' => $user->contact_number,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function verify(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        if (! $this->canVerify($currentUser, $user)) {
            abort(403, 'You are not authorized to verify this user.');
        }

        $user->markAsManuallyVerified($currentUser);

        return redirect()->route('users.index')->with('status', $user->name.' has been verified and can now log in.');
    }

    /**
     * Any developer, or any Main Agent/Main Agent Staff who holds the
     * can_verify_users permission, may verify a pending user — system-wide,
     * not scoped to matching agency.
     */
    private function canVerify(User $currentUser, User $target): bool
    {
        if ($currentUser->hasRole('developer')) {
            return true;
        }

        return $currentUser->can_verify_users
            && $currentUser->hasAnyRole(['main-agent', 'main-agent-staff']);
    }
}