<?php

namespace App\Console\Commands;

use App\Models\DrugCatalogItem;
use App\Services\DgdaCatalogService;
use Illuminate\Console\Command;

class SyncDgdaCatalogCommand extends Command
{
    protected $signature = 'pharmacare:sync-dgda
        {--pages=0 : Only fetch this many pages (0 = everything, ~80 pages of 500)}';

    protected $description = 'Download / refresh the Bangladesh national drug catalogue (DGDA registered products)';

    public function handle(DgdaCatalogService $catalog): int
    {
        $this->components->info('Syncing the DGDA drug catalogue from the DGHS terminology server…');

        try {
            $first = $catalog->syncPage(1);
        } catch (\Throwable $e) {
            $this->components->error($e->getMessage());

            return self::FAILURE;
        }

        $limit = (int) $this->option('pages');
        $pages = $limit > 0 ? min($limit, $first['pages']) : $first['pages'];

        $bar = $this->output->createProgressBar($pages);
        $bar->advance();

        for ($page = 2; $page <= $pages; $page++) {
            try {
                $catalog->syncPage($page);
            } catch (\Throwable $e) {
                $bar->clear();
                $this->components->error("Stopped at page {$page}: {$e->getMessage()}");
                $this->line('  Run the command again later — already downloaded entries are kept.');

                return self::FAILURE;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->components->info(number_format(DrugCatalogItem::count()).' registered medicines in the catalogue.');

        return self::SUCCESS;
    }
}
