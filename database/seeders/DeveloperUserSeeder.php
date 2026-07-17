<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DeveloperUserSeeder extends Seeder
{
    public function run(): void
    {
        // CHANGE THESE before running in production, or better, pull from env().
        $email = env('DEVELOPER_EMAIL', 'developer@studyinnepal.com');
        $password = env('DEVELOPER_PASSWORD', 'AdminPassword123!');

        $developer = User::withoutEvents(function () use ($email, $password) {
            // withoutEvents avoids triggering the UserObserver's protection
            // checks during initial creation (there's nothing to protect yet).
            return User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => 'Developer User',
                    'country'=> 'Nepal',
                    'contact_number'=> '9800000000',
                    'agency_name' => 'Study In Nepal',
                    'password' => Hash::make($password),
                    'is_protected' => true,   // <-- the flag that makes this account untouchable
                    'is_active' => true,
                    'account_type' => 'internal',
                    'email_verified_at' => now(),
                    'is_manually_verified' => true,
                    'avatar' => User::generateRandomAvatar(),
                ]
            );
        });

        $developer->syncRoles(['developer']);

        $this->command?->info("Developer account ready: {$email}");

        // ── Default Main Agent ─────────────────────────────────────────
        // Seeded in its own agency so that agency always has at least one
        // eligible verifier from day one — otherwise, per the manual
        // verification workflow, new registrants under a brand-new agency
        // with nobody yet holding can_verify_users would fall back to
        // notifying developers instead of their own agency's Main Agent.
        // CHANGE THESE before running in production, or better, pull from env().
        $mainAgentEmail = env('MAIN_AGENT_EMAIL', 'bikalp@gmail.com');
        $mainAgentPassword = env('MAIN_AGENT_PASSWORD', 'Kathmandu@2026=');
        $mainAgentAgencyName = env('MAIN_AGENT_AGENCY_NAME', 'Study In Nepal');

        $mainAgent = User::withoutEvents(function () use ($mainAgentEmail, $mainAgentPassword, $mainAgentAgencyName) {
            return User::updateOrCreate(
                ['email' => $mainAgentEmail],
                [
                    'name' => 'Bikalp Raj Pokhrel',
                    'country' => 'Nepal',
                    'contact_number' => '+977 9841338194',
                    'agency_name' => $mainAgentAgencyName,
                    'password' => Hash::make($mainAgentPassword),
                    'is_protected' => true,
                    'is_active' => true,
                    'account_type' => 'internal',
                    'email_verified_at' => now(),
                    'is_manually_verified' => true,
                    'can_verify_users' => true,
                    'avatar' => User::generateRandomAvatar(),
                ]
            );
        });

        $mainAgent->syncRoles(['main-agent']);

        $this->command?->info("Main Agent account ready: {$mainAgentEmail} (agency: {$mainAgentAgencyName})");
    }
}