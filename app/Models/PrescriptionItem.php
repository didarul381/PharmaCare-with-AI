<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'medicine_id',
        'drug_name_raw',
        'dosage',
        'frequency',
        'duration_days',
        'quantity',
        'instructions',
        'match_confidence',
        'is_dispensed',
    ];

    protected $casts = [
        'duration_days' => 'integer',
        'quantity' => 'integer',
        'match_confidence' => 'decimal:2',
        'is_dispensed' => 'boolean',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
