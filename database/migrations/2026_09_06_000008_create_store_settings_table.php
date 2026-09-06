<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name')->default('PharmaCare AI Rx');
            $table->string('store_tagline')->nullable()->default('Enterprise Pharmacy & Healthcare');
            $table->text('address')->nullable()->default('House #12, Road #4, Dhanmondi, Dhaka-1205');
            $table->string('phone')->nullable()->default('+880 2 8833047 | +880 1711-000000');
            $table->string('email')->nullable()->default('contact@pharmacare.com');
            $table->string('drug_license_no')->nullable()->default('FDA/DGDA Lic: 89410');
            $table->string('vat_reg_no')->nullable()->default('BIN: 002948192-0101');
            $table->text('receipt_footer')->nullable()->default('Thank you for choosing PharmaCare AI! Quick healing.');
            $table->decimal('default_tax_rate', 5, 2)->default(5.00);
            $table->string('currency_symbol', 10)->default('৳');
            $table->string('thermal_printer_width', 10)->default('80mm');
            $table->boolean('show_tax_on_receipt')->default(true);
            $table->boolean('show_license_on_receipt')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_settings');
    }
};
