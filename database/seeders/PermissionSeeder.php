<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Central registry of every permission in the app.
     * Add new permissions here ONLY — the Developer role auto-inherits
     * everything in this list, so you never have to remember to update it manually.
     */
   public static array $permissions = [

    // User
    ['name' => 'view.user', 'description' => 'User'],
    ['name' => 'create.user', 'description' => 'User'],
    ['name' => 'update.user', 'description' => 'User'],
    ['name' => 'delete.user', 'description' => 'User'],
    ['name' => 'verify-access.user', 'description' => 'User'],

    // User Agency
    ['name' => 'view.useragency', 'description' => 'User Agency'],
    ['name' => 'update.useragency', 'description' => 'User Agency'],
    ['name' => 'delete.useragency', 'description' => 'User Agency'],

    // Commission
    ['name' => 'view.commissionindex', 'description' => 'Commission'],
    ['name' => 'view.commission', 'description' => 'Commission'],
    ['name' => 'create.commission', 'description' => 'Commission'],
    ['name' => 'update.commission', 'description' => 'Commission'],
    ['name' => 'delete.commission', 'description' => 'Commission'],
    ['name' => 'export.commission', 'description' => 'Commission'],
    ['name' => 'import.commission', 'description' => 'Commission'],

    // Application
    ['name' => 'view.application', 'description' => 'Application'],
    ['name' => 'create.application', 'description' => 'Application'],
    ['name' => 'update.application', 'description' => 'Application'],
    ['name' => 'delete.application', 'description' => 'Application'],
    ['name' => 'export.application', 'description' => 'Application'],
    ['name' => 'update.applicationstatus', 'description' => 'Application'],
    ['name' => 'download.application', 'description' => 'Application'],

    // Agency
    ['name' => 'view.agency', 'description' => 'Agency'],
    ['name' => 'update.agency', 'description' => 'Agency'],
    ['name' => 'delete.agency', 'description' => 'Agency'],

    // Role
    ['name' => 'view.role', 'description' => 'Role'],
    ['name' => 'create.role', 'description' => 'Role'],
    ['name' => 'update.role', 'description' => 'Role'],
    ['name' => 'delete.role', 'description' => 'Role'],
    ['name' => 'assign.role', 'description' => 'Role'],

    // Permission
    ['name' => 'view.permissions', 'description' => 'Permission'],
];

   public function run(): void
{
    foreach (self::$permissions as $permission) {
        Permission::updateOrCreate(
            [
                'name' => $permission['name'],
                'guard_name' => 'web',
            ],
            [
                'description' => $permission['description'],
            ]
        );
    }
}
}
