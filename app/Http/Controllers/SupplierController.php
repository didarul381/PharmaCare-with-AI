<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\GoodsReceiptNote;
use App\Models\Medicine;
use App\Models\Batch;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    public function index(): Response
    {
        // Active first, then inactive (so they can be reactivated), each alphabetical.
        $suppliers = Supplier::withCount(['purchaseOrders', 'goodsReceiptNotes'])
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        $purchaseOrders = PurchaseOrder::with(['supplier', 'user', 'items.medicine'])
            ->latest()
            ->get();

        $goodsReceiptNotes = GoodsReceiptNote::with(['supplier', 'purchaseOrder', 'receivedBy'])
            ->latest()
            ->get();

        // Picker list only — light columns, no stock accessors (avoids per-row queries on big catalogues).
        $medicines = Medicine::where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku', 'strength'])->each->setAppends([]);

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'purchase_orders' => $purchaseOrders,
            'goods_receipt_notes' => $goodsReceiptNotes,
            'medicines' => $medicines,
        ]);
    }

    public function storeOrder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'supplier_id' => ['required', \Illuminate\Validation\Rule::exists('suppliers', 'id')->where('is_active', true)],
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $user = $request->user();
        $poNumber = 'PO-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        DB::transaction(function () use ($validated, $user, $poNumber) {
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += ($item['quantity_ordered'] * $item['unit_cost']);
            }

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'supplier_id' => $validated['supplier_id'],
                'user_id' => $user->id,
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status' => 'pending',
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'medicine_id' => $item['medicine_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $item['quantity_ordered'] * $item['unit_cost'],
                ]);
            }
        });

        return redirect()->back()->with('success', "Purchase Order {$poNumber} created successfully.");
    }

    public function receiveGRN(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $validated = $request->validate([
            'supplier_invoice_number' => 'nullable|string',
            'remarks' => 'nullable|string',
            'batches' => 'required|array|min:1',
            'batches.*.medicine_id' => 'required|exists:medicines,id',
            'batches.*.batch_number' => 'required|string',
            'batches.*.expiry_date' => 'required|date|after:today',
            'batches.*.received_quantity' => 'required|integer|min:1',
            'batches.*.cost_price' => 'required|numeric|min:0',
            'batches.*.selling_price' => 'required|numeric|min:0',
        ]);

        $user = $request->user();
        $grnNumber = 'GRN-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        DB::transaction(function () use ($validated, $order, $user, $grnNumber) {
            $grnTotal = 0;

            foreach ($validated['batches'] as $b) {
                $grnTotal += ($b['received_quantity'] * $b['cost_price']);

                // Create new batch in inventory
                Batch::create([
                    'medicine_id' => $b['medicine_id'],
                    'batch_number' => $b['batch_number'],
                    'expiry_date' => $b['expiry_date'],
                    'cost_price' => $b['cost_price'],
                    'selling_price' => $b['selling_price'],
                    'initial_quantity' => $b['received_quantity'],
                    'current_quantity' => $b['received_quantity'],
                    'supplier_id' => $order->supplier_id,
                    'is_active' => true,
                ]);

                // Update PO Item received quantity
                $poItem = PurchaseOrderItem::where('purchase_order_id', $order->id)
                    ->where('medicine_id', $b['medicine_id'])
                    ->first();

                if ($poItem) {
                    $poItem->quantity_received += $b['received_quantity'];
                    $poItem->save();
                }
            }

            // Create GRN
            GoodsReceiptNote::create([
                'grn_number' => $grnNumber,
                'purchase_order_id' => $order->id,
                'supplier_id' => $order->supplier_id,
                'received_by_user_id' => $user->id,
                'supplier_invoice_number' => $validated['supplier_invoice_number'] ?? null,
                'received_date' => Carbon::now()->toDateString(),
                'total_amount' => $grnTotal,
                'remarks' => $validated['remarks'] ?? 'Received and batches added to inventory.',
            ]);

            $order->update(['status' => 'received']);
        });

        return redirect()->back()->with('success', "GRN {$grnNumber} processed and inventory batches added successfully!");
    }

    /*
    |--------------------------------------------------------------------------
    | Supplier management (add / edit / delete-or-deactivate / reactivate)
    |--------------------------------------------------------------------------
    */

    public function storeSupplier(Request $request): RedirectResponse
    {
        $data = $this->validateSupplier($request);
        $data['company_code'] = ($data['company_code'] ?? null) ?: $this->nextSupplierCode($data['name']);

        $supplier = Supplier::create($data + ['is_active' => true, 'total_payable' => 0, 'total_paid' => 0]);
        $this->audit($request, 'supplier_created', $supplier, null, $supplier->only(['name', 'company_code', 'phone']));

        return back()->with('success', "Supplier {$supplier->name} added.");
    }

    public function updateSupplier(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $this->validateSupplier($request, $supplier);
        $data['company_code'] = ($data['company_code'] ?? null) ?: $supplier->company_code;

        $old = $supplier->only(array_keys($data));
        $supplier->update($data);
        $this->audit($request, 'supplier_updated', $supplier, $old, $supplier->only(array_keys($data)));

        return back()->with('success', "Supplier {$supplier->name} updated.");
    }

    /**
     * Deletes a supplier with no purchase history. One that has purchase orders or
     * goods receipts is deactivated instead, so past records stay intact.
     */
    public function destroySupplier(Request $request, Supplier $supplier): RedirectResponse
    {
        $hasHistory = $supplier->purchaseOrders()->exists() || $supplier->goodsReceiptNotes()->exists();

        if ($hasHistory) {
            $supplier->update(['is_active' => false]);
            $this->audit($request, 'supplier_deactivated', $supplier, ['is_active' => true], ['is_active' => false]);

            return back()->with('info', "{$supplier->name} has purchase history, so it was deactivated instead of deleted. It no longer appears in new purchase orders.");
        }

        $snapshot = $supplier->only(['name', 'company_code', 'phone']);
        $supplier->delete();
        $this->audit($request, 'supplier_deleted', $supplier, $snapshot, null);

        return back()->with('success', "Supplier {$snapshot['name']} deleted.");
    }

    public function activateSupplier(Request $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update(['is_active' => true]);
        $this->audit($request, 'supplier_reactivated', $supplier, ['is_active' => false], ['is_active' => true]);

        return back()->with('success', "{$supplier->name} is active again.");
    }

    /**
     * @return array<string, mixed>
     */
    private function validateSupplier(Request $request, ?Supplier $supplier = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'company_code' => [
                'nullable', 'string', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/',
                \Illuminate\Validation\Rule::unique('suppliers', 'company_code')->ignore($supplier?->id),
            ],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'tax_registration_number' => ['nullable', 'string', 'max:100'],
        ], [
            'company_code.unique' => 'Another supplier already uses this code.',
            'company_code.regex' => 'Use letters, numbers, - or _ only (e.g. ACME-01).',
        ]);
    }

    /** e.g. "Acme Pharma" → ACM-001, ACM-002 … */
    private function nextSupplierCode(string $name): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name) ?: 'SUP', 0, 3));
        $prefix = str_pad($prefix, 3, 'X');
        $n = 1;
        do {
            $code = sprintf('%s-%03d', $prefix, $n++);
        } while (Supplier::where('company_code', $code)->exists());

        return $code;
    }

    private function audit(Request $request, string $action, Supplier $supplier, ?array $old, ?array $new): void
    {
        \App\Models\AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'entity_type' => 'Supplier',
            'entity_id' => $supplier->id,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);
    }
}
