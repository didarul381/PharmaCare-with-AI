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
        $suppliers = Supplier::withCount('purchaseOrders')
            ->where('is_active', true)
            ->get();

        $purchaseOrders = PurchaseOrder::with(['supplier', 'user', 'items.medicine'])
            ->latest()
            ->get();

        $goodsReceiptNotes = GoodsReceiptNote::with(['supplier', 'purchaseOrder', 'receivedBy'])
            ->latest()
            ->get();

        $medicines = Medicine::where('is_active', true)->get();

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
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $user = $request->user() ?? \App\Models\User::first();
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

        $user = $request->user() ?? \App\Models\User::first();
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
}
