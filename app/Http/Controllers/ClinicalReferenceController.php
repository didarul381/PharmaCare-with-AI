<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\DosageForm;
use App\Models\DrugInteraction;
use App\Models\GenericName;
use App\Models\Manufacturer;
use App\Models\Medicine;
use App\Models\StoreSetting;
use App\Models\Unit;
use App\Services\MedicineApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClinicalReferenceController extends Controller
{
    /**
     * Display the MedEx-style Medicine Dictionary & Clinical Encyclopedia.
     */
    public function index(Request $request)
    {
        $mode = $request->input('mode', 'brands'); // 'brands' | 'generics' | 'companies' | 'dosage_forms' | 'ddi_checker'
        $search = $request->input('search');
        $letter = $request->input('letter'); // 'A' .. 'Z' | '#'
        $selectedBrandId = $request->input('brand_id');
        $selectedGenericId = $request->input('generic_id');
        $selectedCompanyId = $request->input('company_id');
        $selectedFormId = $request->input('form_id');
        $selectedClass = $request->input('therapeutic_class');
        $pregnancyCategory = $request->input('pregnancy_category');

        // 1. Query Brands (MedEx Brand Directory)
        $brandsQuery = Medicine::with([
            'genericName',
            'manufacturer',
            'dosageForm',
            'primaryUnit',
            'category',
            'batches' => function ($bq) {
                $bq->where('is_active', true)->where('current_quantity', '>', 0);
            },
        ])->where('is_active', true);

        if ($search) {
            $brandsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand_name', 'like', "%{$search}%")
                    ->orWhereHas('genericName', function ($gq) use ($search) {
                        $gq->where('name', 'like', "%{$search}%")
                            ->orWhere('therapeutic_class', 'like', "%{$search}%");
                    })
                    ->orWhereHas('manufacturer', function ($mq) use ($search) {
                        $mq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($letter) {
            if ($letter === '#') {
                $brandsQuery->whereRaw("name GLOB '[0-9]*'");
            } else {
                $brandsQuery->where('name', 'like', "{$letter}%");
            }
        }

        if ($selectedCompanyId) {
            $brandsQuery->where('manufacturer_id', $selectedCompanyId);
        }

        if ($selectedFormId) {
            $brandsQuery->where('dosage_form_id', $selectedFormId);
        }

        if ($selectedGenericId) {
            $brandsQuery->where('generic_name_id', $selectedGenericId);
        }

        if ($selectedClass) {
            $brandsQuery->whereHas('genericName', function ($gq) use ($selectedClass) {
                $gq->where('therapeutic_class', $selectedClass);
            });
        }

        if ($pregnancyCategory) {
            $brandsQuery->whereHas('genericName', function ($gq) use ($pregnancyCategory) {
                $gq->where('pregnancy_category', $pregnancyCategory);
            });
        }

        $brands = $brandsQuery->orderBy('name', 'asc')->get()->map(function ($med) {
            $totalStock = $med->batches->sum('current_quantity');
            $unitPrice = (float) $med->current_selling_price;
            $stripPrice = round($unitPrice * 10, 2);
            $boxPrice = round($unitPrice * 100, 2);
            $earliestBatch = $med->batches->sortBy('expiry_date')->first();

            return [
                'id' => $med->id,
                'name' => $med->name,
                'brand_name' => $med->brand_name ?? $med->name,
                'strength' => $med->strength ?? 'Standard',
                'dosage_form' => $med->dosageForm?->name ?? 'Tablet',
                'dosage_form_id' => $med->dosage_form_id,
                'manufacturer' => $med->manufacturer?->name ?? 'Standard Pharma',
                'manufacturer_id' => $med->manufacturer_id,
                'generic_id' => $med->generic_name_id,
                'generic_name' => $med->genericName?->name ?? 'N/A',
                'therapeutic_class' => $med->genericName?->therapeutic_class ?? 'General',
                'pregnancy_category' => $med->genericName?->pregnancy_category ?? 'B',
                'is_controlled' => (bool) ($med->genericName?->is_controlled || $med->is_controlled_substance),
                'unit_price' => $unitPrice,
                'strip_price' => $stripPrice,
                'box_price' => $boxPrice,
                'total_stock' => $totalStock,
                'is_in_stock' => $totalStock > 0,
                'earliest_expiry' => $earliestBatch?->expiry_date?->format('d M Y'),
                'batch_number' => $earliestBatch?->batch_number,
            ];
        });

        // 2. Query Generics (MedEx Generic Monographs)
        $genericsQuery = GenericName::with([
            'medicines' => function ($q) {
                $q->where('is_active', true)->with(['manufacturer', 'dosageForm', 'batches']);
            },
            'interactionsAsPrimary.genericB',
            'interactionsAsSecondary.genericA',
        ]);

        if ($search) {
            $genericsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('therapeutic_class', 'like', "%{$search}%")
                    ->orWhere('indications', 'like', "%{$search}%");
            });
        }

        if ($letter && $mode === 'generics') {
            if ($letter === '#') {
                $genericsQuery->whereRaw("name GLOB '[0-9]*'");
            } else {
                $genericsQuery->where('name', 'like', "{$letter}%");
            }
        }

        $generics = $genericsQuery->orderBy('name', 'asc')->get()->map(function ($gen) {
            $interactions = collect();
            foreach ($gen->interactionsAsPrimary as $ia) {
                $interactions->push([
                    'id' => $ia->id,
                    'partner_name' => $ia->genericB?->name ?? 'Unknown',
                    'partner_id' => $ia->generic_b_id,
                    'severity' => $ia->severity,
                    'description' => $ia->description,
                    'clinical_management' => $ia->clinical_management,
                ]);
            }
            foreach ($gen->interactionsAsSecondary as $ib) {
                $interactions->push([
                    'id' => $ib->id,
                    'partner_name' => $ib->genericA?->name ?? 'Unknown',
                    'partner_id' => $ib->generic_a_id,
                    'severity' => $ib->severity,
                    'description' => $ib->description,
                    'clinical_management' => $ib->clinical_management,
                ]);
            }

            $brandsCount = $gen->medicines->count();
            $totalStock = $gen->medicines->reduce(function ($carry, $m) {
                return $carry + $m->batches->sum('current_quantity');
            }, 0);

            return [
                'id' => $gen->id,
                'name' => $gen->name,
                'therapeutic_class' => $gen->therapeutic_class ?? 'General Pharmaceutical',
                'description' => $gen->description,
                'indications' => $gen->indications,
                'dosage_guidelines' => $gen->dosage_guidelines,
                'contraindications' => $gen->contraindications,
                'side_effects' => $gen->side_effects,
                'mechanism_of_action' => $gen->mechanism_of_action,
                'counseling_points' => $gen->counseling_points,
                'pregnancy_category' => $gen->pregnancy_category ?? 'B',
                'is_controlled' => (bool) $gen->is_controlled,
                'brands_count' => $brandsCount,
                'total_vault_units' => $totalStock,
                'interactions' => $interactions,
                'interactions_count' => $interactions->count(),
            ];
        });

        // 3. Query Companies (MedEx Pharmaceuticals Directory)
        $companies = Manufacturer::withCount(['medicines' => function ($q) {
            $q->where('is_active', true);
        }])
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($comp) {
                return [
                    'id' => $comp->id,
                    'name' => $comp->name,
                    'email' => $comp->email,
                    'phone' => $comp->phone,
                    'address' => $comp->address,
                    'products_count' => $comp->medicines_count,
                ];
            });

        // 4. Query Dosage Forms
        $dosageForms = DosageForm::withCount(['medicines' => function ($q) {
            $q->where('is_active', true);
        }])->orderBy('name', 'asc')->get();

        // 5. Active Brand Detailed Resolution (MedEx Brand Deep Dive)
        $activeBrand = null;
        $alternateBrands = [];
        $siblingForms = [];
        $activeGenericMonograph = null;

        $targetBrandId = $selectedBrandId ?: ($brands->first()['id'] ?? null);

        if ($targetBrandId) {
            $med = Medicine::with([
                'genericName',
                'manufacturer',
                'dosageForm',
                'primaryUnit',
                'category',
                'batches' => function ($bq) {
                    $bq->where('is_active', true)->where('current_quantity', '>', 0);
                },
            ])->find($targetBrandId);

            if ($med) {
                $totalStock = $med->batches->sum('current_quantity');
                $unitPrice = (float) $med->current_selling_price;
                $stripPrice = round($unitPrice * 10, 2);
                $boxPrice = round($unitPrice * 100, 2);
                $earliestBatch = $med->batches->sortBy('expiry_date')->first();

                $activeBrand = [
                    'id' => $med->id,
                    'name' => $med->name,
                    'brand_name' => $med->brand_name ?? $med->name,
                    'strength' => $med->strength ?? 'Standard',
                    'dosage_form' => $med->dosageForm?->name ?? 'Tablet',
                    'dosage_form_id' => $med->dosage_form_id,
                    'manufacturer' => $med->manufacturer?->name ?? 'Standard Pharma',
                    'manufacturer_id' => $med->manufacturer_id,
                    'generic_id' => $med->generic_name_id,
                    'generic_name' => $med->genericName?->name ?? 'N/A',
                    'therapeutic_class' => $med->genericName?->therapeutic_class ?? 'General',
                    'pregnancy_category' => $med->genericName?->pregnancy_category ?? 'B',
                    'is_controlled' => (bool) ($med->genericName?->is_controlled || $med->is_controlled_substance),
                    'unit_price' => $unitPrice,
                    'strip_price' => $stripPrice,
                    'box_price' => $boxPrice,
                    'total_stock' => $totalStock,
                    'is_in_stock' => $totalStock > 0,
                    'earliest_expiry' => $earliestBatch?->expiry_date?->format('d M Y'),
                    'batch_number' => $earliestBatch?->batch_number,
                ];

                // MedEx Sibling Forms / Strengths of this Brand (e.g. Napa 500mg, Napa Extend 665mg, Napa Rapid)
                $siblingForms = Medicine::where('brand_name', $med->brand_name)
                    ->where('id', '!=', $med->id)
                    ->with(['dosageForm'])
                    ->get()
                    ->map(function ($s) {
                        return [
                            'id' => $s->id,
                            'name' => $s->name,
                            'strength' => $s->strength,
                            'form' => $s->dosageForm?->name ?? 'Form',
                            'price' => (float) $s->current_selling_price,
                        ];
                    });

                // MedEx Alternate Competing Brands of this Generic (e.g. Ace, Renova, Fast, Reset)
                if ($med->generic_name_id) {
                    $alternateBrands = Medicine::where('generic_name_id', $med->generic_name_id)
                        ->where('id', '!=', $med->id)
                        ->with(['manufacturer', 'dosageForm', 'primaryUnit', 'batches' => function ($bq) {
                            $bq->where('is_active', true)->where('current_quantity', '>', 0);
                        }])
                        ->get()
                        ->map(function ($alt) {
                            $stock = $alt->batches->sum('current_quantity');
                            return [
                                'id' => $alt->id,
                                'name' => $alt->name,
                                'brand_name' => $alt->brand_name,
                                'strength' => $alt->strength,
                                'dosage_form' => $alt->dosageForm?->name ?? 'Tablet',
                                'manufacturer' => $alt->manufacturer?->name ?? 'Pharma Co.',
                                'unit_price' => (float) $alt->current_selling_price,
                                'total_stock' => $stock,
                                'is_in_stock' => $stock > 0,
                            ];
                        });

                    $activeGenericMonograph = $generics->firstWhere('id', $med->generic_name_id);
                }
            }
        }

        // Distinct therapeutic classes for quick pills
        $therapeuticClasses = GenericName::whereNotNull('therapeutic_class')
            ->distinct()
            ->orderBy('therapeutic_class')
            ->pluck('therapeutic_class');

        $metrics = [
            'total_brands' => Medicine::where('is_active', true)->count(),
            'total_generics' => GenericName::count(),
            'total_companies' => Manufacturer::where('is_active', true)->count(),
            'total_forms' => DosageForm::count(),
            'total_interactions' => DrugInteraction::count(),
        ];

        $storeSettings = StoreSetting::getSettings();

        return Inertia::render('ClinicalReference/Index', [
            'mode' => $mode,
            'brands' => $brands,
            'generics' => $generics,
            'companies' => $companies,
            'dosage_forms' => $dosageForms,
            'therapeutic_classes' => $therapeuticClasses,
            'active_brand' => $activeBrand,
            'alternate_brands' => $alternateBrands,
            'sibling_forms' => $siblingForms,
            'active_generic_monograph' => $activeGenericMonograph,
            'all_generics_list' => GenericName::select('id', 'name', 'therapeutic_class')->orderBy('name')->get(),
            'metrics' => $metrics,
            'filters' => [
                'mode' => $mode,
                'search' => $search,
                'letter' => $letter,
                'brand_id' => $selectedBrandId ? (int) $selectedBrandId : null,
                'generic_id' => $selectedGenericId ? (int) $selectedGenericId : null,
                'company_id' => $selectedCompanyId ? (int) $selectedCompanyId : null,
                'form_id' => $selectedFormId ? (int) $selectedFormId : null,
                'therapeutic_class' => $selectedClass,
                'pregnancy_category' => $pregnancyCategory,
            ],
            'settings' => $storeSettings,
        ]);
    }

    /**
     * Real-time Multi-Drug Interaction (DDI) Checker endpoint.
     */
    public function checkInteractions(Request $request)
    {
        $genericIds = $request->input('generic_ids', []);

        if (empty($genericIds) || !is_array($genericIds) || count($genericIds) < 2) {
            return response()->json([
                'status' => 'success',
                'interactions' => [],
                'has_interactions' => false,
                'max_severity' => 'none',
                'count' => 0,
            ]);
        }

        $interactions = DrugInteraction::where(function ($q) use ($genericIds) {
            $q->whereIn('generic_a_id', $genericIds)
                ->whereIn('generic_b_id', $genericIds);
        })
            ->with(['genericA', 'genericB'])
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'generic_a' => $item->genericA?->name ?? 'Drug A',
                    'generic_b' => $item->genericB?->name ?? 'Drug B',
                    'severity' => $item->severity,
                    'description' => $item->description,
                    'clinical_management' => $item->clinical_management,
                ];
            });

        $severityWeight = ['fatal' => 4, 'severe' => 3, 'moderate' => 2, 'mild' => 1];
        $maxSeverity = 'none';
        $maxWeight = 0;

        foreach ($interactions as $i) {
            $w = $severityWeight[$i['severity']] ?? 0;
            if ($w > $maxWeight) {
                $maxWeight = $w;
                $maxSeverity = $i['severity'];
            }
        }

        return response()->json([
            'status' => 'success',
            'interactions' => $interactions,
            'has_interactions' => $interactions->isNotEmpty(),
            'max_severity' => $maxSeverity,
            'count' => $interactions->count(),
        ]);
    }

    /**
     * Store a newly documented generic molecule clinical monograph.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:generic_names,name',
            'therapeutic_class' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'indications' => 'nullable|string',
            'dosage_guidelines' => 'nullable|string',
            'contraindications' => 'nullable|string',
            'side_effects' => 'nullable|string',
            'mechanism_of_action' => 'nullable|string',
            'counseling_points' => 'nullable|string',
            'pregnancy_category' => 'nullable|string|max:10',
            'is_controlled' => 'nullable|boolean',
        ]);

        $generic = GenericName::create($validated);

        AuditLog::log('generic_created', "Created clinical monograph for {$generic->name}", [
            'generic_id' => $generic->id,
            'therapeutic_class' => $generic->therapeutic_class,
        ]);

        return redirect()->back()->with('success', "Clinical monograph for '{$generic->name}' created successfully.");
    }

    /**
     * Update an existing clinical monograph.
     */
    public function update(Request $request, GenericName $generic)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:generic_names,name,' . $generic->id,
            'therapeutic_class' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'indications' => 'nullable|string',
            'dosage_guidelines' => 'nullable|string',
            'contraindications' => 'nullable|string',
            'side_effects' => 'nullable|string',
            'mechanism_of_action' => 'nullable|string',
            'counseling_points' => 'nullable|string',
            'pregnancy_category' => 'nullable|string|max:10',
            'is_controlled' => 'nullable|boolean',
        ]);

        $generic->update($validated);

        AuditLog::log('generic_updated', "Updated clinical monograph for {$generic->name}", [
            'generic_id' => $generic->id,
        ]);

        return redirect()->back()->with('success', "Monograph for '{$generic->name}' updated successfully.");
    }

    /**
     * Store or update a Drug-Drug Interaction rule.
     */
    public function storeInteraction(Request $request)
    {
        $validated = $request->validate([
            'generic_a_id' => 'required|exists:generic_names,id',
            'generic_b_id' => 'required|exists:generic_names,id|different:generic_a_id',
            'severity' => 'required|in:mild,moderate,severe,fatal',
            'description' => 'required|string',
            'clinical_management' => 'nullable|string',
        ]);

        $a = min($validated['generic_a_id'], $validated['generic_b_id']);
        $b = max($validated['generic_a_id'], $validated['generic_b_id']);

        DrugInteraction::updateOrCreate(
            ['generic_a_id' => $a, 'generic_b_id' => $b],
            [
                'severity' => $validated['severity'],
                'description' => $validated['description'],
                'clinical_management' => $validated['clinical_management'] ?? null,
            ]
        );

        $genA = GenericName::find($a)?->name;
        $genB = GenericName::find($b)?->name;

        AuditLog::log('interaction_created', "Registered DDI rule between {$genA} and {$genB}", [
            'severity' => $validated['severity'],
        ]);

        return redirect()->back()->with('success', "Drug interaction rule between {$genA} and {$genB} recorded successfully.");
    }

    /**
     * Delete an interaction rule.
     */
    public function destroyInteraction(DrugInteraction $interaction)
    {
        $genA = $interaction->genericA?->name;
        $genB = $interaction->genericB?->name;

        $interaction->delete();

        AuditLog::log('interaction_deleted', "Deleted DDI rule between {$genA} and {$genB}");

        return redirect()->back()->with('success', "Interaction rule removed.");
    }

    /**
     * Search free drug APIs (MedEx BD live, openFDA, RxNorm/NIH NLM) for live clinical monographs & pharmacology.
     */
    public function freeApiSearch(Request $request, MedicineApiService $apiService)
    {
        $term = $request->input('term', '');
        if (empty($term) || strlen(trim($term)) < 2) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please enter at least 2 characters to search.',
                'results' => [],
            ]);
        }

        $allResults = $apiService->searchAll($term);
        $hasResults = !empty($allResults['medex']) || !empty($allResults['openfda']) || !empty($allResults['rxnorm']) || !empty($allResults['local']);

        return response()->json([
            'status' => 'success',
            'term' => $term,
            'medex' => $allResults['medex'],
            'openfda' => $allResults['openfda'],
            'rxnorm' => $allResults['rxnorm'],
            'local' => $allResults['local'],
            'has_results' => $hasResults,
        ]);
    }

    /**
     * 1-Click Import of generic clinical monograph or medicine from Free API into local database.
     */
    public function importFromApi(Request $request)
    {
        $validated = $request->validate([
            'brand_name' => 'nullable|string|max:255',
            'generic_name' => 'required|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'therapeutic_class' => 'nullable|string|max:255',
            'indications' => 'nullable|string',
            'dosage_guidelines' => 'nullable|string',
            'contraindications' => 'nullable|string',
            'side_effects' => 'nullable|string',
            'warnings' => 'nullable|string',
            'pregnancy' => 'nullable|string',
            'mechanism_of_action' => 'nullable|string',
        ]);

        $genericName = trim($validated['generic_name']);

        // Find or create generic monograph
        $generic = GenericName::firstOrCreate(
            ['name' => $genericName],
            [
                'therapeutic_class' => $validated['therapeutic_class'] ?? 'Therapeutic Agent',
                'indications' => $validated['indications'] ?? null,
                'dosage_guidelines' => $validated['dosage_guidelines'] ?? null,
                'contraindications' => $validated['contraindications'] ?? null,
                'side_effects' => $validated['side_effects'] ?? null,
                'mechanism_of_action' => $validated['mechanism_of_action'] ?? null,
                'counseling_points' => $validated['warnings'] ?? null,
                'pregnancy_category' => 'B',
            ]
        );

        // If existing generic lacks clinical info, enrich it
        if (!$generic->wasRecentlyCreated) {
            $generic->update(array_filter([
                'indications' => $generic->indications ?: ($validated['indications'] ?? null),
                'dosage_guidelines' => $generic->dosage_guidelines ?: ($validated['dosage_guidelines'] ?? null),
                'contraindications' => $generic->contraindications ?: ($validated['contraindications'] ?? null),
                'side_effects' => $generic->side_effects ?: ($validated['side_effects'] ?? null),
                'mechanism_of_action' => $generic->mechanism_of_action ?: ($validated['mechanism_of_action'] ?? null),
            ]));
        }

        AuditLog::log('generic_imported_from_api', "Imported clinical monograph for {$genericName} from free openFDA API", [
            'generic_id' => $generic->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Successfully imported and synchronized clinical monograph for '{$genericName}'!",
            'generic_id' => $generic->id,
        ]);
    }
}

