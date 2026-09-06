<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $action = $request->input('action');
        $entityType = $request->input('entity_type');

        $query = AuditLog::with('user')->latest('created_at');

        if ($action) {
            $query->where('action', $action);
        }

        if ($entityType) {
            $query->where('entity_type', $entityType);
        }

        $logs = $query->take(100)->get();
        $adjustments = StockAdjustment::with(['medicine', 'batch', 'user'])->latest()->take(50)->get();

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'adjustments' => $adjustments,
            'filters' => [
                'action' => $action,
                'entity_type' => $entityType,
            ],
        ]);
    }
}
