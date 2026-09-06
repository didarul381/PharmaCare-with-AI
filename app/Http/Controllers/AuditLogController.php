<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\StockAdjustment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $category = $request->input('category'); // 'all', 'controlled', 'medicine', 'stock', 'sales', 'settings', 'security'
        $userId = $request->input('user_id');

        $query = AuditLog::with('user')->latest('created_at');

        if ($category) {
            switch ($category) {
                case 'controlled':
                    $query->where('action', 'controlled_substance_dispensed');
                    break;
                case 'medicine':
                    $query->whereIn('action', ['medicine_created', 'medicine_deleted', 'medicine_updated']);
                    break;
                case 'stock':
                    $query->where('action', 'LIKE', 'stock_adjustment_%');
                    break;
                case 'sales':
                    $query->where('action', 'pos_sale_dispense');
                    break;
                case 'settings':
                    $query->where('action', 'settings_updated');
                    break;
                case 'security':
                    $query->whereIn('action', ['role_switched', 'auth_login', 'permission_denied']);
                    break;
            }
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                  ->orWhere('entity_type', 'LIKE', "%{$search}%")
                  ->orWhere('ip_address', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'LIKE', "%{$search}%")->orWhere('email', 'LIKE', "%{$search}%"));
            });
        }

        $logs = $query->take(150)->get();
        $adjustments = StockAdjustment::with(['medicine', 'batch', 'user'])->latest()->take(50)->get();

        $metrics = [
            'total_logs' => AuditLog::count(),
            'controlled_events_count' => AuditLog::where('action', 'controlled_substance_dispensed')->count(),
            'stock_adjustments_count' => AuditLog::where('action', 'LIKE', 'stock_adjustment_%')->count(),
            'medicine_changes_count' => AuditLog::whereIn('action', ['medicine_created', 'medicine_deleted', 'medicine_updated'])->count(),
        ];

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'adjustments' => $adjustments,
            'metrics' => $metrics,
            'users' => User::all(['id', 'name', 'role', 'avatar']),
            'filters' => [
                'search' => $search,
                'category' => $category,
                'user_id' => $userId,
            ],
        ]);
    }
}

