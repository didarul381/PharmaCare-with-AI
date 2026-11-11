<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    /**
     * Demo-only: sign in as the first active account of another role so
     * visitors can explore each staff experience. Disabled (404) unless
     * PHARMACARE_DEMO_MODE=true.
     */
    public function switchRole(Request $request): RedirectResponse
    {
        abort_unless(config('pharmacare.demo_mode'), 404);

        $validated = $request->validate([
            'role' => 'required|string|in:'.implode(',', array_keys(User::getRoles())),
        ]);

        $user = User::where('role', $validated['role'])->where('is_active', true)->first();

        if (! $user) {
            return back()->with('error', 'No active demo account exists for that role.');
        }

        $previous = $request->user();

        Auth::login($user);
        $request->session()->regenerate();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'role_switched',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => ['previous_user' => $previous?->name, 'previous_role' => $previous?->role],
            'new_values' => ['active_user' => $user->name, 'active_role' => $user->role],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $label = User::getRoles()[$user->role] ?? $user->role;

        // The new role may not be allowed on the current page — land on its first allowed module.
        return redirect($user->homePath())->with('success', "Now viewing as {$label}.");
    }
}
