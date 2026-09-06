<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained('medicines')->cascadeOnDelete();
            $table->string('batch_number')->index();
            $table->date('expiry_date')->index();
            $table->decimal('cost_price', 12, 2);
            $table->decimal('selling_price', 12, 2);
            $table->unsignedInteger('initial_quantity')->default(0);
            $table->unsignedInteger('current_quantity')->default(0)->index();
            $table->foreignId('supplier_id')->nullable()->constrained('manufacturers')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Crucial index for FEFO queries with current_quantity > 0 ordered by expiry_date ASC
            $table->index(['medicine_id', 'is_active', 'expiry_date', 'current_quantity'], 'idx_fefo_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
