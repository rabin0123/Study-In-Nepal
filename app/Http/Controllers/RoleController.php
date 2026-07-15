<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        if (! auth()->user()->can('view.role')) {
            return back()->withErrors([
                'message' => 'You do not have permission to view roles.'
            ]);
        }

        return Inertia::render('roles/RoleIndexPage', [
            'roles' => Role::with('permissions:id,name')->get()
        ]);
    }

    public function store(Request $request)
    {
        if (! auth()->user()->can('roles.create')) {
            return back()->withErrors([
                'message' => 'You do not have permission to create roles.'
            ]);
        }

        $data = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);

        if (! empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return redirect()->route('roles.index')->with('success', 'Role created successfully.');
    }

    public function edit(Role $role)
    {
        if (! auth()->user()->can('update.role')) {
            return back()->withErrors([
                'message' => 'You do not have permission to edit roles.'
            ]);
        }

        if ($role->name === 'developer') {
            return back()->withErrors([
                'message' => 'The developer role cannot be edited.'
            ]);
        }

        $groupedPermissions = Permission::all(['id', 'name'])
            ->groupBy(fn ($permission) => explode('.', $permission->name)[0]);

        return Inertia::render('roles/RoleCreatePage', [
            'groupedPermissions' => $groupedPermissions,
            'editingRole' => $role->load('permissions:id,name')
        ]);
    }

    public function update(Request $request, Role $role)
    {
        if (! auth()->user()->can('update.role')) {
            return back()->withErrors([
                'message' => 'You do not have permission to update roles.'
            ]);
        }

        if ($role->name === 'developer') {
            return back()->withErrors([
                'message' => 'The developer role always has all permissions and cannot be edited.'
            ]);
        }

        $data = $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return redirect()->route('roles.index')->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        if (! auth()->user()->can('roles.delete')) {
            return back()->withErrors([
                'message' => 'You do not have permission to delete roles.'
            ]);
        }

        if (in_array($role->name, ['developer', 'main-agent'], true)) {
            return back()->withErrors([
                'message' => 'This role cannot be deleted.'
            ]);
        }

        $role->delete();

        return redirect()->route('roles.index')->with('success', 'Role deleted successfully.');
    }
}