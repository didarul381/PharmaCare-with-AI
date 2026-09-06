<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    /**
     * Switch the currently active staff/role in session.
     */
    public function switchRole(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:super_admin,pharmacist,cashier,inventory_manager',
        ]);

        $user = User::where('role', $validated['role'])->first();

        if (!$user) {
            $user = User::firstOrCreate(
                ['email' => $validated['role'] . '@pharmacare.ai'],
                [
                    'name' => User::getRoles()[$validated['role']] ?? ucfirst($validated['role']),
                    'password' => \Illuminate\Support\Facades\Hash::make('password'),
                    'role' => $validated['role'],
                    'is_active' => true,
                ]
            );
        }

        $oldUser = $request->session()->get('active_user_id') 
            ? User::find($request->session()->get('active_user_id')) 
            : null;

        $request->session()->put('active_user_id', $user->id);

        // Audit log role switch
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'role_switched',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => ['previous_user' => $oldUser?->name, 'previous_role' => $oldUser?->role],
            'new_values' => ['active_user' => $user->name, 'active_role' => $user->role],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'user' => $user,
                'message' => "Switched active role to " . (User::getRoles()[$user->role] ?? $user->role),
            ]);
        }

        return redirect()->back()->with('success', "Active role switched to " . (User::getRoles()[$user->role] ?? $user->role));
    }
}
