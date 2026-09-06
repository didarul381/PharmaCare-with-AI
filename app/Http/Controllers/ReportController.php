<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StoreSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Display the comprehensive reporting analytics dashboard.
     */
    public function index(Request $request)
    {
        $datePreset = $request->input('preset', 'last_30_days');
        $customStart = $request->input('start_date');
        $customEnd = $request->input('end_date');
        $activeTab = $request->input('tab', 'executive');

        [$startDate, $endDate, $dateLabel] = $this->resolveDateRange($datePreset, $customStart, $customEnd);

        // 1. Executive P&L & Financial Metrics
        $salesQuery = Sale::whereBetween('created_at', [$startDate, $endDate]);

        $totalSalesCount = (clone $salesQuery)->count();
        $totalInvoiced = (float) (clone $salesQuery)->where('is_returned', false)->sum('grand_total');
        $totalCollected = (float) (clone $salesQuery)->where('is_returned', false)->sum('paid_amount');
        $totalDues = (float) (clone $salesQuery)->where('is_returned', false)->sum('due_amount');
        $totalDiscount = (float) (clone $salesQuery)->where('is_returned', false)->sum('discount_amount');
        $totalTax = (float) (clone $salesQuery)->where('is_returned', false)->sum('tax_amount');
        $totalReturnsCount = (clone $salesQuery)->where('is_returned', true)->count();
        $totalReturnsAmount = (float) (clone $salesQuery)->where('is_returned', true)->sum('grand_total');

        // Cost of Goods Sold (COGS) for the period
        $cogs = (float) SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false);
        })->selectRaw('SUM(quantity * COALESCE(cost_price, 0)) as total_cost')->value('total_cost') ?? 0.0;

        // Net Revenue before tax
        $netRevenue = $totalInvoiced - $totalTax;
        $grossProfit = $netRevenue - $cogs;
        $profitMargin = $netRevenue > 0 ? round(($grossProfit / $netRevenue) * 100, 1) : 0.0;

        // 2. Payment Method Breakdown
        $paymentMethods = (clone $salesQuery)
            ->where('is_returned', false)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(grand_total) as total'))
            ->groupBy('payment_method')
            ->get()
            ->map(function ($item) {
                return [
                    'method' => $item->payment_method,
                    'count' => (int) $item->count,
                    'total' => (float) $item->total,
                ];
            });

        // 3. Sales Trend Timeline (Daily aggregation)
        $salesTrend = (clone $salesQuery)
            ->where('is_returned', false)
            ->select(
                DB::raw('DATE(created_at) as sale_date'),
                DB::raw('COUNT(*) as total_sales'),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('SUM(paid_amount) as collected')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('sale_date', 'asc')
            ->get();

        // 4. Top 10 Bestselling Medicines
        $topMedicines = SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false);
        })
            ->select(
                'medicine_id',
                DB::raw('SUM(quantity) as units_sold'),
                DB::raw('SUM(total_price) as total_revenue')
            )
            ->with(['medicine.category', 'medicine.genericName'])
            ->groupBy('medicine_id')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'medicine_id' => $item->medicine_id,
                    'name' => $item->medicine?->name ?? 'Unknown',
                    'category' => $item->medicine?->category?->name ?? 'General',
                    'generic' => $item->medicine?->genericName?->name ?? 'N/A',
                    'units_sold' => (int) $item->units_sold,
                    'total_revenue' => (float) $item->total_revenue,
                    'current_stock' => $item->medicine?->total_stock ?? 0,
                ];
            });

        // 5. Inventory Asset Valuation & Expiry Analytics
        $totalSkus = Medicine::where('is_active', true)->count();
        $totalActiveBatches = Batch::where('is_active', true)->where('current_quantity', '>', 0)->count();
        $totalUnitsInStock = (int) Batch::where('is_active', true)->sum('current_quantity');

        $stockValuationCost = (float) Batch::where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->selectRaw('SUM(current_quantity * cost_price) as val')
            ->value('val') ?? 0.0;

        $stockValuationRetail = (float) Batch::where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->selectRaw('SUM(current_quantity * selling_price) as val')
            ->value('val') ?? 0.0;

        $unrealizedMargin = $stockValuationRetail - $stockValuationCost;

        // Expiry Risk Bins
        $today = Carbon::today();
        $in30Days = Carbon::today()->addDays(30);
        $in60Days = Carbon::today()->addDays(60);
        $in90Days = Carbon::today()->addDays(90);

        $expiredBatches = Batch::where('is_active', true)->where('current_quantity', '>', 0)->where('expiry_date', '<', $today)->count();
        $expiredUnits = (int) Batch::where('is_active', true)->where('current_quantity', '>', 0)->where('expiry_date', '<', $today)->sum('current_quantity');
        $expiredValuation = (float) Batch::where('is_active', true)->where('current_quantity', '>', 0)->where('expiry_date', '<', $today)->selectRaw('SUM(current_quantity * cost_price) as val')->value('val') ?? 0.0;

        $expiring30Count = Batch::where('is_active', true)->where('current_quantity', '>', 0)->whereBetween('expiry_date', [$today, $in30Days])->count();
        $expiring30Units = (int) Batch::where('is_active', true)->where('current_quantity', '>', 0)->whereBetween('expiry_date', [$today, $in30Days])->sum('current_quantity');

        $expiring60Count = Batch::where('is_active', true)->where('current_quantity', '>', 0)->whereBetween('expiry_date', [$in30Days, $in60Days])->count();
        $expiring90Count = Batch::where('is_active', true)->where('current_quantity', '>', 0)->whereBetween('expiry_date', [$in60Days, $in90Days])->count();
        $safeCount = Batch::where('is_active', true)->where('current_quantity', '>', 0)->where('expiry_date', '>', $in90Days)->count();

        // Low stock count
        $lowStockCount = Medicine::where('is_active', true)->get()->filter(fn ($m) => $m->is_low_stock)->count();

        // 6. Controlled Substances & Narcotics Dispensation Compliance
        $controlledItems = SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate]);
        })
            ->whereHas('medicine', function ($q) {
                $q->where('is_controlled_substance', true);
            })
            ->with([
                'medicine.genericName',
                'batch',
                'sale.customer',
                'sale.user',
                'sale.prescription.doctor',
            ])
            ->latest()
            ->limit(50)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'date' => $item->created_at->format('d M Y, h:i A'),
                    'invoice_number' => $item->sale?->invoice_number,
                    'medicine_name' => $item->medicine?->name,
                    'generic_name' => $item->medicine?->genericName?->name ?? 'Controlled Compound',
                    'batch_number' => $item->batch?->batch_number ?? 'DIRECT',
                    'quantity' => $item->quantity,
                    'unit' => $item->unit_name,
                    'patient_name' => $item->sale?->customer?->name ?? 'Walk-in Patient',
                    'patient_phone' => $item->sale?->customer?->phone ?? 'N/A',
                    'doctor_name' => $item->sale?->prescription?->doctor?->name ? 'Dr. ' . $item->sale->prescription->doctor->name : 'N/A (Counter Rx)',
                    'dispensed_by' => $item->sale?->user?->name ?? 'Lead Pharmacist',
                ];
            });

        // 7. Customer Receivables & Aging Ledgers
        $dueCustomers = Customer::where('credit_balance', '>', 0)
            ->orderByDesc('credit_balance')
            ->limit(30)
            ->get()
            ->map(function ($cust) {
                return [
                    'id' => $cust->id,
                    'name' => $cust->name,
                    'phone' => $cust->phone ?? 'N/A',
                    'credit_balance' => (float) $cust->credit_balance,
                    'credit_limit' => (float) $cust->credit_limit,
                    'updated_at' => $cust->updated_at->format('d M Y'),
                ];
            });

        $totalReceivablesOutstanding = (float) Customer::sum('credit_balance');

        // 8. Staff / Cashier Performance
        $staffPerformance = User::withCount(['sales as sales_count' => function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false);
        }])
            ->withSum(['sales as total_revenue' => function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false);
            }], 'grand_total')
            ->whereHas('sales', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'role' => $u->role,
                    'sales_count' => (int) $u->sales_count,
                    'total_revenue' => (float) ($u->total_revenue ?? 0),
                ];
            });

        $storeSettings = StoreSetting::getSettings();

        return Inertia::render('Reports/Index', [
            'metrics' => [
                'total_sales_count' => $totalSalesCount,
                'total_invoiced' => $totalInvoiced,
                'total_collected' => $totalCollected,
                'total_dues' => $totalDues,
                'total_discount' => $totalDiscount,
                'total_tax' => $totalTax,
                'total_returns_count' => $totalReturnsCount,
                'total_returns_amount' => $totalReturnsAmount,
                'cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'profit_margin' => $profitMargin,
            ],
            'payment_methods' => $paymentMethods,
            'sales_trend' => $salesTrend,
            'top_medicines' => $topMedicines,
            'inventory_valuation' => [
                'total_skus' => $totalSkus,
                'total_active_batches' => $totalActiveBatches,
                'total_units_in_stock' => $totalUnitsInStock,
                'valuation_cost' => $stockValuationCost,
                'valuation_retail' => $stockValuationRetail,
                'unrealized_margin' => $unrealizedMargin,
                'low_stock_count' => $lowStockCount,
                'expiry_bins' => [
                    'expired_count' => $expiredBatches,
                    'expired_units' => $expiredUnits,
                    'expired_valuation' => $expiredValuation,
                    'expiring_30' => $expiring30Count,
                    'expiring_30_units' => $expiring30Units,
                    'expiring_60' => $expiring60Count,
                    'expiring_90' => $expiring90Count,
                    'safe_count' => $safeCount,
                ],
            ],
            'controlled_items' => $controlledItems,
            'due_customers' => $dueCustomers,
            'total_receivables' => $totalReceivablesOutstanding,
            'staff_performance' => $staffPerformance,
            'filters' => [
                'preset' => $datePreset,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'date_label' => $dateLabel,
                'tab' => $activeTab,
            ],
            'settings' => $storeSettings,
        ]);
    }

    /**
     * Export designated analytical reports to CSV.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $type = $request->input('type', 'sales');
        $datePreset = $request->input('preset', 'last_30_days');
        $customStart = $request->input('start_date');
        $customEnd = $request->input('end_date');

        [$startDate, $endDate, $dateLabel] = $this->resolveDateRange($datePreset, $customStart, $customEnd);

        $filename = "pharmacare_{$type}_report_" . now()->format('Ymd_His') . ".csv";

        return response()->streamDownload(function () use ($type, $startDate, $endDate) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            switch ($type) {
                case 'sales':
                    fputcsv($handle, ['Invoice Number', 'Date & Time', 'Customer Name', 'Phone', 'Dispensed By', 'Payment Method', 'Subtotal', 'Discount', 'VAT/Tax', 'Grand Total', 'Paid Amount', 'Due Amount', 'Status']);
                    Sale::whereBetween('created_at', [$startDate, $endDate])
                        ->with(['customer', 'user'])
                        ->chunk(100, function ($sales) use ($handle) {
                            foreach ($sales as $s) {
                                fputcsv($handle, [
                                    $s->invoice_number,
                                    $s->created_at->format('Y-m-d H:i:s'),
                                    $s->customer?->name ?? 'Walk-in',
                                    $s->customer?->phone ?? '',
                                    $s->user?->name ?? 'Staff',
                                    strtoupper($s->payment_method),
                                    $s->subtotal,
                                    $s->discount_amount,
                                    $s->tax_amount,
                                    $s->grand_total,
                                    $s->paid_amount,
                                    $s->due_amount,
                                    $s->is_returned ? 'RETURNED' : ($s->payment_status === 'paid' ? 'PAID' : 'DUE'),
                                ]);
                            }
                        });
                    break;

                case 'inventory':
                    fputcsv($handle, ['Medicine SKU', 'Brand / Medicine Name', 'Generic Molecule', 'Category', 'Batch Number', 'Expiry Date', 'Available Quantity', 'Purchase Cost', 'Selling Rate', 'Total Cost Valuation', 'Total Retail Valuation']);
                    Batch::with(['medicine.genericName', 'medicine.category'])
                        ->where('is_active', true)
                        ->where('current_quantity', '>', 0)
                        ->chunk(100, function ($batches) use ($handle) {
                            foreach ($batches as $b) {
                                $costVal = $b->current_quantity * $b->cost_price;
                                $retailVal = $b->current_quantity * $b->selling_price;
                                fputcsv($handle, [
                                    $b->medicine?->sku ?? '',
                                    $b->medicine?->name ?? 'Unknown',
                                    $b->medicine?->genericName?->name ?? 'N/A',
                                    $b->medicine?->category?->name ?? 'General',
                                    $b->batch_number,
                                    $b->expiry_date?->format('Y-m-d') ?? 'N/A',
                                    $b->current_quantity,
                                    $b->cost_price,
                                    $b->selling_price,
                                    $costVal,
                                    $retailVal,
                                ]);
                            }
                        });
                    break;

                case 'controlled_substances':
                    fputcsv($handle, ['Dispensation Date', 'Invoice No', 'Controlled Medicine', 'Generic Formulation', 'Batch No', 'Quantity', 'Unit', 'Patient Name', 'Patient Phone', 'Prescribing Doctor', 'Pharmacist']);
                    SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
                        $q->whereBetween('created_at', [$startDate, $endDate]);
                    })
                        ->whereHas('medicine', function ($q) {
                            $q->where('is_controlled_substance', true);
                        })
                        ->with(['medicine.genericName', 'batch', 'sale.customer', 'sale.user', 'sale.prescription.doctor'])
                        ->chunk(100, function ($items) use ($handle) {
                            foreach ($items as $i) {
                                fputcsv($handle, [
                                    $i->created_at->format('Y-m-d H:i:s'),
                                    $i->sale?->invoice_number ?? '',
                                    $i->medicine?->name ?? '',
                                    $i->medicine?->genericName?->name ?? '',
                                    $i->batch?->batch_number ?? 'DIRECT',
                                    $i->quantity,
                                    $i->unit_name,
                                    $i->sale?->customer?->name ?? 'Walk-in',
                                    $i->sale?->customer?->phone ?? '',
                                    $i->sale?->prescription?->doctor?->name ? 'Dr. ' . $i->sale->prescription->doctor->name : 'N/A',
                                    $i->sale?->user?->name ?? 'Pharmacist',
                                ]);
                            }
                        });
                    break;

                case 'customer_dues':
                    fputcsv($handle, ['Customer ID', 'Customer Name', 'Phone Number', 'Address', 'Outstanding Due Balance', 'Credit Limit', 'Last Updated']);
                    Customer::where('credit_balance', '>', 0)
                        ->orderByDesc('credit_balance')
                        ->chunk(100, function ($customers) use ($handle) {
                            foreach ($customers as $c) {
                                fputcsv($handle, [
                                    $c->id,
                                    $c->name,
                                    $c->phone ?? '',
                                    $c->address ?? '',
                                    $c->credit_balance,
                                    $c->credit_limit,
                                    $c->updated_at->format('Y-m-d H:i:s'),
                                ]);
                            }
                        });
                    break;

                case 'p_and_l':
                default:
                    fputcsv($handle, ['Metric Category', 'Amount / Value (BDT)']);
                    $invoiced = Sale::whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false)->sum('grand_total');
                    $discount = Sale::whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false)->sum('discount_amount');
                    $tax = Sale::whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false)->sum('tax_amount');
                    $collected = Sale::whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false)->sum('paid_amount');
                    $dues = Sale::whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false)->sum('due_amount');
                    $cogs = SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
                        $q->whereBetween('created_at', [$startDate, $endDate])->where('is_returned', false);
                    })->selectRaw('SUM(quantity * COALESCE(cost_price, 0)) as total_cost')->value('total_cost') ?? 0;
                    $netRev = $invoiced - $tax;
                    $grossProfit = $netRev - $cogs;
                    $margin = $netRev > 0 ? round(($grossProfit / $netRev) * 100, 2) : 0;

                    fputcsv($handle, ['Gross Invoiced Revenue', $invoiced]);
                    fputcsv($handle, ['Total Discounts Conceded', $discount]);
                    fputcsv($handle, ['Govt VAT / Tax Collected', $tax]);
                    fputcsv($handle, ['Net Revenue (Excl Tax)', $netRev]);
                    fputcsv($handle, ['Cost of Goods Sold (COGS)', $cogs]);
                    fputcsv($handle, ['Gross Estimated Profit', $grossProfit]);
                    fputcsv($handle, ['Gross Profit Margin %', $margin . '%']);
                    fputcsv($handle, ['Total Cash & Digital Realized', $collected]);
                    fputcsv($handle, ['Outstanding Customer Receivables', $dues]);
                    break;
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Resolve date filters into concrete Carbon start and end instances.
     */
    private function resolveDateRange(string $preset, ?string $customStart, ?string $customEnd): array
    {
        if ($preset === 'custom' && $customStart && $customEnd) {
            $start = Carbon::parse($customStart)->startOfDay();
            $end = Carbon::parse($customEnd)->endOfDay();
            $label = $start->format('d M Y') . ' - ' . $end->format('d M Y');
            return [$start, $end, $label];
        }

        switch ($preset) {
            case 'today':
                $start = Carbon::today()->startOfDay();
                $end = Carbon::today()->endOfDay();
                $label = 'Today (' . $start->format('d M Y') . ')';
                break;
            case 'yesterday':
                $start = Carbon::yesterday()->startOfDay();
                $end = Carbon::yesterday()->endOfDay();
                $label = 'Yesterday (' . $start->format('d M Y') . ')';
                break;
            case 'last_7_days':
                $start = Carbon::today()->subDays(6)->startOfDay();
                $end = Carbon::today()->endOfDay();
                $label = 'Last 7 Days (' . $start->format('d M') . ' - ' . $end->format('d M Y') . ')';
                break;
            case 'this_month':
                $start = Carbon::now()->startOfMonth()->startOfDay();
                $end = Carbon::now()->endOfMonth()->endOfDay();
                $label = 'This Month (' . $start->format('F Y') . ')';
                break;
            case 'last_month':
                $start = Carbon::now()->subMonth()->startOfMonth()->startOfDay();
                $end = Carbon::now()->subMonth()->endOfMonth()->endOfDay();
                $label = 'Last Month (' . $start->format('F Y') . ')';
                break;
            case 'this_year':
                $start = Carbon::now()->startOfYear()->startOfDay();
                $end = Carbon::now()->endOfYear()->endOfDay();
                $label = 'This Year (' . $start->format('Y') . ')';
                break;
            case 'last_30_days':
            default:
                $start = Carbon::today()->subDays(29)->startOfDay();
                $end = Carbon::today()->endOfDay();
                $label = 'Last 30 Days (' . $start->format('d M') . ' - ' . $end->format('d M Y') . ')';
                break;
        }

        return [$start, $end, $label];
    }
}
