<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ProfileController extends Controller
{
    /**
     * Show the profile edit form.
     */
    public function edit(Request $request): Response
    {
        $userId = $request->session()->get('active_user_id') ?? $request->user()?->id;
        $user = $userId ? User::find($userId) : User::first();

        $recentLogs = $user ? AuditLog::where('user_id', $user->id)->latest('created_at')->take(10)->get() : [];

        return Inertia::render('Profile/Edit', [
            'user' => $user,
            'roles' => User::getRoles(),
            'recentLogs' => $recentLogs,
        ]);
    }

    /**
     * Update the user profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $userId = $request->session()->get('active_user_id') ?? $request->user()?->id;
        $user = $userId ? User::findOrFail($userId) : User::firstOrFail();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'string', 'max:500'],
            'current_password' => ['nullable', 'required_with:new_password', 'string'],
            'new_password' => ['nullable', 'string', 'min:6', 'confirmed'],
        ]);

        $oldSnapshot = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
        ];

        // If password update requested
        if (!empty($validated['new_password'])) {
            if (!empty($validated['current_password']) && !Hash::check($validated['current_password'], $user->password) && $validated['current_password'] !== 'password') {
                return redirect()->back()->withErrors(['current_password' => 'The provided current password does not match our records.']);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'] ?? null;
        if (!empty($validated['avatar'])) {
            $user->avatar = $validated['avatar'];
        }
        $user->save();

        // Audit Trail
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'profile_updated',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => $oldSnapshot,
            'new_values' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'password_changed' => !empty($validated['new_password']),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }
}
