<?php

namespace Tests\Feature;

use App\Models\DrugCatalogItem;
use App\Models\Medicine;
use App\Models\User;
use App\Services\DgdaCatalogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DrugCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function concept(string $id, string $trade, string $raw, string $form = 'Tablet', string $company = 'Square Pharmaceuticals PLC', string $class = 'Drug'): array
    {
        return [
            'id' => $id,
            'concept_class' => $class,
            'retired' => false,
            'display_name' => $trade,
            'extras' => [
                'company' => $company,
                'dar_number' => explode('--', $id)[0],
                'trade_name' => $trade,
                'dosage_form' => $form,
                'dar_quality_flag' => '',
                'generic_content_raw' => $raw,
            ],
        ];
    }

    private function fakeServer(): void
    {
        Http::fake([
            config('pharmacare.dgda_catalog_url').'*' => Http::response([
                $this->concept('032-0101-022--zyprocet', 'Zyprocet', 'Cetirizine Hydrochloride  10 mg'),
                $this->concept('116-1007-071--mooverix', 'Mooverix', 'Camphor + Menthol + Methyl Salicylate  4 gm + 10 gm + 30 gm/100 gm', 'Cream', 'Incepta Pharmaceuticals Ltd.'),
                $this->concept('002-0124-034--pyrantel', 'Pyrantel', 'Pyrantel Pamoate  100 %', 'Raw Materials', 'Renata PLC', 'Ingredient'),
            ], 200, ['num_found' => '3', 'pages' => '1']),
        ]);
    }

    private function user(string $role): User
    {
        return User::where('role', $role)->firstOrFail();
    }

    public function test_parser_splits_generic_and_strength_and_skips_raw_materials(): void
    {
        $row = DgdaCatalogService::parse($this->concept('116-1007-071--mooverix', 'Mooverix', 'Camphor + Menthol  4 gm + 10 gm/100 gm', 'Cream'));

        $this->assertSame('Camphor + Menthol', $row['generic']);
        $this->assertSame('4 gm + 10 gm/100 gm', $row['strength']);
        $this->assertSame('116-1007-071', $row['dar_number']);
        $this->assertNull(DgdaCatalogService::parse($this->concept('x--y', 'Y', 'Y  100 %', 'Raw Materials', 'Z', 'Ingredient')));
    }

    public function test_sync_downloads_and_upserts_the_catalogue(): void
    {
        $this->fakeServer();

        $this->artisan('pharmacare:sync-dgda')->assertSuccessful();
        $this->artisan('pharmacare:sync-dgda')->assertSuccessful(); // idempotent

        $this->assertSame(2, DrugCatalogItem::count());
        $item = DrugCatalogItem::where('trade_name', 'Zyprocet')->first();
        $this->assertSame('Cetirizine Hydrochloride', $item->generic);
        $this->assertSame('Zyprocet 10 mg', $item->displayName());
    }

    public function test_browser_sync_returns_progress_json(): void
    {
        $this->fakeServer();

        $this->actingAs($this->user('inventory_manager'))
            ->postJson('/inventory/catalog/sync', ['page' => 1])
            ->assertOk()
            ->assertJson(['success' => true, 'page' => 1, 'pages' => 1, 'synced' => 2]);
    }

    public function test_adding_from_catalogue_creates_linked_medicines_without_duplicates(): void
    {
        $this->fakeServer();
        $this->artisan('pharmacare:sync-dgda');
        $codes = DrugCatalogItem::pluck('code')->all();

        $this->actingAs($this->user('pharmacist'))
            ->post('/inventory/catalog/add', ['codes' => $codes])
            ->assertRedirect()
            ->assertSessionHas('success');

        $med = Medicine::where('catalog_code', '032-0101-022--zyprocet')->with(['genericName', 'manufacturer', 'dosageForm', 'secondaryUnit'])->firstOrFail();
        $this->assertSame('Zyprocet 10 mg', $med->name);
        $this->assertSame('Cetirizine Hydrochloride', $med->genericName->name);
        $this->assertSame('Square Pharmaceuticals PLC', $med->manufacturer->name);
        $this->assertSame('Tablet', $med->dosageForm->name);
        $this->assertSame('Strip', $med->secondaryUnit->name);
        $this->assertStringStartsWith('DGDA-032-0101-022', $med->sku);

        // Adding again skips existing ones
        $this->post('/inventory/catalog/add', ['codes' => $codes])->assertSessionHas('info');
        $this->assertSame(2, Medicine::whereNotNull('catalog_code')->count());
    }

    public function test_same_name_is_deduplicated_per_dosage_form(): void
    {
        Http::fake([
            config('pharmacare.dgda_catalog_url').'*' => Http::response([
                $this->concept('012-0252-067--seclo', 'Seclo', 'Omeprazole  20 mg', 'Capsule'),
                $this->concept('321-0035-067--seclo', 'Seclo', 'Omeprazole  20 mg', 'Capsule'), // other site, same product
                $this->concept('012-9999-067--seclo', 'Seclo', 'Omeprazole  20 mg', 'Injection'), // different form
            ], 200, ['num_found' => '3', 'pages' => '1']),
        ]);
        $this->artisan('pharmacare:sync-dgda');

        $this->actingAs($this->user('pharmacist'))
            ->post('/inventory/catalog/add', ['codes' => DrugCatalogItem::pluck('code')->all()])
            ->assertSessionHas('success');

        $this->assertSame(2, Medicine::where('name', 'Seclo 20 mg')->count());
    }

    public function test_re_adding_an_archived_catalogue_medicine_restores_it(): void
    {
        $this->fakeServer();
        $this->artisan('pharmacare:sync-dgda');
        $code = '032-0101-022--zyprocet';
        $this->actingAs($this->user('pharmacist'))->post('/inventory/catalog/add', ['codes' => [$code]]);
        $med = Medicine::where('catalog_code', $code)->firstOrFail();
        $med->update(['is_active' => false]); // archived

        $this->post('/inventory/catalog/add', ['codes' => [$code]])->assertSessionHas('success');

        $this->assertTrue($med->fresh()->is_active);
        $this->assertSame(1, Medicine::where('catalog_code', $code)->count());
    }

    public function test_add_all_matching_respects_filters(): void
    {
        $this->fakeServer();
        $this->artisan('pharmacare:sync-dgda');

        $this->actingAs($this->user('super_admin'))
            ->post('/inventory/catalog/add', ['all_matching' => true, 'form' => 'Cream'])
            ->assertSessionHas('success');

        $this->assertSame(['Mooverix'], Medicine::whereNotNull('catalog_code')->pluck('brand_name')->all());
    }

    public function test_imported_medicines_without_stock_stay_out_of_pos_and_low_stock(): void
    {
        $this->fakeServer();
        $this->artisan('pharmacare:sync-dgda');
        $admin = $this->user('super_admin');
        $before = app(\App\Services\InventoryService::class)->getInventoryMetrics()['low_stock_count'];

        $this->actingAs($admin)->post('/inventory/catalog/add', ['codes' => DrugCatalogItem::pluck('code')->all()]);

        $this->assertSame($before, app(\App\Services\InventoryService::class)->getInventoryMetrics()['low_stock_count']);

        $this->get('/pos')->assertOk()->assertInertia(fn ($page) => $page->where(
            'medicines',
            fn ($meds) => collect($meds)->pluck('name')->doesntContain('Zyprocet 10 mg'),
        ));

        $this->get('/inventory?filter_stock=no_stock')->assertOk()->assertInertia(fn ($page) => $page
            ->has('medicines_pagination.total')
            ->where('medicines', fn ($meds) => collect($meds)->pluck('name')->contains('Zyprocet 10 mg')));
    }

    public function test_catalogue_is_limited_to_inventory_roles(): void
    {
        $this->actingAs($this->user('cashier'))->get('/inventory/catalog')->assertForbidden();
        $this->actingAs($this->user('inventory_manager'))->get('/inventory/catalog')->assertOk();
    }

    public function test_demo_mode_blocks_catalogue_download(): void
    {
        config(['pharmacare.demo_mode' => true]);
        Http::fake();

        $this->actingAs($this->user('super_admin'))
            ->postJson('/inventory/catalog/sync', ['page' => 1])
            ->assertForbidden();

        Http::assertNothingSent();
    }
}
