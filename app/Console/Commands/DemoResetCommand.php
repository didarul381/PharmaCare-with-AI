<?php

namespace App\Console\Commands;

use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoSalesSeeder;
use Database\Seeders\MedexExpandedSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DemoResetCommand extends Command
{
    protected $signature = 'pharmacare:demo-reset {--force : Run even when demo mode is off (wipes ALL data)}';

    protected $description = 'Wipe and reseed the public demo installation';

    public function handle(): int
    {
        if (! config('pharmacare.demo_mode') && ! $this->option('force')) {
            $this->components->error('Demo mode is off. This command wipes every table — refusing to run on a real installation.');
            $this->line('  Set PHARMACARE_DEMO_MODE=true, or pass --force if you are sure.');

            return self::FAILURE;
        }

        // Keep the downloaded DGDA catalogue (≈39k rows) so every reset doesn't re-download it.
        $catalog = Schema::hasTable('drug_catalog_items')
            ? DB::table('drug_catalog_items')->get()->map(fn ($r) => (array) $r)->all()
            : [];

        $this->components->task('Rebuilding tables', fn () => $this->callSilent('migrate:fresh', ['--force' => true]) === 0);

        if ($catalog) {
            $this->components->task('Restoring medicine catalogue', function () use ($catalog) {
                foreach (array_chunk($catalog, 1000) as $chunk) {
                    DB::table('drug_catalog_items')->insert($chunk);
                }

                return true;
            });
        }
        $this->components->task('Seeding demo data', fn () => $this->callSilent('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true]) === 0
            && $this->callSilent('db:seed', ['--class' => MedexExpandedSeeder::class, '--force' => true]) === 0);
        $this->components->task('Generating 30 days of sales', fn () => $this->callSilent('db:seed', ['--class' => DemoSalesSeeder::class, '--force' => true]) === 0);
        $this->callSilent('cache:clear');

        $this->components->info('Demo data restored.');

        return self::SUCCESS;
    }
}
