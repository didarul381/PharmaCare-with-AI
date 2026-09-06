<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Batch;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Customer;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Exception;
use Carbon\Carbon;

class PosService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Process POS Checkout atomically.
     *
     * @param array $cartItems Array of ['medicine_id' => int, 'quantity' => int, 'unit_name' => string, 'unit_price' => float, 'discount' => float]
     * @param array $paymentData ['method' => string, 'paid_amount' => float, 'customer_id' => ?int, 'discount_value' => float, 'discount_type' => string, 'tax_percentage' => float, 'notes' => ?string]
     * @param User $cashier
     * @return Sale
     * @throws Exception
     */
    public function processCheckout(array $cartItems, array $paymentData, User $cashier): Sale
    {
        return DB::transaction(function () use ($cartItems, $paymentData, $cashier) {
            $subtotal = 0;
            $itemsToCreate = [];

            // 1. Process each cart item and allocate FEFO batches
            foreach ($cartItems as $item) {
                $medicine = Medicine::with('batches')->findOrFail($item['medicine_id']);
                $qty = (int) $item['quantity'];

                // Deduct stock using FEFO batch strategy
                $allocations = $this->inventoryService->deductStockFEFO($medicine, $qty);

                foreach ($allocations as $alloc) {
                    $itemTotal = $alloc['quantity'] * (float) $alloc['unit_price'];
                    $subtotal += $itemTotal;

                    $itemsToCreate[] = [
                        'medicine_id' => $medicine->id,
                        'batch_id' => $alloc['batch_id'],
                        'unit_name' => $item['unit_name'] ?? 'Unit',
                        'quantity' => $alloc['quantity'],
                        'unit_price' => $alloc['unit_price'],
                        'cost_price' => $alloc['cost_price'],
                        'discount_amount' => $item['discount'] ?? 0,
                        'tax_amount' => 0,
                        'total_price' => $itemTotal - ($item['discount'] ?? 0),
                    ];
                }
            }

            // 2. Calculate discounts and taxes
            $discountType = $paymentData['discount_type'] ?? 'fixed';
            $discountValue = (float) ($paymentData['discount_value'] ?? 0);
            $discountAmount = $discountType === 'percentage' ? ($subtotal * ($discountValue / 100)) : $discountValue;
            
            $taxPercentage = (float) ($paymentData['tax_percentage'] ?? 0);
            $taxableAmount = max(0, $subtotal - $discountAmount);
            $taxAmount = $taxableAmount * ($taxPercentage / 100);

            $grandTotal = $taxableAmount + $taxAmount;
            $paidAmount = (float) ($paymentData['paid_amount'] ?? $grandTotal);
            $changeAmount = max(0, $paidAmount - $grandTotal);
            $dueAmount = max(0, $grandTotal - $paidAmount);

            $paymentStatus = 'paid';
            if ($dueAmount > 0) {
                $paymentStatus = $paidAmount > 0 ? 'partial' : 'unpaid';
            }

            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

            // 3. Create Sale record
            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'customer_id' => $paymentData['customer_id'] ?? null,
                'user_id' => $cashier->id,
                'prescription_id' => $paymentData['prescription_id'] ?? null,
                'subtotal' => $subtotal,
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
                'discount_amount' => $discountAmount,
                'tax_percentage' => $taxPercentage,
                'tax_amount' => $taxAmount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'due_amount' => $dueAmount,
                'payment_method' => $paymentData['method'] ?? 'cash',
                'payment_status' => $paymentStatus,
                'notes' => $paymentData['notes'] ?? null,
            ]);

            // 4. Save items
            foreach ($itemsToCreate as $itemData) {
                $sale->items()->create($itemData);
            }

            // 5. Record payment breakdown
            if ($paidAmount > 0) {
                SalePayment::create([
                    'sale_id' => $sale->id,
                    'payment_method' => $paymentData['method'] ?? 'cash',
                    'amount' => min($paidAmount, $grandTotal),
                    'transaction_reference' => $paymentData['transaction_reference'] ?? null,
                    'created_at' => Carbon::now(),
                ]);
            }

            // 6. Update Customer ledger & Loyalty points if customer exists
            if (!empty($paymentData['customer_id'])) {
                $customer = Customer::find($paymentData['customer_id']);
                if ($customer) {
                    if ($dueAmount > 0) {
                        $customer->total_credit += $dueAmount;
                    }
                    // 1 loyalty point per 100 currency units spent
                    $pointsEarned = (int) floor($grandTotal / 100);
                    $customer->loyalty_points += $pointsEarned;
                    $customer->save();
                }
            }

            // 7. Regulatory Audit Trail for Dispensing
            $hasControlledSubstances = false;
            $controlledDetails = [];

            foreach ($itemsToCreate as $itemData) {
                $med = Medicine::find($itemData['medicine_id']);
                if ($med && $med->is_controlled_substance) {
                    $hasControlledSubstances = true;
                    $controlledDetails[] = [
                        'medicine_name' => $med->name,
                        'brand_name' => $med->brand_name,
                        'sku' => $med->sku,
                        'quantity' => $itemData['quantity'],
                        'batch_id' => $itemData['batch_id'],
                    ];
                }
            }

            // High-priority regulatory audit log for Controlled Narcotics & Substances
            if ($hasControlledSubstances) {
                AuditLog::create([
                    'user_id' => $cashier->id,
                    'action' => 'controlled_substance_dispensed',
                    'entity_type' => 'Sale',
                    'entity_id' => $sale->id,
                    'old_values' => [
                        'narcotic_protocol' => 'DGDA / Schedule-II Controlled Dispensation Protocol',
                        'customer' => $sale->customer?->name ?? 'Walk-in Customer',
                    ],
                    'new_values' => [
                        'invoice_number' => $invoiceNumber,
                        'controlled_substances' => $controlledDetails,
                        'dispensed_by' => $cashier->name . ' (' . ucfirst(str_replace('_', ' ', $cashier->role)) . ')',
                        'timestamp' => Carbon::now()->toIso8601String(),
                    ],
                    'ip_address' => request()->ip() ?? '127.0.0.1',
                    'user_agent' => request()->userAgent() ?? 'POS Terminal',
                    'created_at' => Carbon::now(),
                ]);
            }

            // General sale audit trail
            AuditLog::create([
                'user_id' => $cashier->id,
                'action' => 'pos_sale_dispense',
                'entity_type' => 'Sale',
                'entity_id' => $sale->id,
                'old_values' => null,
                'new_values' => [
                    'invoice_number' => $invoiceNumber,
                    'items_count' => count($itemsToCreate),
                    'grand_total' => $grandTotal,
                    'payment_method' => $paymentData['method'] ?? 'cash',
                    'has_controlled_substance' => $hasControlledSubstances,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'POS Terminal',
                'created_at' => Carbon::now(),
            ]);

            return $sale->load(['items.medicine', 'items.batch', 'customer', 'user', 'payments']);
        });
    }
}
