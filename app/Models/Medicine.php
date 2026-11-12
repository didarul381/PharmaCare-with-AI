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
        'catalog_code',
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

    /*
     * Stock figures use the already-loaded `batches` relation when present
     * (eager-load active batches) so list screens don't run one query per row.
     */

    public function getTotalStockAttribute(): int
    {
        if ($this->relationLoaded('batches')) {
            return (int) $this->batches->where('is_active', true)->sum('current_quantity');
        }

        return (int) $this->batches()->where('is_active', true)->sum('current_quantity');
    }

    public function getCurrentSellingPriceAttribute(): float
    {
        if ($this->relationLoaded('batches')) {
            $batch = $this->batches
                ->filter(fn ($b) => $b->is_active && $b->current_quantity > 0)
                ->sortBy('expiry_date')
                ->first();
        } else {
            $batch = $this->batches()
                ->where('is_active', true)
                ->where('current_quantity', '>', 0)
                ->orderBy('expiry_date', 'asc')
                ->first();
        }

        return $batch ? (float) $batch->selling_price : 0.00;
    }

    /**
     * Low stock = the medicine has been stocked before and is now at/below its alert level.
     * Catalogue entries that were never stocked are "not stocked yet", not "low".
     */
    public function getIsLowStockAttribute(): bool
    {
        $hasBatches = $this->relationLoaded('batches') ? $this->batches->isNotEmpty() : $this->batches()->exists();

        return $hasBatches && $this->total_stock <= $this->min_stock_alert;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Medicines with sellable stock (active, unexpired batch with quantity). */
    public function scopeInStock(Builder $query): Builder
    {
        return $query->whereHas('batches', fn ($q) => $q->where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->where('expiry_date', '>', now()->toDateString()));
    }

    /** SQL version of is_low_stock — no per-row queries. */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereHas('batches')
            ->whereRaw(
                '(SELECT COALESCE(SUM(b.current_quantity), 0) FROM batches b WHERE b.medicine_id = medicines.id AND b.is_active = ?) <= medicines.min_stock_alert',
                [true],
            );
    }
}
