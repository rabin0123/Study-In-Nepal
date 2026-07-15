<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AgencyApiController extends Controller
{
    /**
     * Display the Agency Directory page.
     * 
     *
     */
    public function index(Request $request): Response
    {
        $currentUser = $request->user();

        // Restrict access using the view.agency permission
        abort_unless($currentUser->hasPermissionTo('view.agency'), 403, 'Unauthorized action.');

        $search = $request->string('search')->trim()->toString();

        $agencies = User::query()
            ->select(
                'agency_name',
                DB::raw('count(*) as total_users'),
                DB::raw('sum(case when is_active = true then 1 else 0 end) as active_users'),
                DB::raw('max(created_at) as latest_activity')
            )
            ->whereNotNull('agency_name')
            ->when($search !== '', function ($query) use ($search) {
                $query->where('agency_name', 'like', "%{$search}%");
            })
            ->groupBy('agency_name')
            ->orderBy('agency_name')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($agency) {
                $activeUsers = (int) $agency->active_users;
                
                return [
                    'agency_name' => $agency->agency_name,
                    'total_users' => (int) $agency->total_users,
                    'active_users' => $activeUsers,
                    'latest_activity' => $agency->latest_activity 
                        ? \Carbon\Carbon::parse($agency->latest_activity)->diffForHumans() 
                        : null,
                    'is_active' => $activeUsers > 0,
                ];
            });

        return Inertia::render('users/agency/agencyindex', [
            'agencies' => $agencies,
            'search' => $search,
        ]);
    }
    /**
     * Toggle the status of an entire agency (all registered users under it).
     */
    public function toggleStatus(Request $request, string $agency): RedirectResponse
    {
        $currentUser = $request->user();

        // Restrict access using the update.agency permission
        abort_unless($currentUser->hasPermissionTo('update.agency'), 403, 'Unauthorized action.');

        $users = User::where('agency_name', $agency)->get();

        if ($users->isEmpty()) {
            abort(404, 'Agency not found.');
        }

        $hasActiveUsers = $users->contains('is_active', true);
        $newStatus = !$hasActiveUsers;

        foreach ($users as $user) {
            $user->is_active = $newStatus;
            $user->save();
        }

        return back();
    }

    /**
     * Display the matching Partner User Directory.
     */
    public function users(Request $request): Response
    {
        $currentUser = $request->user();

        // Restrict access using the view.agency permission
        abort_unless($currentUser->hasPermissionTo('view.useragency'), 403, 'Unauthorized action.');

        $search = $request->string('search')->trim()->toString();
        $agencyFilter = $request->string('agency')->trim()->toString();
        $statusFilter = $request->string('status')->trim()->toString();

        $users = User::query()
            ->whereNotNull('agency_name')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($agencyFilter !== '', function ($query) use ($agencyFilter) {
                $query->where('agency_name', $agencyFilter);
            })
            ->when($statusFilter !== '', function ($query) use ($statusFilter) {
                if ($statusFilter === 'active') {
                    $query->where('is_active', true);
                } elseif ($statusFilter === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'contact_number' => $user->contact_number,
                'agency_name' => $user->agency_name,
                'avatar_url' => $user->avatar_url,
                'role' => $user->role ?? 'Agent', // Falls back if role column doesn't exist
                'is_active' => (bool) $user->is_active,
                'last_login' => $user->created_at ? $user->created_at->diffForHumans() : null,
            ]);

        // Fetch list of clean partner agency names to populate dropdown selectors
        $agenciesList = User::query()
            ->whereNotNull('agency_name')
            ->distinct()
            ->orderBy('agency_name')
            ->pluck('agency_name')
            ->toArray();

        return Inertia::render('users/agency/agencyuserindex', [
            'users' => $users,
            'agenciesList' => $agenciesList,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'agency' => $agencyFilter !== '' ? $agencyFilter : null,
                'status' => $statusFilter !== '' ? $statusFilter : null,
            ],
        ]);
    }

    /**
     * Toggle the status of a single partner user profile.
     */
    public function toggleUserStatus(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        // Restrict access using the update.agency permission
        abort_unless($currentUser->hasPermissionTo('update.useragency'), 403, 'Unauthorized action.');

        $user->is_active = !$user->is_active;
        $user->save();

        return back();
    }

    /**
     * Delete an entire agency (all registered users under it).
     */
    public function destroy(Request $request, string $agency): RedirectResponse
    {
        $currentUser = $request->user();

        // Restrict access using the delete.agency permission
        abort_unless($currentUser->hasPermissionTo('delete.agency'), 403, 'Unauthorized action.');

        $users = User::where('agency_name', $agency)->get();

        if ($users->isEmpty()) {
            abort(404, 'Agency not found.');
        }

        foreach ($users as $user) {
            // Prevent deleting the currently authenticated user
            if ($currentUser->id === $user->id) {
                continue;
            }
            $user->delete();
        }

        return back()->with('success', 'Agency and its associated users have been deleted.');
    }
}