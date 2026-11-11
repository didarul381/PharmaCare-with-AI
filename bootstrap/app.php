<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'module' => \App\Http\Middleware\EnsureModuleAccess::class,
            'demo.block' => \App\Http\Middleware\BlockInDemoMode::class,
            'active' => \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Friendly, themed error pages for Inertia visits (403/404/419/500/503).
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();
            $friendly = [403, 404, 419, 500, 503];

            if (! in_array($status, $friendly, true) || $request->expectsJson()) {
                return $response;
            }

            // Keep Laravel's detailed debug page for server errors while developing.
            if ($status >= 500 && config('app.debug')) {
                return $response;
            }

            if ($status === 419) {
                return back()->with('warning', 'Your session expired. Please try again.');
            }

            return Inertia::render('Error', [
                'status' => $status,
                'message' => $status === 403 && $e->getMessage() ? $e->getMessage() : null,
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
