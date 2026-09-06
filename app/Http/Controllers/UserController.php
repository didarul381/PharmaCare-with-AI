<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UserController extends Controller
{
    /**
     * Display a listing of staff and their roles (Super Admin).
     */
    public function index(Request $request): Response
    {
        $role = $request->input('role');
        $search = $request->input('search');

        $query = User::withCount(['sales', 'stockAdjustments', 'auditLogs'])->latest();

        if ($role) {
            $query->where('role', $role);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->get();

        $metrics = [
            'total_users' => User::count(),
            'super_admins' => User::where('role', User::ROLE_SUPER_ADMIN)->count(),
            'pharmacists' => User::where('role', User::ROLE_PHARMACIST)->count(),
            'cashiers' => User::where('role', User::ROLE_CASHIER)->count(),
            'inventory_managers' => User::where('role', User::ROLE_INVENTORY_MANAGER)->count(),
        ];

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => User::getRoles(),
            'metrics' => $metrics,
            'filters' => [
                'role' => $role,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created staff member with assigned role.
     */
    public function store(Request $request): RedirectResponse
    {
        $currentUserId = $request->session()->get('active_user_id') ?? $request->user()?->id;
        $currentUser = $currentUserId ? User::find($currentUserId) : User::first();

        // RBAC Check: Only Super Admin can manage staff
        if ($currentUser && !$currentUser->isSuperAdmin()) {
            return redirect()->back()->with('error', 'Access Denied: Only Super Admin can create new staff users.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string', 'in:super_admin,pharmacist,cashier,inventory_manager'],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'string', 'max:500'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'avatar' => $validated['avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            'is_active' => true,
        ]);

        // Audit Trail
        AuditLog::create([
            'user_id' => $currentUser?->id ?? 1,
            'action' => 'user_created',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => null,
            'new_values' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_by' => $currentUser?->name ?? 'Super Admin',
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return redirect()->back()->with('success', "Staff user '{$user->name}' created and assigned role " . User::getRoles()[$user->role] . " successfully.");
    }

    /**
     * Update an existing staff member's role and details.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $currentUserId = $request->session()->get('active_user_id') ?? $request->user()?->id;
        $currentUser = $currentUserId ? User::find($currentUserId) : User::first();

        if ($currentUser && !$currentUser->isSuperAdmin()) {
            return redirect()->back()->with('error', 'Access Denied: Only Super Admin can modify staff accounts.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role' => ['required', 'string', 'in:super_admin,pharmacist,cashier,inventory_manager'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:6'],
            'is_active' => ['boolean'],
        ]);

        $oldSnapshot = [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
        ];

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->phone = $validated['phone'] ?? $user->phone;
        if (isset($validated['is_active'])) {
            $user->is_active = $validated['is_active'];
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        // Audit Trail
        AuditLog::create([
            'user_id' => $currentUser?->id ?? 1,
            'action' => 'user_updated',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => $oldSnapshot,
            'new_values' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'updated_by' => $currentUser?->name ?? 'Super Admin',
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return redirect()->back()->with('success', "Staff user '{$user->name}' updated successfully.");
    }

    /**
     * Deactivate / Archive a staff account.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $currentUserId = $request->session()->get('active_user_id') ?? $request->user()?->id;
        $currentUser = $currentUserId ? User::find($currentUserId) : User::first();

        if ($currentUser && !$currentUser->isSuperAdmin()) {
            return redirect()->back()->with('error', 'Access Denied: Only Super Admin can deactivate staff accounts.');
        }

        if ($currentUser && $currentUser->id === $user->id) {
            return redirect()->back()->with('error', 'You cannot deactivate your own active account.');
        }

        $user->is_active = false;
        $user->save();

        AuditLog::create([
            'user_id' => $currentUser?->id ?? 1,
            'action' => 'user_deactivated',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'old_values' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->role, 'is_active' => true],
            'new_values' => ['is_active' => false, 'deactivated_by' => $currentUser?->name ?? 'Super Admin'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return redirect()->back()->with('success', "Staff user '{$user->name}' has been deactivated.");
    }
}
