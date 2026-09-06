<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Batch;
use App\Models\StockAdjustment;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Deduct stock for a medicine using FEFO (First Expired, First Out) batch prioritization.
     * Uses atomic transactions and database row locking to prevent race conditions.
     *
     * @param Medicine $medicine
     * @param int $requestedQuantity
     * @return array List of allocated batches with deducted quantities
     * @throws Exception
     */
    public function deductStockFEFO(Medicine $medicine, int $requestedQuantity): array
    {
        return DB::transaction(function () use ($medicine, $requestedQuantity) {
            // Lock active non-expired batches with stock ordered by expiry_date ASC
            $batches = Batch::where('medicine_id', $medicine->id)
                ->where('is_active', true)
                ->where('current_quantity', '>', 0)
                ->where('expiry_date', '>', Carbon::now()->toDateString())
                ->orderBy('expiry_date', 'asc')
                ->lockForUpdate()
                ->get();

            $totalAvailable = $batches->sum('current_quantity');
            if ($totalAvailable < $requestedQuantity) {
                throw new Exception("Insufficient stock for {$medicine->name}. Available: {$totalAvailable}, Requested: {$requestedQuantity}");
            }

            $remainingNeeded = $requestedQuantity;
            $allocations = [];

            foreach ($batches as $batch) {
                if ($remainingNeeded <= 0) {
                    break;
                }

                $deductFromThisBatch = min($batch->current_quantity, $remainingNeeded);
                $batch->current_quantity -= $deductFromThisBatch;
                $batch->save();

                $allocations[] = [
                    'batch_id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'expiry_date' => $batch->expiry_date->toDateString(),
                    'unit_price' => $batch->selling_price,
                    'cost_price' => $batch->cost_price,
                    'quantity' => $deductFromThisBatch,
                    'subtotal' => $deductFromThisBatch * (float) $batch->selling_price,
                ];

                $remainingNeeded -= $deductFromThisBatch;
            }

            return $allocations;
        });
    }

    /**
     * Adjust stock manually with audit logging.
     */
    public function adjustStock(
        Medicine $medicine,
        ?Batch $batch,
        User $user,
        string $type,
        int $quantity,
        string $reason,
        ?string $notes = null
    ): StockAdjustment {
        return DB::transaction(function () use ($medicine, $batch, $user, $type, $quantity, $reason, $notes) {
            $adjustmentNumber = 'ADJ-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            if ($batch) {
                $batch = Batch::where('id', $batch->id)->lockForUpdate()->firstOrFail();
                $oldQty = $batch->current_quantity;

                if (in_array($type, ['deduction', 'damage', 'expired'])) {
                    $batch->current_quantity = max(0, $batch->current_quantity - abs($quantity));
                } elseif ($type === 'addition') {
                    $batch->current_quantity += abs($quantity);
                } elseif ($type === 'reconciliation') {
                    $batch->current_quantity = abs($quantity);
                }
                $batch->save();

                $newQty = $batch->current_quantity;
            } else {
                $oldQty = $medicine->total_stock;
                $newQty = $oldQty; // Handled per batch
            }

            $adjustment = StockAdjustment::create([
                'adjustment_number' => $adjustmentNumber,
                'medicine_id' => $medicine->id,
                'batch_id' => $batch?->id,
                'user_id' => $user->id,
                'type' => $type,
                'quantity' => $quantity,
                'reason' => $reason,
                'notes' => $notes,
            ]);

            // Comprehensive Regulatory Audit Trail
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'stock_adjustment_' . $type,
                'entity_type' => 'StockAdjustment',
                'entity_id' => $adjustment->id,
                'old_values' => [
                    'medicine' => $medicine->name,
                    'sku' => $medicine->sku,
                    'batch_number' => $batch?->batch_number ?? 'General Stock',
                    'previous_stock' => $oldQty ?? null,
                ],
                'new_values' => [
                    'adjusted_quantity' => $quantity,
                    'adjustment_type' => $type,
                    'reason' => $reason,
                    'notes' => $notes,
                    'new_stock' => $newQty ?? null,
                    'operator' => $user->name . ' (' . ucfirst(str_replace('_', ' ', $user->role)) . ')',
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'CLI/System',
                'created_at' => Carbon::now(),
            ]);

            return $adjustment;
        });
    }

    /**
     * Get inventory overview statistics
     */
    public function getInventoryMetrics(): array
    {
        $totalMedicines = Medicine::where('is_active', true)->count();
        $totalStockValue = Batch::where('is_active', true)->sum(DB::raw('current_quantity * cost_price'));
        $totalSalesValue = Batch::where('is_active', true)->sum(DB::raw('current_quantity * selling_price'));
        
        $criticalExpiringBatches = Batch::where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->whereBetween('expiry_date', [
                Carbon::now()->toDateString(),
                Carbon::now()->addDays(30)->toDateString()
            ])
            ->count();

        $lowStockCount = Medicine::where('is_active', true)->get()->filter(fn($m) => $m->is_low_stock)->count();

        return [
            'total_medicines' => $totalMedicines,
            'total_stock_value' => (float) $totalStockValue,
            'total_sales_value' => (float) $totalSalesValue,
            'critical_expiring_count' => $criticalExpiringBatches,
            'low_stock_count' => $lowStockCount,
        ];
    }
}
