<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Batch;
use App\Models\Category;
use App\Models\GenericName;
use App\Models\Manufacturer;
use App\Models\DosageForm;
use App\Models\Unit;
use App\Models\StockAdjustment;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $genericId = $request->input('generic_id');
        $manufacturerId = $request->input('manufacturer_id');
        $filterExpiry = $request->input('filter_expiry'); // 'critical', 'warning', 'all'

        $medicinesQuery = Medicine::with([
            'category',
            'genericName',
            'manufacturer',
            'dosageForm',
            'primaryUnit',
            'secondaryUnit',
            'batches' => function ($q) {
                $q->where('is_active', true)->orderBy('expiry_date', 'asc');
            },
        ])->where('is_active', true);

        if ($search) {
            $medicinesQuery->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('brand_name', 'LIKE', "%{$search}%")
                  ->orWhere('sku', 'LIKE', "%{$search}%")
                  ->orWhere('barcode', 'LIKE', "%{$search}%")
                  ->orWhereHas('genericName', fn($g) => $g->where('name', 'LIKE', "%{$search}%"));
            });
        }

        if ($categoryId) {
            $medicinesQuery->where('category_id', $categoryId);
        }

        if ($genericId) {
            $medicinesQuery->where('generic_name_id', $genericId);
        }

        if ($manufacturerId) {
            $medicinesQuery->where('manufacturer_id', $manufacturerId);
        }

        $medicines = $medicinesQuery->get();

        // Get flat list of all active batches with FEFO status
        $batchesQuery = Batch::with(['medicine.genericName', 'medicine.dosageForm', 'supplier'])
            ->where('is_active', true)
            ->orderBy('expiry_date', 'asc');

        if ($filterExpiry === 'critical') {
            $batchesQuery->nearExpiry(30);
        } elseif ($filterExpiry === 'warning') {
            $batchesQuery->nearExpiry(90);
        }

        $batches = $batchesQuery->get();

        return Inertia::render('Inventory/Index', [
            'medicines' => $medicines,
            'batches' => $batches,
            'categories' => Category::where('is_active', true)->get(),
            'generics' => GenericName::all(),
            'manufacturers' => Manufacturer::where('is_active', true)->get(),
            'dosage_forms' => DosageForm::all(),
            'units' => Unit::all(),
            'metrics' => $this->inventoryService->getInventoryMetrics(),
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'generic_id' => $genericId,
                'manufacturer_id' => $manufacturerId,
                'filter_expiry' => $filterExpiry,
            ],
        ]);
    }

    public function storeMedicine(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'sku' => 'required|string|unique:medicines,sku|max:100',
            'barcode' => 'nullable|string|max:100',
            'generic_name_id' => 'nullable|exists:generic_names,id',
            'category_id' => 'nullable|exists:categories,id',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'dosage_form_id' => 'nullable|exists:dosage_forms,id',
            'primary_unit_id' => 'nullable|exists:units,id',
            'secondary_unit_id' => 'nullable|exists:units,id',
            'unit_conversion_rate' => 'nullable|integer|min:1',
            'strength' => 'nullable|string|max:100',
            'min_stock_alert' => 'required|integer|min:0',
            'is_prescription_required' => 'boolean',
            'is_controlled_substance' => 'boolean',
        ]);

        Medicine::create($validated);

        return redirect()->back()->with('success', "Medicine '{$validated['name']}' created successfully!");
    }

    public function storeBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'batch_number' => 'required|string|max:100',
            'expiry_date' => 'required|date|after:today',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'supplier_id' => 'nullable|exists:manufacturers,id',
        ]);

        Batch::create([
            'medicine_id' => $validated['medicine_id'],
            'batch_number' => $validated['batch_number'],
            'expiry_date' => $validated['expiry_date'],
            'cost_price' => $validated['cost_price'],
            'selling_price' => $validated['selling_price'],
            'initial_quantity' => $validated['quantity'],
            'current_quantity' => $validated['quantity'],
            'supplier_id' => $validated['supplier_id'],
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "New batch '{$validated['batch_number']}' added successfully!");
    }

    public function adjustStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'batch_id' => 'nullable|exists:batches,id',
            'type' => 'required|in:addition,deduction,damage,expired,reconciliation',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $medicine = Medicine::findOrFail($validated['medicine_id']);
        $batch = !empty($validated['batch_id']) ? Batch::find($validated['batch_id']) : null;
        $user = $request->user() ?? \App\Models\User::first();

        $this->inventoryService->adjustStock(
            $medicine,
            $batch,
            $user,
            $validated['type'],
            (int) $validated['quantity'],
            $validated['reason'],
            $validated['notes'] ?? null
        );

        return redirect()->back()->with('success', "Stock adjustment logged and inventory updated successfully.");
    }

    public function quickCreateGeneric(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'therapeutic_class' => 'nullable|string|max:255',
        ]);

        $generic = GenericName::firstOrCreate(
            ['name' => trim($validated['name'])],
            ['therapeutic_class' => $validated['therapeutic_class'] ?? null]
        );

        return response()->json([
            'success' => true,
            'item' => $generic,
            'message' => "Generic '{$generic->name}' created successfully."
        ]);
    }

    public function quickCreateCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $name = trim($validated['name']);
        $category = Category::where('name', $name)->first();
        if (!$category) {
            $category = Category::create([
                'name' => $name,
                'slug' => \Illuminate\Support\Str::slug($name) . '-' . substr(uniqid(), -4),
                'description' => $validated['description'] ?? null,
                'is_active' => true,
            ]);
        }

        return response()->json([
            'success' => true,
            'item' => $category,
            'message' => "Category '{$category->name}' created successfully."
        ]);
    }

    public function quickCreateManufacturer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        $manufacturer = Manufacturer::firstOrCreate(
            ['name' => trim($validated['name'])],
            [
                'contact_person' => $validated['contact_person'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'is_active' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'item' => $manufacturer,
            'message' => "Manufacturer '{$manufacturer->name}' created successfully."
        ]);
    }

    public function quickCreateDosageForm(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $form = DosageForm::firstOrCreate(
            ['name' => trim($validated['name'])]
        );

        return response()->json([
            'success' => true,
            'item' => $form,
            'message' => "Dosage form '{$form->name}' created successfully."
        ]);
    }
}

