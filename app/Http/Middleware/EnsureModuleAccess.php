<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Server-side RBAC: `->middleware('module:inventory')` only lets through roles
 * listed for that module in config/pharmacare.php (super admins always pass).
 */
class EnsureModuleAccess
{
    public function handle(Request $request, Closure $next, string $module): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user || ! $user->canAccessModule($module)) {
            abort(403, 'Your role does not have access to this section.');
        }

        return $next($request);
    }
}
