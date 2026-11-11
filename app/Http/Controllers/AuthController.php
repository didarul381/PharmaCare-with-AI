<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Show the login page. One-click demo accounts are only listed in demo mode.
     */
    public function showLogin(): Response
    {
        $demoUsers = [];

        if (config('pharmacare.demo_mode')) {
            $descriptions = [
                User::ROLE_SUPER_ADMIN => 'Full access: staff, settings, reports',
                User::ROLE_PHARMACIST => 'Prescriptions, AI checks, POS',
                User::ROLE_CASHIER => 'Fast checkout & receipts',
                User::ROLE_INVENTORY_MANAGER => 'Stock, batches & suppliers',
            ];

            $demoUsers = User::query()
                ->where('is_active', true)
                ->whereIn('role', array_keys($descriptions))
                ->orderBy('id')
                ->get()
                ->unique('role')
                ->sortBy(fn (User $u) => array_search($u->role, array_keys($descriptions), true))
                ->map(fn (User $u) => [
                    'role' => $u->role,
                    'title' => User::getRoles()[$u->role],
                    'email' => $u->email,
                    'password' => config('pharmacare.demo_password'),
                    'desc' => $descriptions[$u->role],
                ])
                ->values();
        }

        return Inertia::render('Auth/Login', [
            'demoUsers' => $demoUsers,
        ]);
    }

    /**
     * Handle an authentication attempt.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Email or password is incorrect.',
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'This account has been deactivated. Please contact your administrator.',
            ]);
        }

        $request->session()->regenerate();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'auth_login',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => null,
            'new_values' => ['email' => $user->email, 'role' => $user->role, 'name' => $user->name],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return redirect()->intended($user->homePath())->with('success', "Welcome back, {$user->name}!");
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'auth_logout',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'old_values' => null,
                'new_values' => ['email' => $user->email],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('info', 'You have been signed out.');
    }
}
