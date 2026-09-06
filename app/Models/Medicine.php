<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Medicine extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'brand_name',
        'sku',
        'barcode',
        'generic_name_id',
        'category_id',
        'manufacturer_id',
        'dosage_form_id',
        'primary_unit_id',
        'secondary_unit_id',
        'unit_conversion_rate',
        'strength',
        'storage_condition',
        'min_stock_alert',
        'is_prescription_required',
        'is_controlled_substance',
        'side_effects',
        'usage_instructions',
        'is_active',
    ];

    protected $casts = [
        'unit_conversion_rate' => 'integer',
        'min_stock_alert' => 'integer',
        'is_prescription_required' => 'boolean',
        'is_controlled_substance' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'total_stock',
        'current_selling_price',
        'is_low_stock',
    ];

    public function genericName(): BelongsTo
    {
        return $this->belongsTo(GenericName::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function manufacturer(): BelongsTo
    {
        return $this->belongsTo(Manufacturer::class);
    }

    public function dosageForm(): BelongsTo
    {
        return $this->belongsTo(DosageForm::class);
    }

    public function primaryUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'primary_unit_id');
    }

    public function secondaryUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'secondary_unit_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    public function activeBatches(): HasMany
    {
        return $this->hasMany(Batch::class)
            ->where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc');
    }

    public function getTotalStockAttribute(): int
    {
        return (int) $this->batches()
            ->where('is_active', true)
            ->sum('current_quantity');
    }

    public function getCurrentSellingPriceAttribute(): float
    {
        $earliestBatch = $this->batches()
            ->where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->first();

        return $earliestBatch ? (float) $earliestBatch->selling_price : 0.00;
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->total_stock <= $this->min_stock_alert;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereHas('batches', function ($q) {
            $q->where('is_active', true);
        }, '<=', 0)->orWhereRaw('(SELECT COALESCE(SUM(current_quantity), 0) FROM batches WHERE batches.medicine_id = medicines.id AND batches.is_active = 1) <= medicines.min_stock_alert');
    }
}
