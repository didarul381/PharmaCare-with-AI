<?php

namespace App\Http\Middleware;

use App\Models\StoreSetting;
use App\Models\User;
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
        /** @var User|null $user */
        $user = $request->user();
        $demoMode = (bool) config('pharmacare.demo_mode');

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
                'can' => $user ? $user->moduleAccessMap() : [],
                'roles' => User::getRoles(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'app_info' => fn () => $this->appInfo($demoMode),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function appInfo(bool $demoMode): array
    {
        $store = null;

        try {
            $store = StoreSetting::query()->first();
        } catch (\Throwable) {
            // Table may not exist yet during installation.
        }

        return [
            'name' => $store?->store_name ?: config('app.name', 'PharmaCare'),
            'tagline' => $store?->store_tagline,
            'version' => config('pharmacare.version'),
            'currency_symbol' => $store?->currency_symbol ?: '৳',
            'demo_mode' => $demoMode,
        ];
    }
}
