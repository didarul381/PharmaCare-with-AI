<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Medicine;
use App\Models\Batch;
use App\Models\GenericName;
use App\Models\DrugInteraction;
use App\Models\Customer;
use App\Models\Sale;
use App\Services\InventoryService;
use App\Services\PosService;
use App\Services\Ai\DrugInteractionService;
use App\Services\Ai\DemandForecastService;
use Carbon\Carbon;

class PharmacyEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test FEFO (First Expired, First Out) batch deduction logic.
     */
    public function test_fefo_batch_deduction_depletes_earliest_expiring_batch_first(): void
    {
        $medicine = Medicine::where('sku', 'MED-NAP-001')->firstOrFail();
        
        // Retrieve initial active batches ordered by expiry
        $batches = $medicine->batches()->where('is_active', true)->orderBy('expiry_date', 'asc')->get();
        $this->assertGreaterThanOrEqual(2, $batches->count());

        $firstBatch = $batches[0];
        $secondBatch = $batches[1];
        $this->assertTrue($firstBatch->expiry_date->lt($secondBatch->expiry_date));

        $initialFirstQty = $firstBatch->current_quantity;
        $initialSecondQty = $secondBatch->current_quantity;

        // Request deduction greater than first batch quantity
        $deductQty = $initialFirstQty + 10;

        /** @var InventoryService $inventoryService */
        $inventoryService = app(InventoryService::class);
        $allocations = $inventoryService->deductStockFEFO($medicine, $deductQty);

        $this->assertCount(2, $allocations);
        $this->assertEquals($firstBatch->id, $allocations[0]['batch_id']);
        $this->assertEquals($initialFirstQty, $allocations[0]['quantity']);

        $this->assertEquals($secondBatch->id, $allocations[1]['batch_id']);
        $this->assertEquals(10, $allocations[1]['quantity']);

        // Assert database records reflect deduction
        $firstBatch->refresh();
        $secondBatch->refresh();

        $this->assertEquals(0, $firstBatch->current_quantity);
        $this->assertEquals($initialSecondQty - 10, $secondBatch->current_quantity);
    }

    /**
     * Test Drug-Drug Interaction Safety Shield detects hazardous combinations.
     */
    public function test_ddi_service_detects_severe_interaction_between_ciprofloxacin_and_antacid(): void
    {
        $cipro = Medicine::where('sku', 'MED-CIP-500')->firstOrFail();
        $antacid = Medicine::where('sku', 'MED-ANT-200')->firstOrFail();

        /** @var DrugInteractionService $ddiService */
        $ddiService = app(DrugInteractionService::class);
        $result = $ddiService->checkInteractions([$cipro->id, $antacid->id]);

        $this->assertTrue($result['has_interactions']);
        $this->assertEquals('severe', $result['max_severity']);
        $this->assertNotEmpty($result['interactions']);
        $this->assertStringContainsString('Ciprofloxacin', $result['interactions'][0]['generic_a']);
    }

    /**
     * Test POS Checkout process creates invoice and updates customer ledger.
     */
    public function test_pos_checkout_creates_sale_and_deducts_stock(): void
    {
        $cashier = User::where('role', 'cashier')->first() ?? User::firstOrFail();
        $customer = Customer::firstOrFail();
        $medicine = Medicine::where('sku', 'MED-NAP-002')->firstOrFail();

        $initialStock = $medicine->total_stock;

        $cart = [
            [
                'medicine_id' => $medicine->id,
                'quantity' => 5,
                'unit_name' => 'Strip',
                'unit_price' => $medicine->current_selling_price,
                'discount' => 0,
            ]
        ];

        $payment = [
            'method' => 'cash',
            'paid_amount' => 100.00,
            'customer_id' => $customer->id,
            'discount_type' => 'fixed',
            'discount_value' => 0,
            'tax_percentage' => 5.0,
            'notes' => 'Unit test transaction',
        ];

        /** @var PosService $posService */
        $posService = app(PosService::class);
        $sale = $posService->processCheckout($cart, $payment, $cashier);

        $this->assertNotNull($sale);
        $this->assertStringStartsWith('INV-', $sale->invoice_number);
        $this->assertEquals('paid', $sale->payment_status);
        $this->assertCount(1, $sale->items);

        $medicine->refresh();
        $this->assertEquals($initialStock - 5, $medicine->total_stock);
    }

    /**
     * Test AI Demand Forecasting Service.
     */
    public function test_ai_demand_forecasting_generates_seasonal_projections(): void
    {
        /** @var DemandForecastService $forecastService */
        $forecastService = app(DemandForecastService::class);
        $forecast = $forecastService->generateForecast();

        $this->assertNotEmpty($forecast['items']);
        $this->assertGreaterThan(0, $forecast['summary']['forecast_confidence']);

        $topItem = $forecast['items'][0];
        $this->assertArrayHasKey('monthly_forecast', $topItem);
        $this->assertCount(12, $topItem['monthly_forecast']);
        $this->assertArrayHasKey('suggested_order_qty', $topItem);
    }
}
