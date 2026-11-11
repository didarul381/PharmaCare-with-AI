<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesLedgerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function saleWithPrescription(bool $controlled = false): Sale
    {
        $pharmacist = User::where('role', 'pharmacist')->firstOrFail();
        $medicine = Medicine::whereHas('batches')->firstOrFail();
        $medicine->update(['is_controlled_substance' => $controlled]);
        $batch = Batch::where('medicine_id', $medicine->id)->firstOrFail();

        $rx = Prescription::create([
            'prescription_number' => 'RX-TEST-1',
            'user_id' => $pharmacist->id,
            'doctor_name' => 'Dr. Test Physician',
            'status' => 'dispensed',
        ]);

        $sale = Sale::create([
            'invoice_number' => 'INV-TEST-0001',
            'user_id' => $pharmacist->id,
            'prescription_id' => $rx->id,
            'subtotal' => 100, 'grand_total' => 105, 'tax_percentage' => 5, 'tax_amount' => 5,
            'paid_amount' => 105, 'due_amount' => 0,
            'payment_method' => 'cash', 'payment_status' => 'paid',
        ]);

        SaleItem::create([
            'sale_id' => $sale->id, 'medicine_id' => $medicine->id, 'batch_id' => $batch->id,
            'unit_name' => 'Strip', 'quantity' => 1, 'unit_price' => 100, 'cost_price' => 80,
            'total_price' => 100,
        ]);

        return $sale;
    }

    public function test_invoices_page_loads_when_a_sale_is_linked_to_a_prescription(): void
    {
        $this->saleWithPrescription();

        $this->actingAs(User::where('role', 'pharmacist')->first())
            ->get('/invoices')
            ->assertOk();
    }

    public function test_controlled_drug_report_shows_the_prescribing_doctor(): void
    {
        $this->saleWithPrescription(controlled: true);

        $response = $this->actingAs(User::where('role', 'super_admin')->first())
            ->get('/reports?range=today')
            ->assertOk();

        $items = collect($response->viewData('page')['props']['controlled_items'] ?? []);
        $this->assertTrue($items->contains(fn ($i) => ($i['doctor_name'] ?? null) === 'Dr. Test Physician'));
    }

    public function test_invoices_are_paginated(): void
    {
        $this->actingAs(User::where('role', 'super_admin')->first())
            ->get('/invoices')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('pagination.total')->has('pagination.last_page'));
    }

    public function test_zero_vat_setting_is_kept(): void
    {
        StoreSetting::getSettings()->update(['default_tax_rate' => 0]);

        $this->actingAs(User::where('role', 'super_admin')->first())
            ->get('/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('settings.default_tax_rate', fn ($v) => (float) $v === 0.0));
    }
}
