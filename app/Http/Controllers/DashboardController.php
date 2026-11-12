<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Batch;
use App\Models\Sale;
use App\Models\Prescription;
use App\Services\InventoryService;
use App\Services\Ai\DemandForecastService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected DemandForecastService $forecastService
    ) {}

    public function index(): Response
    {
        $metrics = $this->inventoryService->getInventoryMetrics();

        // Revenue (returned sales excluded)
        $sales = Sale::query()->where('is_returned', false);
        $todaySales = (clone $sales)->whereDate('created_at', Carbon::today())->sum('grand_total');
        $todayCount = (clone $sales)->whereDate('created_at', Carbon::today())->count();
        $yesterdaySales = (clone $sales)->whereDate('created_at', Carbon::yesterday())->sum('grand_total');
        $totalSalesAllTime = (clone $sales)->sum('grand_total');
        $totalPrescriptionsCount = Prescription::count();

        // % change vs yesterday (null when there is nothing to compare against)
        $changeVsYesterday = $yesterdaySales > 0
            ? round((($todaySales - $yesterdaySales) / $yesterdaySales) * 100, 1)
            : null;

        // 7-day revenue trend — real figures only, one grouped query
        $from = Carbon::today()->subDays(6);
        $daily = (clone $sales)
            ->where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as day, SUM(grand_total) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $revenueTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $revenueTrend[] = [
                'date' => $date->format('d M'),
                'revenue' => round((float) ($daily[$date->toDateString()] ?? 0), 2),
            ];
        }

        // Critical expiring batches (<30 days)
        $expiringBatches = Batch::with(['medicine.genericName', 'medicine.dosageForm'])
            ->where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->whereBetween('expiry_date', [
                Carbon::now()->toDateString(),
                Carbon::now()->addDays(30)->toDateString(),
            ])
            ->orderBy('expiry_date', 'asc')
            ->take(5)
            ->get()
            ->each(fn ($b) => $b->medicine?->setAppends([])); // only name/generic are shown

        // Low stock items
        $lowStockMedicines = Medicine::with(['category', 'dosageForm', 'batches' => function($q) {
            $q->where('is_active', true);
        }])
        ->where('is_active', true)
        ->lowStock()
        ->take(5)
        ->get();

        // Recent transactions
        $recentSales = Sale::with(['user', 'customer', 'items.medicine'])
            ->latest()
            ->take(5)
            ->get();

        // Top forecast item
        $forecastData = $this->forecastService->generateForecast();
        $topForecast = $forecastData['items'][0] ?? null;

        return Inertia::render('Dashboard', [
            'metrics' => [
                'today_sales' => (float) $todaySales,
                'today_count' => $todayCount,
                'yesterday_sales' => (float) $yesterdaySales,
                'change_vs_yesterday' => $changeVsYesterday,
                'total_sales' => (float) $totalSalesAllTime,
                'inventory_value' => $metrics['total_sales_value'],
                'critical_expiring_count' => $metrics['critical_expiring_count'],
                'low_stock_count' => $metrics['low_stock_count'],
                'total_medicines' => $metrics['total_medicines'],
                'total_prescriptions' => $totalPrescriptionsCount,
            ],
            'revenue_trend' => $revenueTrend,
            'expiring_batches' => $expiringBatches,
            'low_stock_medicines' => $lowStockMedicines,
            'recent_sales' => $recentSales,
            'top_forecast' => $topForecast,
        ]);
    }
}
