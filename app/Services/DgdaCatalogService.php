<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\DosageForm;
use App\Models\DrugCatalogItem;
use App\Models\GenericName;
use App\Models\Manufacturer;
use App\Models\Medicine;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Bangladesh national drug catalogue (DGDA registered products), published by
 * DGHS on its public terminology server (OCL). Data © DGDA, Government of Bangladesh.
 *
 * - sync: pages through the public API and upserts into drug_catalog_items
 * - addToInventory: turns selected catalogue entries into the pharmacy's medicines
 */
class DgdaCatalogService
{
    public const PAGE_SIZE = 500;

    /**
     * Fetch one page from the DGHS terminology server and store it.
     *
     * @return array{page:int, pages:int, total:int, synced:int}
     */
    public function syncPage(int $page): array
    {
        $response = Http::acceptJson()
            ->withUserAgent('PharmaCare/'.config('pharmacare.version').' (drug catalogue sync)')
            ->timeout(90)
            ->retry(3, 2000, throw: false)
            ->get(config('pharmacare.dgda_catalog_url'), [
                'limit' => self::PAGE_SIZE,
                'page' => max(1, $page),
                'verbose' => 'true',
                'includeExtras' => 'true',
            ]);

        if (! $response->successful()) {
            throw new RuntimeException("The DGDA catalogue server returned HTTP {$response->status()}. Please try again later.");
        }

        $concepts = $response->json();
        if (! is_array($concepts)) {
            throw new RuntimeException('The DGDA catalogue server returned an unexpected response.');
        }

        $rows = collect($concepts)->map(fn ($c) => is_array($c) ? self::parse($c) : null)->filter()->values();
        $this->upsert($rows);

        $total = (int) ($response->header('num_found') ?: 0);
        $pages = (int) ($response->header('pages') ?: ($total ? ceil($total / self::PAGE_SIZE) : $page));

        return ['page' => $page, 'pages' => max($pages, $page), 'total' => $total, 'synced' => $rows->count()];
    }

    /**
     * Normalise one OCL concept into a catalogue row. Returns null for raw
     * materials / retired entries.
     *
     * Generic content arrives as "<generics>  <strengths>" separated by two or
     * more spaces, e.g. "Camphor + Menthol  4 gm + 10 gm/100 gm".
     */
    public static function parse(array $concept): ?array
    {
        if (($concept['concept_class'] ?? null) !== 'Drug' || ! empty($concept['retired'])) {
            return null;
        }

        $extras = is_array($concept['extras'] ?? null) ? $concept['extras'] : [];
        $trade = self::clean($extras['trade_name'] ?? $concept['display_name'] ?? '');
        $code = (string) ($concept['id'] ?? '');

        if ($trade === '' || $code === '') {
            return null;
        }

        $raw = trim((string) ($extras['generic_content_raw'] ?? ''));
        [$generic, $strength] = array_pad(preg_split('/\s{2,}/', $raw, 2) ?: [], 2, '');

        return [
            'code' => mb_substr($code, 0, 191),
            'dar_number' => mb_substr(self::clean($extras['dar_number'] ?? ''), 0, 50) ?: null,
            'trade_name' => mb_substr($trade, 0, 255),
            'generic' => mb_substr(self::clean($generic), 0, 255) ?: null,
            'strength' => mb_substr(self::clean($strength), 0, 255) ?: null,
            'generic_raw' => $raw ?: null,
            'dosage_form' => mb_substr(self::clean($extras['dosage_form'] ?? ''), 0, 100) ?: null,
            'company' => mb_substr(self::clean($extras['company'] ?? ''), 0, 255) ?: null,
            'quality_flag' => mb_substr(self::clean($extras['dar_quality_flag'] ?? ''), 0, 50) ?: null,
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     */
    public function upsert(Collection $rows): void
    {
        $now = now();
        $rows->map(fn ($r) => $r + ['created_at' => $now, 'updated_at' => $now])
            ->chunk(250)
            ->each(fn ($chunk) => DrugCatalogItem::upsert(
                $chunk->values()->all(),
                ['code'],
                ['dar_number', 'trade_name', 'generic', 'strength', 'generic_raw', 'dosage_form', 'company', 'quality_flag', 'updated_at'],
            ));
    }

    /**
     * Create pharmacy medicines from catalogue entries. Entries already linked
     * (or with the same name) are skipped. New medicines start with no stock —
     * add a batch to start selling them.
     *
     * @param  Collection<int, DrugCatalogItem>  $items
     * @return array{added:int, restored:int, skipped:int}
     */
    public function addToInventory(Collection $items, ?User $user = null): array
    {
        // Archived medicines linked to these entries come back instead of being duplicated.
        $restored = Medicine::whereIn('catalog_code', $items->pluck('code'))->where('is_active', false)->update(['is_active' => true]);

        $linked = Medicine::whereIn('catalog_code', $items->pluck('code'))->pluck('catalog_code')->flip();

        // Same name + same dosage form = same product at the counter (DGDA lists some brands
        // once per manufacturing site). Different forms with the same name are kept.
        $existingNames = Medicine::with('dosageForm:id,name')
            ->whereIn('name', $items->map->displayName())
            ->get(['name', 'dosage_form_id'])
            ->mapWithKeys(fn ($m) => [self::dedupeKey($m->name, $m->dosageForm?->name) => true])
            ->all();

        $generics = [];
        $companies = [];
        $forms = [];
        $units = [];
        $added = 0;
        $skipped = 0;

        DB::transaction(function () use ($items, $linked, $existingNames, &$generics, &$companies, &$forms, &$units, &$added, &$skipped) {
            foreach ($items as $item) {
                $name = $item->displayName();
                $key = self::dedupeKey($name, $item->dosage_form);

                if (isset($linked[$item->code]) || isset($existingNames[$key])) {
                    $skipped++;
                    continue;
                }

                $genericId = null;
                if ($item->generic) {
                    $genericId = $generics[$item->generic] ??= GenericName::firstOrCreate(['name' => $item->generic])->id;
                }

                $manufacturerId = null;
                if ($item->company) {
                    $manufacturerId = $companies[$item->company] ??= Manufacturer::firstOrCreate(['name' => $item->company], ['is_active' => true])->id;
                }

                $formId = null;
                if ($item->dosage_form) {
                    $formId = $forms[$item->dosage_form] ??= DosageForm::firstOrCreate(['name' => $item->dosage_form])->id;
                }

                [$primary, $secondary, $rate] = self::packagingFor($item->dosage_form);
                $primaryId = $units[$primary] ??= Unit::firstOrCreate(['name' => $primary], ['short_name' => mb_substr($primary, 0, 4)])->id;
                $secondaryId = $units[$secondary] ??= Unit::firstOrCreate(['name' => $secondary], ['short_name' => mb_substr($secondary, 0, 4)])->id;

                Medicine::create([
                    'name' => $name,
                    'brand_name' => $item->trade_name,
                    'sku' => $this->uniqueSku($item),
                    'catalog_code' => $item->code,
                    'generic_name_id' => $genericId,
                    'manufacturer_id' => $manufacturerId,
                    'dosage_form_id' => $formId,
                    'primary_unit_id' => $primaryId,
                    'secondary_unit_id' => $secondaryId,
                    'unit_conversion_rate' => $rate,
                    'strength' => $item->strength,
                    'min_stock_alert' => 10,
                    'is_active' => true,
                ]);

                $existingNames[$key] = true;
                $added++;
            }
        });

        $skipped -= $restored; // restored ones were counted as "already linked" in the loop

        if ($added > 0 || $restored > 0) {
            AuditLog::create([
                'user_id' => $user?->id,
                'action' => 'catalog_import',
                'entity_type' => 'Medicine',
                'entity_id' => null,
                'new_values' => ['added' => $added, 'restored' => $restored, 'skipped' => $skipped, 'source' => 'DGDA national drug catalogue'],
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
                'created_at' => now(),
            ]);
        }

        return ['added' => $added, 'restored' => $restored, 'skipped' => $skipped];
    }

    /**
     * Sensible default pack units per dosage form: [primary, secondary, conversion].
     *
     * @return array{0:string, 1:string, 2:int}
     */
    public static function packagingFor(?string $form): array
    {
        $f = Str::lower((string) $form);

        return match (true) {
            Str::contains($f, ['tablet', 'capsule', 'caplet']) => ['Box', 'Strip', 10],
            Str::contains($f, ['injection', 'infusion', 'vaccine', 'vial', 'ampoule']) => ['Box', 'Vial', 1],
            Str::contains($f, ['cream', 'ointment', 'gel', 'lotion', 'paste']) => ['Tube', 'Tube', 1],
            Str::contains($f, ['inhaler', 'spray', 'rotacap']) => ['Inhaler Device', 'Inhaler Device', 1],
            Str::contains($f, ['syrup', 'suspension', 'solution', 'drops', 'elixir', 'mouth wash', 'shampoo', 'emulsion']) => ['Bottle', 'Bottle', 1],
            Str::contains($f, ['sachet', 'saline', 'powder', 'granule']) => ['Box', 'Piece / Tablet', 1],
            default => ['Box', 'Piece / Tablet', 1],
        };
    }

    private function uniqueSku(DrugCatalogItem $item): string
    {
        $base = 'DGDA-'.(preg_replace('/[^A-Za-z0-9-]/', '', (string) $item->dar_number) ?: Str::upper(Str::random(8)));
        $sku = $base;
        $n = 1;
        while (Medicine::where('sku', $sku)->exists()) {
            $sku = $base.'-'.(++$n);
        }

        return $sku;
    }

    private static function dedupeKey(string $name, ?string $form): string
    {
        return mb_strtolower(trim($name)).'|'.mb_strtolower(trim((string) $form));
    }

    private static function clean(mixed $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', (string) $value) ?? '');
    }
}
