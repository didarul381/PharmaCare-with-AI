<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Product version
    |--------------------------------------------------------------------------
    */
    'version' => '1.0.0',

    /*
    |--------------------------------------------------------------------------
    | Demo mode
    |--------------------------------------------------------------------------
    |
    | Enable ONLY on a public showcase installation. When enabled:
    |  - the login page shows one-click demo accounts,
    |  - staff can switch roles from the user menu,
    |  - destructive / sensitive actions (deleting staff, changing settings,
    |    saving AI keys, wiping prescriptions) are blocked,
    |  - `php artisan pharmacare:demo-reset` is scheduled to restore data.
    |
    | Never enable this on a real pharmacy installation.
    |
    */
    'demo_mode' => (bool) env('PHARMACARE_DEMO_MODE', false),

    // How often the scheduler wipes & reseeds a demo installation (cron expression).
    'demo_reset_cron' => env('PHARMACARE_DEMO_RESET_CRON', '0 */6 * * *'),

    // Password shared by every seeded demo account.
    'demo_password' => 'password',

    /*
    |--------------------------------------------------------------------------
    | Medicine Guide: live lookup on medex.com.bd
    |--------------------------------------------------------------------------
    |
    | Off by default. When enabled, the Medicine Guide's online search also
    | reads public pages from medex.com.bd (a third-party website). Review that
    | website's terms of use and get permission before turning this on.
    | openFDA and RxNorm (free public APIs) are always used.
    |
    */
    'medex_lookup' => (bool) env('PHARMACARE_MEDEX_LOOKUP', false),

    /*
    |--------------------------------------------------------------------------
    | Bangladesh national drug catalogue (DGDA registered products)
    |--------------------------------------------------------------------------
    |
    | Public terminology server run by DGHS (Ministry of Health & Family
    | Welfare). Data: Directorate General of Drug Administration, Government
    | of Bangladesh. Sync with: php artisan pharmacare:sync-dgda
    |
    */
    'dgda_catalog_url' => env('PHARMACARE_DGDA_CATALOG_URL', 'https://tr.ocl.dghs.gov.bd/api/orgs/MoHFW/sources/DGDA-Drugs/concepts/'),

    /*
    |--------------------------------------------------------------------------
    | Module access per role
    |--------------------------------------------------------------------------
    |
    | Super admins can access everything. Keys match the sidebar modules and
    | the `role:` middleware groups in routes/web.php.
    |
    */
    'modules' => [
        'dashboard' => ['pharmacist', 'cashier', 'inventory_manager'],
        'pos' => ['pharmacist', 'cashier'],
        'invoices' => ['pharmacist', 'cashier'],
        'clinical-reference' => ['pharmacist', 'cashier'],
        'reports' => ['pharmacist', 'inventory_manager'],
        'prescriptions' => ['pharmacist'],
        'ai-insights' => ['pharmacist'],
        'inventory' => ['pharmacist', 'inventory_manager'],
        'suppliers' => ['pharmacist', 'inventory_manager'],
        'audit-logs' => ['pharmacist', 'inventory_manager'],
        'users' => [],
        'settings' => [],
    ],
];
