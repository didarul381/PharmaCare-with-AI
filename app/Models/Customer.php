<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'total_credit',
        'credit_limit',
        'loyalty_points',
    ];

    protected $casts = [
        'total_credit' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'loyalty_points' => 'integer',
    ];

    protected $appends = [
        'credit_balance',
    ];

    public function getCreditBalanceAttribute(): float
    {
        return (float) ($this->total_credit ?? 0);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }
}
