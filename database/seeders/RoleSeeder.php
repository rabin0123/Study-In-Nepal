<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------------
        // Developer - Full Access
        // ---------------------------------------------------------------
        $developer = Role::firstOrCreate([
            'name' => 'developer',
            'guard_name' => 'web',
        ]);

        $developer->syncPermissions(Permission::all());

        // ---------------------------------------------------------------
        // Main Agent
        // ---------------------------------------------------------------
        $mainAgent = Role::firstOrCreate([
            'name' => 'main-agent',
            'guard_name' => 'web',
        ]);

        $mainAgent->syncPermissions([
            'view.user',
            'create.user',
            'update.user',
            'delete.user',
            'verify-access.user',

            'view.useragency',
            'update.useragency',
            'delete.useragency',

            'view.commissionindex',
            'view.commission',
            'create.commission',
            'update.commission',
            'delete.commission',
            'export.commission',
            'import.commission',

            'view.application',
            'create.application',
            'update.application',
            'delete.application',
            'export.application',

            'view.agency',
            'update.agency',
            'delete.agency',
        ]);

        // ---------------------------------------------------------------
        // Main Agent Staff
        // ---------------------------------------------------------------
        $mainAgentStaff = Role::firstOrCreate([
            'name' => 'main-agent-staff',
            'guard_name' => 'web',
        ]);

        $mainAgentStaff->syncPermissions([
            'view.user',
            'create.user',
            'update.user',

            'view.useragency',
            'update.useragency',

            'view.commissionindex',
            'view.commission',
            'create.commission',
            'update.commission',

            'view.application',
            'create.application',
            'update.application',

            'view.agency',
        ]);

        // ---------------------------------------------------------------
        // B2B Partner
        // ---------------------------------------------------------------
        $partner = Role::firstOrCreate([
            'name' => 'b2b-partner',
            'guard_name' => 'web',
        ]);

        $partner->syncPermissions([
            'view.application',
            'create.application',
            'update.application',

            'view.commission',

            'view.agency',
        ]);

        // ---------------------------------------------------------------
        // B2B Partner Staff
        // ---------------------------------------------------------------
        $partnerStaff = Role::firstOrCreate([
            'name' => 'b2b-partner-staff',
            'guard_name' => 'web',
        ]);

        $partnerStaff->syncPermissions([
            'view.application',
            'create.application',

            'view.commission',
        ]);
    }
}