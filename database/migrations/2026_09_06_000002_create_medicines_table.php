<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('brand_name')->nullable();
            $table->string('sku')->unique();
            $table->string('barcode')->nullable()->index();
            $table->foreignId('generic_name_id')->nullable()->constrained('generic_names')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('manufacturer_id')->nullable()->constrained('manufacturers')->nullOnDelete();
            $table->foreignId('dosage_form_id')->nullable()->constrained('dosage_forms')->nullOnDelete();
            
            // Unit conversion & packaging
            $table->foreignId('primary_unit_id')->nullable()->constrained('units')->nullOnDelete(); // e.g., Box
            $table->foreignId('secondary_unit_id')->nullable()->constrained('units')->nullOnDelete(); // e.g., Strip / Piece
            $table->unsignedInteger('unit_conversion_rate')->default(1); // e.g. 1 Box = 10 Strips
            
            $table->string('strength')->nullable(); // e.g., 500mg, 20ml, 10%
            $table->string('storage_condition')->default('Room Temperature (15-25°C)');
            $table->unsignedInteger('min_stock_alert')->default(10);
            
            $table->boolean('is_prescription_required')->default(false);
            $table->boolean('is_controlled_substance')->default(false);
            $table->text('side_effects')->nullable();
            $table->text('usage_instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
