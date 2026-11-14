<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function manager(): User
    {
        return User::where('role', 'inventory_manager')->firstOrFail();
    }

    private function orderFor(Supplier $supplier): PurchaseOrder
    {
        return PurchaseOrder::create([
            'po_number' => 'PO-TEST-'.$supplier->id,
            'supplier_id' => $supplier->id,
            'user_id' => $this->manager()->id,
            'order_date' => now()->toDateString(),
            'status' => 'pending',
            'total_amount' => 100,
            'paid_amount' => 0,
        ]);
    }

    public function test_supplier_can_be_added_with_an_automatic_code(): void
    {
        $this->actingAs($this->manager())
            ->post('/suppliers', ['name' => 'Rahman Pharma Distribution', 'phone' => '01711-000000'])
            ->assertSessionHas('success');

        $supplier = Supplier::where('name', 'Rahman Pharma Distribution')->firstOrFail();
        $this->assertSame('RAH-001', $supplier->company_code);
        $this->assertTrue($supplier->is_active);
    }

    public function test_supplier_code_must_be_unique(): void
    {
        $this->actingAs($this->manager())
            ->post('/suppliers', ['name' => 'Copycat', 'company_code' => 'SQR-001'])
            ->assertSessionHasErrors('company_code');
    }

    public function test_supplier_can_be_edited(): void
    {
        $supplier = Supplier::where('company_code', 'SQR-001')->firstOrFail();

        $this->actingAs($this->manager())
            ->put("/suppliers/{$supplier->id}", ['name' => 'Square (Dhaka depot)', 'company_code' => 'SQR-001', 'phone' => '0123'])
            ->assertSessionHas('success');

        $this->assertSame('Square (Dhaka depot)', $supplier->fresh()->name);
        $this->assertSame('0123', $supplier->fresh()->phone);
    }

    public function test_supplier_without_history_is_deleted(): void
    {
        $supplier = Supplier::where('company_code', 'PFZ-006')->firstOrFail();

        $this->actingAs($this->manager())->delete("/suppliers/{$supplier->id}")->assertSessionHas('success');

        $this->assertDatabaseMissing('suppliers', ['id' => $supplier->id]);
    }

    public function test_supplier_with_purchase_history_is_deactivated_and_can_be_reactivated(): void
    {
        $supplier = Supplier::where('company_code', 'REN-004')->firstOrFail();
        $this->orderFor($supplier);

        $this->actingAs($this->manager())->delete("/suppliers/{$supplier->id}")->assertSessionHas('info');
        $this->assertFalse($supplier->fresh()->is_active);
        $this->assertDatabaseHas('purchase_orders', ['supplier_id' => $supplier->id]);

        // An inactive supplier can't receive new purchase orders
        $this->post('/suppliers/orders', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [['medicine_id' => Medicine::first()->id, 'quantity_ordered' => 10, 'unit_cost' => 5]],
        ])->assertSessionHasErrors('supplier_id');

        $this->patch("/suppliers/{$supplier->id}/activate")->assertSessionHas('success');
        $this->assertTrue($supplier->fresh()->is_active);
    }

    public function test_cashier_cannot_manage_suppliers(): void
    {
        $this->actingAs(User::where('role', 'cashier')->firstOrFail())
            ->post('/suppliers', ['name' => 'Nope'])
            ->assertForbidden();
    }

    public function test_demo_mode_blocks_supplier_deletion(): void
    {
        config(['pharmacare.demo_mode' => true]);
        $supplier = Supplier::where('company_code', 'PFZ-006')->firstOrFail();

        $this->actingAs($this->manager())
            ->from('/suppliers')
            ->delete("/suppliers/{$supplier->id}", [], ['X-Inertia' => 'true'])
            ->assertSessionHas('warning');

        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id]);
    }
}
