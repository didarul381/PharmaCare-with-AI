<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Customer;
use App\Models\Category;
use App\Models\Sale;
use App\Services\PosService;
use App\Services\Ai\DrugInteractionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class PosController extends Controller
{
    public function __construct(
        protected PosService $posService,
        protected DrugInteractionService $interactionService
    ) {}

    public function index(): Response
    {
        $medicines = Medicine::with([
            'category',
            'genericName',
            'dosageForm',
            'primaryUnit',
            'secondaryUnit',
            'batches' => function ($q) {
                $q->activeFefo();
            },
        ])
        ->where('is_active', true)
        ->get()
        ->map(function ($med) {
            $earliestBatch = $med->batches->first();
            return [
                'id' => $med->id,
                'name' => $med->name,
                'brand_name' => $med->brand_name,
                'sku' => $med->sku,
                'barcode' => $med->barcode,
                'category' => $med->category?->name,
                'generic_name' => $med->genericName?->name,
                'dosage_form' => $med->dosageForm?->name,
                'strength' => $med->strength,
                'unit_name' => $med->secondaryUnit?->name ?? 'Strip',
                'primary_unit' => $med->primaryUnit?->name ?? 'Box',
                'unit_conversion_rate' => $med->unit_conversion_rate,
                'total_stock' => $med->total_stock,
                'selling_price' => $earliestBatch ? (float) $earliestBatch->selling_price : 0.00,
                'cost_price' => $earliestBatch ? (float) $earliestBatch->cost_price : 0.00,
                'earliest_batch' => $earliestBatch ? [
                    'id' => $earliestBatch->id,
                    'batch_number' => $earliestBatch->batch_number,
                    'expiry_date' => $earliestBatch->expiry_date->toDateString(),
                    'days_remaining' => $earliestBatch->days_until_expiry,
                    'expiry_status' => $earliestBatch->expiry_status,
                ] : null,
                'is_rx_required' => $med->is_prescription_required,
                'is_controlled' => $med->is_controlled_substance,
            ];
        });

        $customers = Customer::all();
        $categories = Category::where('is_active', true)->get();
        $storeSettings = \App\Models\StoreSetting::getSettings();

        return Inertia::render('Pos/Index', [
            'medicines' => $medicines,
            'customers' => $customers,
            'categories' => $categories,
            'store_settings' => $storeSettings,
        ]);
    }

    public function lookupBarcode(Request $request): JsonResponse
    {
        $barcode = $request->query('barcode');
        $medicine = Medicine::with([
            'genericName',
            'dosageForm',
            'batches' => function ($q) {
                $q->activeFefo();
            },
        ])
        ->where('barcode', $barcode)
        ->orWhere('sku', $barcode)
        ->first();

        if (!$medicine) {
            return response()->json(['found' => false, 'message' => 'No medicine matched this barcode/SKU'], 404);
        }

        $earliestBatch = $medicine->batches->first();

        return response()->json([
            'found' => true,
            'medicine' => [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'sku' => $medicine->sku,
                'barcode' => $medicine->barcode,
                'selling_price' => $earliestBatch ? (float) $earliestBatch->selling_price : 0.00,
                'total_stock' => $medicine->total_stock,
                'earliest_batch' => $earliestBatch ? [
                    'id' => $earliestBatch->id,
                    'batch_number' => $earliestBatch->batch_number,
                    'expiry_date' => $earliestBatch->expiry_date->toDateString(),
                    'days_remaining' => $earliestBatch->days_until_expiry,
                ] : null,
            ],
        ]);
    }

    public function checkCartSafety(Request $request): JsonResponse
    {
        $medicineIds = $request->input('medicine_ids', []);
        $result = $this->interactionService->checkInteractions($medicineIds);
        return response()->json($result);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.medicine_id' => 'required|exists:medicines,id',
            'cart.*.quantity' => 'required|integer|min:1',
            'cart.*.unit_name' => 'nullable|string',
            'cart.*.unit_price' => 'nullable|numeric',
            'cart.*.discount' => 'nullable|numeric',
            'payment.method' => 'required|string',
            'payment.paid_amount' => 'nullable|numeric|min:0',
            'payment.customer_id' => 'nullable|exists:customers,id',
            'payment.discount_type' => 'nullable|in:percentage,fixed',
            'payment.discount_value' => 'nullable|numeric|min:0',
            'payment.tax_percentage' => 'nullable|numeric|min:0',
            'payment.notes' => 'nullable|string',
            'payment.prescription_id' => 'nullable|exists:prescriptions,id',
        ]);

        try {
            $cashier = $request->user() ?? \App\Models\User::first();
            $sale = $this->posService->processCheckout(
                $validated['cart'],
                $validated['payment'],
                $cashier
            );

            return response()->json([
                'success' => true,
                'message' => "Invoice {$sale->invoice_number} generated successfully.",
                'sale' => $sale,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
