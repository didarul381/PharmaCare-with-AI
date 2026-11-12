<?php

namespace App\Http\Controllers;

use App\Models\DrugCatalogItem;
use App\Models\Medicine;
use App\Services\DgdaCatalogService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Browse the national DGDA drug catalogue and add products to the pharmacy's inventory.
 */
class DrugCatalogController extends Controller
{
    /** Upper limit for one "add all matching" click. */
    public const MAX_BULK_ADD = 1000;

    public function __construct(protected DgdaCatalogService $catalog) {}

    public function index(Request $request): Response
    {
        $filters = $this->filters($request);
        $items = $this->rankBySearch($this->filteredQuery($filters), $filters['search'])
            ->orderBy('trade_name')
            ->orderBy('strength')
            ->paginate(50)
            ->withQueryString();

        $inInventory = Medicine::where('is_active', true)
            ->whereIn('catalog_code', collect($items->items())->pluck('code'))
            ->pluck('catalog_code')
            ->flip();

        $total = DrugCatalogItem::count();

        return Inertia::render('Inventory/Catalog', [
            'items' => collect($items->items())->map(fn (DrugCatalogItem $i) => [
                'code' => $i->code,
                'dar_number' => $i->dar_number,
                'name' => $i->displayName(),
                'trade_name' => $i->trade_name,
                'generic' => $i->generic,
                'strength' => $i->strength,
                'dosage_form' => $i->dosage_form,
                'company' => $i->company,
                'in_inventory' => isset($inInventory[$i->code]),
            ]),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'total' => $items->total(),
                'from' => $items->firstItem(),
                'to' => $items->lastItem(),
                'prev_url' => $items->previousPageUrl(),
                'next_url' => $items->nextPageUrl(),
            ],
            'filters' => $filters,
            'options' => [
                'companies' => $total ? DrugCatalogItem::whereNotNull('company')->distinct()->orderBy('company')->pluck('company') : [],
                'forms' => $total ? DrugCatalogItem::whereNotNull('dosage_form')->distinct()->orderBy('dosage_form')->pluck('dosage_form') : [],
            ],
            'stats' => [
                'total' => $total,
                'in_inventory' => Medicine::whereNotNull('catalog_code')->where('is_active', true)->count(),
                'last_synced_at' => DrugCatalogItem::max('updated_at'),
            ],
            'max_bulk_add' => self::MAX_BULK_ADD,
        ]);
    }

    /**
     * Download one page from the DGHS server. The page calls this repeatedly
     * (page 1, 2, … pages) to show progress; works on shared hosting without a queue.
     */
    public function sync(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->input('page', 1));
        @set_time_limit(180);

        try {
            $result = $this->catalog->syncPage($page);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['success' => false, 'message' => $e->getMessage()], 502);
        }

        return response()->json(['success' => true] + $result + ['catalog_total' => DrugCatalogItem::count()]);
    }

    /**
     * Add selected catalogue entries (or every entry matching the current filters) as medicines.
     */
    public function add(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'codes' => ['array', 'max:'.self::MAX_BULK_ADD],
            'codes.*' => ['string', 'max:191'],
            'all_matching' => ['boolean'],
        ]);

        if (! empty($validated['all_matching'])) {
            $items = $this->filteredQuery($this->filters($request))
                ->whereNotIn('code', Medicine::whereNotNull('catalog_code')->where('is_active', true)->select('catalog_code'))
                ->orderBy('trade_name')
                ->limit(self::MAX_BULK_ADD)
                ->get();
        } else {
            $items = DrugCatalogItem::whereIn('code', $validated['codes'] ?? [])->get();
        }

        if ($items->isEmpty()) {
            return back()->with('info', 'Nothing to add — select at least one medicine that is not already in your inventory.');
        }

        @set_time_limit(300);
        $result = $this->catalog->addToInventory($items, $request->user());

        if ($result['added'] === 0 && $result['restored'] === 0) {
            return back()->with('info', 'Those medicines are already in your inventory.');
        }

        $message = "Added {$result['added']} medicine".($result['added'] === 1 ? '' : 's').' to your inventory.';
        if ($result['restored'] > 0) {
            $message .= " Restored {$result['restored']} archived.";
        }
        if ($result['skipped'] > 0) {
            $message .= " Skipped {$result['skipped']} already in your inventory (or with the same name and form).";
        }
        if ($result['added'] + $result['restored'] > 0) {
            $message .= ' Add stock (batch, expiry, price) to start selling them.';
        }

        return back()->with('success', $message);
    }

    /**
     * Quick lookup for search-as-you-type fields.
     */
    public function search(Request $request): JsonResponse
    {
        $term = trim((string) $request->input('q'));
        if (mb_strlen($term) < 2) {
            return response()->json([]);
        }

        return response()->json(
            $this->rankBySearch(DrugCatalogItem::search($term), $term)->orderBy('trade_name')->limit(15)->get()
                ->map(fn (DrugCatalogItem $i) => [
                    'code' => $i->code,
                    'name' => $i->displayName(),
                    'generic' => $i->generic,
                    'strength' => $i->strength,
                    'dosage_form' => $i->dosage_form,
                    'company' => $i->company,
                ]),
        );
    }

    /**
     * @return array{search: ?string, company: ?string, form: ?string, status: string}
     */
    private function filters(Request $request): array
    {
        $status = $request->input('status');

        return [
            'search' => $request->input('search') ?: null,
            'company' => $request->input('company') ?: null,
            'form' => $request->input('form') ?: null,
            'status' => in_array($status, ['new', 'added'], true) ? $status : 'all',
        ];
    }

    /**
     * Brands starting with the search text first ("napa" → Napa…, before Bonapart),
     * then generics starting with it, then everything else that contains it.
     */
    private function rankBySearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);
        if ($term === '') {
            return $query;
        }

        return $query->orderByRaw(
            'CASE WHEN trade_name LIKE ? THEN 0 WHEN generic LIKE ? THEN 1 ELSE 2 END',
            ["{$term}%", "{$term}%"],
        );
    }

    private function filteredQuery(array $filters): Builder
    {
        $linked = Medicine::whereNotNull('catalog_code')->where('is_active', true)->select('catalog_code');

        return DrugCatalogItem::query()
            ->search($filters['search'])
            ->when($filters['company'], fn ($q, $c) => $q->where('company', $c))
            ->when($filters['form'], fn ($q, $f) => $q->where('dosage_form', $f))
            ->when($filters['status'] === 'new', fn ($q) => $q->whereNotIn('code', $linked))
            ->when($filters['status'] === 'added', fn ($q) => $q->whereIn('code', $linked));
    }
}
