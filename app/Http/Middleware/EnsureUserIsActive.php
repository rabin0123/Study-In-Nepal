<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If the user is authenticated but has been marked as inactive
        if ($user && !($user->is_active ?? true)) {
            // Log the user out
            Auth::logout();

            // Invalidate the active session and regenerate the CSRF token
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            // Redirect back to the login page with a feedback message
            return redirect()->route('login')->withErrors([
                'email' => __('Your account has been deactivated. Please contact support.'),
            ]);
        }

        return $next($request);
    }
}