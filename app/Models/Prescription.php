<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_number',
        'customer_id',
        'user_id',
        'doctor_name',
        'doctor_reg_number',
        'hospital_name',
        'prescription_date',
        'image_path',
        'raw_ocr_json',
        'ai_extracted_data',
        'status',
        'notes',
    ];

    protected $casts = [
        'prescription_date' => 'date',
        'raw_ocr_json' => 'array',
        'ai_extracted_data' => 'array',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
