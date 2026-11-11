<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full bg-canvas">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#0b0f19">
        <meta name="description" content="PharmaCare — pharmacy POS, inventory with expiry (FEFO) tracking, prescriptions and reports.">

        {{-- Apply the saved / system colour theme before first paint (no flash). --}}
        <script>
            (function () {
                try {
                    var pref = localStorage.getItem('pharmacare-theme') || 'system';
                    var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    document.documentElement.classList.toggle('dark', dark);
                    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                    document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#0b0f19' : '#f4f6fa');
                } catch (e) {
                    document.documentElement.classList.add('dark');
                }
            })();
        </script>

        <title inertia>{{ config('app.name', 'PharmaCare') }}</title>

        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="alternate icon" href="/favicon.ico">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

        <!-- Scripts & Styles -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased h-full bg-canvas text-slate-100">
        @inertia
    </body>
</html>
