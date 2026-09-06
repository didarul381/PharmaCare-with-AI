<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'company_code',
        'contact_person',
        'email',
        'phone',
        'address',
        'tax_registration_number',
        'total_payable',
        'total_paid',
        'is_active',
    ];

    protected $casts = [
        'total_payable' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function goodsReceiptNotes(): HasMany
    {
        return $this->hasMany(GoodsReceiptNote::class);
    }
}
