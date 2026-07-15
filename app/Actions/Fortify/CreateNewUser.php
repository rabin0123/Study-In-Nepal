<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Notifications\VerifyNewAgentNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(array $input): User
    {
        Validator::make($input, [
            'agency_name'    => ['required', 'string', 'max:255'],
            'name'           => ['required', 'string', 'max:255'], // Person Name
            'country'        => ['required', 'string', 'max:255'],
            // contact_number is submitted already formatted as a full
            // international (E.164) number, e.g. +923001234567
            'contact_number' => ['required', 'string', 'max:32', 'regex:/^\+[1-9]\d{6,14}$/'],
            'email'          => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password'       => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'agency_name'    => $input['agency_name'],
            'name'           => $input['name'],
            'country'        => $input['country'],
            'contact_number' => $input['contact_number'],
            'email'          => $input['email'],
            'password'       => Hash::make($input['password']),
            // Explicit even though it matches the column default: newly
            // self-registered agents always start unverified.
            'is_manually_verified' => false,
        ]);

        $this->notifyEligibleVerifiers($user);

        return $user;
    }

    /**
     * Notify everyone system-wide who is allowed to manually verify new
     * agents: any Main Agent / Main Agent Staff with can_verify_users =
     * true, regardless of which agency they or the new registrant belong
     * to. Falls back to developers only if nobody currently holds that
     * permission at all.
     */
    private function notifyEligibleVerifiers(User $newUser): void
    {
        $verifiers = User::query()
            ->where('id', '!=', $newUser->id)
            ->where('can_verify_users', true)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['main-agent', 'main-agent-staff']);
            })
            ->get();

        if ($verifiers->isEmpty()) {
            $verifiers = User::query()
                ->whereHas('roles', fn ($query) => $query->where('name', 'developer'))
                ->get();
        }

        if ($verifiers->isEmpty()) {
            // Nobody to notify — don't block registration on this, but make
            // sure it's visible in logs since the new user is now stuck
            // until someone manually flips is_manually_verified in the DB
            // or via a future admin action.
            Log::warning('No eligible verifier found for newly registered user.', [
                'user_id' => $newUser->id,
                'agency_name' => $newUser->agency_name,
            ]);

            return;
        }

        foreach ($verifiers as $verifier) {
            $verifier->notify(new VerifyNewAgentNotification($newUser));
        }
    }
}