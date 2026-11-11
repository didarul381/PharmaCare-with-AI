<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks sensitive or destructive actions on a public demo installation so
 * visitors cannot lock others out or wipe the showcase data.
 */
class BlockInDemoMode
{
    public const MESSAGE = 'This action is disabled in the live demo.';

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('pharmacare.demo_mode')) {
            return $next($request);
        }

        // Inertia visits get a flash message; fetch() calls from the UI get JSON.
        if ($request->header('X-Inertia')) {
            return back()->with('warning', self::MESSAGE);
        }

        return response()->json(['success' => false, 'message' => self::MESSAGE], 403);
    }
}
