<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users'); // Cashier / Pharmacist
            $table->foreignId('prescription_id')->nullable()->constrained('prescriptions')->nullOnDelete();
            
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->enum('discount_type', ['percentage', 'fixed'])->default('fixed');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('tax_percentage', 5, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('change_amount', 12, 2)->default(0);
            $table->decimal('due_amount', 12, 2)->default(0);
            
            $table->string('payment_method')->default('cash'); // cash, card, digital_wallet, split, credit
            $table->enum('payment_status', ['paid', 'partial', 'unpaid', 'refunded'])->default('paid');
            $table->text('notes')->nullable();
            $table->boolean('is_returned')->default(false);
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->foreignId('batch_id')->constrained('batches');
            $table->string('unit_name')->default('Unit'); // Box, Strip, Piece
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('cost_price', 12, 2); // To calculate exact gross profit
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2);
            $table->timestamps();
        });

        Schema::create('sale_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->string('payment_method'); // cash, card, bKash, nagad, visa, mastercard
            $table->decimal('amount', 12, 2);
            $table->string('transaction_reference')->nullable();
            $table->string('card_last_four', 4)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
