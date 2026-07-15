<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Standard users must belong to an agency; developers can bypass this restriction
        if (! $user->hasRole('developer')) {
            abort_if(blank($user->agency_name), 403, 'Unauthorized action.');
        }

        return Inertia::render('users/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'user' => $this->serialize($user),
            'canEdit' => true,
            'isSelf' => true,
            // Viewing your own profile: verifying yourself doesn't make sense.
            'canVerify' => false,
            'isSuperAdmin' => $this->canManageVerifierAccess($user),
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        if (! $user->exists) {
            abort(404, 'User not found.');
        }

        $currentUser = $request->user();

        if (! $currentUser->hasRole('developer')) {
            abort_if(blank($currentUser->agency_name), 403, 'Unauthorized action.');
        }

        $isSelf = $currentUser->id === $user->id;

        $canEdit = $isSelf || $this->canManage($currentUser, $user, 'users.update');

        abort_unless($canEdit || $this->canManage($currentUser, $user, 'users.view'), 403, 'Unauthorized action.');

        return Inertia::render('users/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $isSelf ? $request->session()->get('status') : null,
            'user' => $this->serialize($user),
            'canEdit' => $canEdit,
            'isSelf' => $isSelf,
            'canVerify' => ! $isSelf && $this->canVerify($currentUser, $user),
            'isSuperAdmin' => $this->canManageVerifierAccess($currentUser),
        ]);
    }

    public function updateField(Request $request, User $user): RedirectResponse
    {
        if (! $user->exists) {
            abort(404, 'User not found.');
        }

        $currentUser = $request->user();

        if (! $currentUser->hasRole('developer')) {
            abort_if(blank($currentUser->agency_name), 403, 'Unauthorized action.');
        }

        $isSelf = $currentUser->id === $user->id;

        abort_unless($isSelf || $this->canManage($currentUser, $user, 'users.update'), 403, 'Unauthorized action.');

        // Protect accounts from being modified by non-developers
        if (! $isSelf && $user->is_protected && ! $currentUser->hasRole('developer')) {
            return back()->withErrors(['error' => 'Cannot modify a protected account.']);
        }

        $validated = $request->validate([
            'field' => 'required|in:name,email,contact_number',
            'value' => 'required|string|max:255',
            'password' => 'required|string',
        ]);

        if (! Hash::check($validated['password'], $currentUser->password)) {
            return back()->withErrors(['password' => 'The password you entered is incorrect.']);
        }

        $user->{$validated['field']} = $validated['value'];

        if ($validated['field'] === 'email' && $user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return back();
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole('developer')) {
            abort_if(blank($user->agency_name), 403, 'Unauthorized action.');
        }

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasRole('developer')) {
            abort_if(blank($user->agency_name), 403, 'Unauthorized action.');
        }

        if ($user->is_protected) {
            return back()->withErrors(['error' => 'Protected accounts cannot be deleted.']);
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function teamOwnerId(User $user): ?int
    {
        if ($user->hasRole('b2b-partner')) {
            return $user->id;
        }

        if ($user->hasRole('b2b-partner-staff')) {
            return $user->parent_id;
        }

        return null;
    }

    /**
     * Determines authorization while enforcing agency validation and role exceptions.
     */
    private function canManage(User $currentUser, User $target, string $permission): bool
    {
        // Developers can view and edit all users across the system
        if ($currentUser->hasRole('developer')) {
            return true;
        }

        // Other users must belong to the exact same agency
        if ($currentUser->agency_name !== $target->agency_name) {
            return false;
        }

        // Main agents can view and edit any user belonging to their own agency
        if ($currentUser->hasRole('main-agent')) {
            return true;
        }

        if (! $currentUser->hasPermissionTo($permission)) {
            return false;
        }

        $ownTeam = $this->teamOwnerId($currentUser);

        return $ownTeam !== null && $ownTeam === $this->teamOwnerId($target);
    }

    /**
     * Any developer, or any Main Agent / Main Agent Staff who holds
     * can_verify_users, may manually verify a pending user — system-wide,
     * not scoped to matching agency. Mirrors the authorization rule in
     * UserApiController::verifyManually and
     * UserVerificationController::canVerify — keep these three in sync.
     */
    private function canVerify(User $currentUser, User $target): bool
    {
        if ($currentUser->hasRole('developer')) {
            return true;
        }

        return ($currentUser->can_verify_users ?? false)
            && $currentUser->hasAnyRole(['main-agent', 'main-agent-staff']);
    }

    /**
     * Any developer, or any Main Agent holding the users.verify-access
     * permission, may see and use the "can verify users" toggle on a
     * profile (i.e. grant/revoke can_verify_users for eligible Main
     * Agent / Main Agent Staff accounts).
     */
    private function canManageVerifierAccess(User $currentUser): bool
    {
        if ($currentUser->hasRole('developer')) {
            return true;
        }

        return $currentUser->hasRole('main-agent')
            && $currentUser->hasPermissionTo('users.verify-access');
    }

    /**
     * Serializes user properties required by the frontend view.
     */
    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'role' => $user->getRoleNames()->first(),
            'agency_name' => $user->agency_name,
            'name' => $user->name,
            'country' => $user->country,
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url, 
            'email_verified_at' => $user->email_verified_at,
            'is_active' => (bool) ($user->is_active ?? true),
            'is_protected' => (bool) $user->is_protected,
            'is_manually_verified' => (bool) ($user->is_manually_verified ?? false),
            'can_verify_users' => (bool) ($user->can_verify_users ?? false),
        ];
    }
}