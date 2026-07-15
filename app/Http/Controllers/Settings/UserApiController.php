<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use App\Notifications\InviteNewUserNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserApiController extends Controller
{
    public function index(Request $request): Response
    {
        $currentUser = $request->user();

        // Every user, including admins, must belong to an agency to access this portal
        abort_if(blank($currentUser->agency_name), 403, 'Unauthorized action.');

        $isAdmin = $currentUser->hasAnyRole(['developer', 'main-agent']);

        // Non-admins must have the specific view permission
        if (! $isAdmin) {
            abort_unless($currentUser->hasPermissionTo('view.user'), 403, 'Unauthorized action.');
        }

        $search = $request->string('search')->trim()->toString();
        $partnerFilter = $request->integer('partner_id') ?: null;

        // Force agency-level restriction for everyone
        $agencyScope = $currentUser->agency_name;

        // There is no partner/staff hierarchy column (e.g. parent_id) in the
        // users table — agency_name is the only grouping that exists. So
        // admins may optionally narrow within their agency by a specific
        // user id (partner_id) if filtering, but non-admins simply see
        // everyone in their own agency once they hold view.user.
        $teamOwnerId = $isAdmin ? $partnerFilter : null;

        $users = User::query()
            ->where('agency_name', $agencyScope) // Restricts query to the user's agency
            ->when($teamOwnerId !== null, function ($query) use ($teamOwnerId) {
                $query->where('id', $teamOwnerId);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('country', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'role' => $user->getRoleNames()->first(),
                'agency_name' => $user->agency_name,
                'avatar_url' => $user->avatar_url,
                'name' => $user->name,
                'country' => $user->country,
                'contact_number' => $user->contact_number,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'is_active' => (bool) ($user->is_active ?? true),
                'is_protected' => (bool) $user->is_protected,
                'is_manually_verified' => (bool) ($user->is_manually_verified ?? false),
                'can_verify_users' => (bool) ($user->can_verify_users ?? false),
            ]);

        // Fetch available roles from the system dynamically
        try {
            $availableRoles = DB::table('roles')->pluck('name')->toArray();
        } catch (\Throwable $e) {
            $availableRoles = ['developer', 'main-agent', 'main-agent-staff', 'b2b-partner', 'b2b-partner-staff'];
        }

        return Inertia::render('users/userindex', [
            'users' => $users,
            'search' => $search,
            'selectedPartnerId' => $teamOwnerId,
            'isAdmin' => $isAdmin,
            'isSuperAdmin' => $currentUser->hasRole('developer'),
            'currentUserRole' => $currentUser->getRoleNames()->first(),
            'availableRoles' => $availableRoles,
        ]);
    }


    public function store(Request $request): RedirectResponse
    {
        $currentUser = $request->user();

        abort_if(blank($currentUser->agency_name), 403, 'Unauthorized action.');

        $isAdmin = $currentUser->hasAnyRole(['developer', 'main-agent']);
        if (! $isAdmin) {
            abort_unless($currentUser->hasPermissionTo('create.user'), 403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'email'          => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'contact_number' => ['required', 'string', 'max:32', 'regex:/^\+[1-9]\d{6,14}$/'],
        ]);

        // (Optional but Recommended) Set parent_id based on your teamOwnerId logic
        $parentId = null;
        if ($currentUser->hasRole('b2b-partner')) {
            $parentId = $currentUser->id;
        } elseif ($currentUser->hasRole('b2b-partner-staff')) {
            $parentId = $currentUser->parent_id;
        }

        $user = User::create([
            'agency_name'          => $currentUser->agency_name,     // inherited from the creator
            'name'                 => $validated['name'],
            'email'                => $validated['email'],
            'contact_number'       => $validated['contact_number'],
            'country'              => $currentUser->country,         // no country field collected, so inherit
            'password'             => Hash::make(Str::random(40)),   // unusable placeholder until they set one
            'is_active'            => true,
            'is_manually_verified' => true, // staff invited directly by an admin, not the self-registration path
            'parent_id'            => $parentId, // links staff to the correct partner
        ]);

        // Dynamically assign role based on the creator's role
        if ($currentUser->hasAnyRole(['developer', 'main-agent', 'main-agent-staff'])) {
            $user->assignRole('main-agent-staff');
        } else {
            $user->assignRole('b2b-partner-staff');
        }

        $token = Password::createToken($user);
        $user->notify(new InviteNewUserNotification($token));

        return back()->with('success', "Invitation sent to {$user->name} ({$user->email}).");
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        // Enforce agency-level scoping
        if ($currentUser->agency_name !== $user->agency_name) {
            abort(403, 'Unauthorized action.');
        }

        // Must be an admin or have the permission to update users
        $isAdmin = $currentUser->hasAnyRole(['developer', 'main-agent']);
        if (! $isAdmin && ! $currentUser->hasPermissionTo('update.user')) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $newRole = $request->input('role');

        // Prevent modification of a protected user's role by non-developers
        if ($user->is_protected && ! $currentUser->hasRole('developer')) {
            return back()->with('error', 'Cannot modify roles of a protected account.');
        }

        // Prevent non-developers from assigning the developer role
        if ($newRole === 'developer' && ! $currentUser->hasRole('developer')) {
            return back()->with('error', 'Only developer accounts can assign the developer role.');
        }

        $user->syncRoles([$newRole]);

        return back();
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        abort_unless($this->canManage($currentUser, $user, 'update.user'), 403, 'Unauthorized action.');

        if ($currentUser->id === $user->id) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        try {
            $user->is_active = !($user->is_active ?? true);
            $user->save();
        } catch (\App\Exceptions\ProtectedUserException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back();
    }

   
    public function toggleVerifierAccess(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        $canManage = $currentUser->hasRole('developer')
            || ($currentUser->hasRole('main-agent') && $currentUser->hasPermissionTo('verify-access.user'));

        abort_unless($canManage, 403, 'You are not authorized to manage verifier access.');

        if (! $user->hasAnyRole(['main-agent', 'main-agent-staff'])) {
            return back()->with('error', 'Verifier access can only be granted to Main Agent or Main Agent Staff accounts.');
        }

        $user->can_verify_users = ! ($user->can_verify_users ?? false);
        $user->save();

        return back()->with('status', $user->can_verify_users
            ? $user->name.' can now verify new agents.'
            : $user->name.' can no longer verify new agents.');
    }

    /**
     * Manually verify a pending user directly from their profile page, as an
     * alternative to the emailed link. Same authorization rule as the
     * email-link flow: any Main Agent/Staff with can_verify_users, or any
     * developer — not scoped to matching agency.
     */
    public function verifyManually(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        $isEligibleVerifier = $currentUser->hasRole('developer')
            || (($currentUser->can_verify_users ?? false)
                && $currentUser->hasAnyRole(['main-agent', 'main-agent-staff']));

        abort_unless($isEligibleVerifier, 403, 'Unauthorized action.');

        if ($user->is_manually_verified) {
            return back()->with('status', $user->name.' is already verified.');
        }

        $user->markAsManuallyVerified($currentUser);

        return back()->with('status', $user->name.' has been verified and can now log in.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        abort_unless($this->canManage($currentUser, $user, 'delete.user'), 403, 'Unauthorized action.');

        if ($currentUser->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        try {
            $user->delete();
        } catch (\App\Exceptions\ProtectedUserException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back();
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

    private function canManage(User $currentUser, User $target, string $permission): bool
    {
        if ($currentUser->agency_name !== $target->agency_name) {
            return false;
        }

        if ($currentUser->hasAnyRole(['developer', 'main-agent'])) {
            return true;
        }

        if (! $currentUser->hasPermissionTo($permission)) {
            return false;
        }

        $ownTeam = $this->teamOwnerId($currentUser);

        return $ownTeam !== null && $ownTeam === $this->teamOwnerId($target);
    }
}