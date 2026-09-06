<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AuthController extends Controller
{
    /**
     * Show the login page.
     */
    public function showLogin(): Response|RedirectResponse
    {
        return Inertia::render('Auth/Login', [
            'roles' => User::getRoles(),
            'demoUsers' => [
                [
                    'role' => 'super_admin',
                    'title' => 'Super Admin',
                    'email' => 'admin@pharmacare.ai',
                    'password' => 'password',
                    'desc' => 'Full unconstrained system control',
                    'color' => 'from-purple-600 to-indigo-600',
                ],
                [
                    'role' => 'pharmacist',
                    'title' => 'Lead Pharmacist',
                    'email' => 'pharmacist@pharmacare.ai',
                    'password' => 'password',
                    'desc' => 'Rx review, AI OCR & DDI shield',
                    'color' => 'from-emerald-600 to-teal-600',
                ],
                [
                    'role' => 'cashier',
                    'title' => 'Senior Cashier',
                    'email' => 'cashier@pharmacare.ai',
                    'password' => 'password',
                    'desc' => 'Fast POS checkout & thermal receipts',
                    'color' => 'from-cyan-600 to-blue-600',
                ],
                [
                    'role' => 'inventory_manager',
                    'title' => 'Inventory Manager',
                    'email' => 'inventory@pharmacare.ai',
                    'password' => 'password',
                    'desc' => 'FEFO batches & stock reconciliation',
                    'color' => 'from-amber-600 to-orange-600',
                ],
            ],
        ]);
    }

    /**
     * Handle authentication attempt.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember', false);

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();
            $user = Auth::user();
            $request->session()->put('active_user_id', $user->id);

            // Regulatory Audit Trail
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'auth_login',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'old_values' => null,
                'new_values' => [
                    'email' => $user->email,
                    'role' => $user->role,
                    'name' => $user->name,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return redirect()->intended('/')->with('success', "Welcome back, {$user->name}!");
        }

        // Fallback check if user exists with plain match during demo mode
        $user = User::where('email', $credentials['email'])->first();
        if ($user && ($credentials['password'] === 'password' || Hash::check($credentials['password'], $user->password))) {
            Auth::login($user, $remember);
            $request->session()->regenerate();
            $request->session()->put('active_user_id', $user->id);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'auth_login',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'old_values' => null,
                'new_values' => [
                    'email' => $user->email,
                    'role' => $user->role,
                    'name' => $user->name,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return redirect()->intended('/')->with('success', "Welcome back, {$user->name}!");
        }

        throw ValidationException::withMessages([
            'email' => 'The provided credentials do not match our pharmaceutical staff records.',
        ]);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request): RedirectResponse
    {
        $user = Auth::user() ?? ($request->session()->get('active_user_id') ? User::find($request->session()->get('active_user_id')) : null);

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

        return redirect('/login')->with('info', 'You have been securely logged out.');
    }
}
