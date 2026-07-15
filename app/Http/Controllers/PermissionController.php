<?php
namespace App\Http\Controllers;

use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Returns all permissions grouped by module (the part before the dot),
     * which the frontend uses to render a clean permission matrix.
     */
    public function index()
{
    abort_unless(auth()->user()->can('view.permissions'), 403);

    return Permission::select('id', 'name', 'description')
        ->orderBy('description')
        ->get()
        ->groupBy('description');
}
}
