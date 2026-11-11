<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class StoreSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_name',
        'store_tagline',
        'address',
        'phone',
        'email',
        'drug_license_no',
        'vat_reg_no',
        'receipt_footer',
        'default_tax_rate',
        'currency_symbol',
        'thermal_printer_width',
        'show_tax_on_receipt',
        'show_license_on_receipt',
    ];

    protected $casts = [
        'default_tax_rate' => 'float',
        'show_tax_on_receipt' => 'boolean',
        'show_license_on_receipt' => 'boolean',
    ];

    /**
     * Get or create the singleton store settings record.
     */
    public static function getSettings(): self
    {
        $setting = self::first();

        if (!$setting) {
            // Neutral defaults for a fresh installation — the owner fills these in under Settings.
            $setting = self::create([
                'store_name' => config('app.name') && config('app.name') !== 'Laravel' ? config('app.name') : 'My Pharmacy',
                'store_tagline' => null,
                'address' => null,
                'phone' => null,
                'email' => null,
                'drug_license_no' => null,
                'vat_reg_no' => null,
                'receipt_footer' => 'Thank you! Get well soon.',
                'default_tax_rate' => 5.00,
                'currency_symbol' => '৳',
                'thermal_printer_width' => '80mm',
                'show_tax_on_receipt' => true,
                'show_license_on_receipt' => true,
            ]);
        }

        return $setting;
    }

    /**
     * Clear cached settings.
     */
    public static function clearCache(): void
    {
        Cache::forget('store_settings_singleton');
    }
}
