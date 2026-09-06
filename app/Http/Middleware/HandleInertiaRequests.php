<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $activeUserId = $request->session()->get('active_user_id');
        $user = null;

        try {
            if ($activeUserId) {
                $user = \App\Models\User::find($activeUserId);
            }

            if (!$user) {
                $user = $request->user()
                    ?? \App\Models\User::where('role', 'super_admin')->first()
                    ?? \App\Models\User::where('role', 'pharmacist')->first()
                    ?? \App\Models\User::first();
            }

            $availableUsers = \App\Models\User::where('is_active', true)->get()->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'avatar' => $u->avatar,
            ]);
        } catch (\Throwable $e) {
            $user = null;
            $availableUsers = [];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                ] : null,
                'available_users' => $availableUsers,
                'roles' => \App\Models\User::getRoles(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'app_info' => [
                'name' => config('app.name', 'PharmaCare AI'),
                'version' => '2.5.0-Enterprise',
                'currency_symbol' => '৳', // Default currency (supports ৳, $, £, €)
            ],
        ];
    }
}
