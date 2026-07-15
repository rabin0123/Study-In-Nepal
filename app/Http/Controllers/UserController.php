<?php

namespace App\Http\Controllers;

use App\Exceptions\ProtectedUserException;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        return User::with('roles:id,name')
            ->when($request->account_type, fn ($q, $type) => $q->where('account_type', $type))
            ->paginate(20);
    }

    public function show(User $user)
    {
        $this->authorize('viewAny', User::class);

        return $user->load('roles.permissions');
    }

    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        // is_protected / is_active deliberately excluded from mass update —
        // they go through the dedicated endpoints below.
        $user->update($data);

        return $user;
    }

    public function deactivate(User $user)
    {
        $this->authorize('deactivate', $user);

        try {
            $user->deactivate();
        } catch (ProtectedUserException $e) {
            return $e->render(request());
        }

        return response()->json(['message' => 'User deactivated.', 'user' => $user]);
    }

    public function activate(User $user)
    {
        $this->authorize('update', $user);

        $user->activate();

        return response()->json(['message' => 'User activated.', 'user' => $user]);
    }

    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        try {
            $user->delete();
        } catch (ProtectedUserException $e) {
            return $e->render(request());
        }

        return response()->json(['message' => 'User deleted.']);
    }

    public function assignRoles(Request $request, User $user)
    {
        $this->authorize('assignRole', $user);

        $data = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        // Guard: nobody can strip the "developer" role off a protected account.
        if ($user->isProtected() && ! in_array('developer', $data['roles'], true)) {
            return response()->json([
                'message' => 'The developer role cannot be removed from a protected account.',
            ], 403);
        }

        $user->syncRoles($data['roles']);

        return $user->load('roles');
    }
}
