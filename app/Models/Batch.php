<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Batch extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'batch_number',
        'expiry_date',
        'cost_price',
        'selling_price',
        'initial_quantity',
        'current_quantity',
        'supplier_id',
        'is_active',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'initial_quantity' => 'integer',
        'current_quantity' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'days_until_expiry',
        'expiry_status',
        'is_expired',
    ];

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Manufacturer::class, 'supplier_id');
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function stockAdjustments(): HasMany
    {
        return $this->hasMany(StockAdjustment::class);
    }

    public function getDaysUntilExpiryAttribute(): int
    {
        return (int) Carbon::now()->startOfDay()->diffInDays($this->expiry_date->startOfDay(), false);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->days_until_expiry <= 0;
    }

    public function getExpiryStatusAttribute(): string
    {
        $days = $this->days_until_expiry;
        if ($days <= 0) {
            return 'expired';
        }
        if ($days <= 30) {
            return 'critical';
        }
        if ($days <= 90) {
            return 'warning';
        }
        return 'good';
    }

    public function scopeActiveFefo(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->where('expiry_date', '>', Carbon::now()->toDateString())
            ->orderBy('expiry_date', 'asc');
    }

    public function scopeNearExpiry(Builder $query, int $days = 30): Builder
    {
        return $query->where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->whereBetween('expiry_date', [
                Carbon::now()->toDateString(),
                Carbon::now()->addDays($days)->toDateString(),
            ]);
    }
}
