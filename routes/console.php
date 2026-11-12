<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled tasks
|--------------------------------------------------------------------------
|
| Add this single cron entry on the server:
|   * * * * * cd /path-to-pharmacare && php artisan schedule:run >> /dev/null 2>&1
|
*/

// Public demo only: restore pristine demo data periodically.
Schedule::command('pharmacare:demo-reset')
    ->cron(config('pharmacare.demo_reset_cron', '0 */6 * * *'))
    ->when(fn () => (bool) config('pharmacare.demo_mode'))
    ->withoutOverlapping();

// Monthly refresh of the national DGDA drug catalogue — only once a pharmacy has downloaded it.
Schedule::command('pharmacare:sync-dgda')
    ->monthlyOn(1, '03:00')
    ->when(function () {
        try {
            return ! config('pharmacare.demo_mode') && \App\Models\DrugCatalogItem::query()->exists();
        } catch (\Throwable) {
            return false;
        }
    })
    ->withoutOverlapping()
    ->runInBackground();
