<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\User; // <--- Import User Model
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash; // <--- Import Hash facade
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException; // <--- Import ValidationException
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configureAuthentication(); // <--- Add this line
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure custom authentication check for active status.
     */
    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $usernameField = Fortify::username(); // Dynamically gets 'email' or custom username config

            // Retrieve user matching the username field
            $user = User::where($usernameField, $request->input($usernameField))->first();

            // Check if user exists and password is correct
            if ($user && Hash::check($request->password, $user->password)) {

                // If user is deactivated, block authentication and throw a validation error
                if (!($user->is_active ?? true)) {
                    throw ValidationException::withMessages([
                        $usernameField => [__('Your account has been deactivated. Please contact support.')],
                    ]);
                }

                // Developers are exempt from manual verification. Everyone
                // else must be approved by a Main Agent / Main Agent Staff
                // (with verifier permission) or a developer before they can
                // log in, regardless of email verification status.
                if (! $user->hasRole('developer') && ! ($user->is_manually_verified ?? false)) {
                    throw ValidationException::withMessages([
                        $usernameField => [__('Your account is pending manual verification by your agency administrator. You will be able to log in once approved.')],
                    ]);
                }

                return $user;
            }

            // Return null if credentials do not match to trigger default Fortify "incorrect credentials" validation
            return null;
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(function (Request $request) {
    $user = User::where('email', $request->email)->first();

    return Inertia::render('auth/reset-password', [
        'email' => $request->email,
        'token' => $request->route('token'),
        'passwordRules' => Password::defaults()->toPasswordRulesString(),
        'isInvite' => $user ? is_null($user->email_verified_at) : false,
    ]);
});

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}