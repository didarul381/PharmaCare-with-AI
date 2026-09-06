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
            $setting = self::create([
                'store_name' => 'PharmaCare AI Rx',
                'store_tagline' => 'Enterprise Pharmacy & Healthcare',
                'address' => 'House #12, Road #4, Dhanmondi, Dhaka-1205',
                'phone' => '+880 2 8833047 | +880 1711-000000',
                'email' => 'contact@pharmacare.com',
                'drug_license_no' => 'FDA/DGDA Lic: 89410',
                'vat_reg_no' => 'BIN: 002948192-0101',
                'receipt_footer' => 'Thank you for choosing PharmaCare AI! Quick healing.',
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
