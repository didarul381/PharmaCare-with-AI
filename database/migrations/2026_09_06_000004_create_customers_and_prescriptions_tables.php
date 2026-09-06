<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->index();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->decimal('total_credit', 12, 2)->default(0);
            $table->decimal('credit_limit', 12, 2)->default(5000);
            $table->unsignedInteger('loyalty_points')->default(0);
            $table->timestamps();
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->string('prescription_number')->unique();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // Uploaded / verified by
            $table->string('doctor_name')->nullable();
            $table->string('doctor_reg_number')->nullable();
            $table->string('hospital_name')->nullable();
            $table->date('prescription_date')->nullable();
            $table->string('image_path')->nullable();
            $table->json('raw_ocr_json')->nullable();
            $table->json('ai_extracted_data')->nullable();
            $table->enum('status', ['pending', 'verified', 'dispensed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('medicine_id')->nullable()->constrained('medicines')->nullOnDelete();
            $table->string('drug_name_raw');
            $table->string('dosage')->nullable(); // 500mg
            $table->string('frequency')->nullable(); // 1+0+1, 3 times a day
            $table->unsignedInteger('duration_days')->default(1);
            $table->unsignedInteger('quantity')->default(1);
            $table->string('instructions')->nullable(); // Before meal, After meal
            $table->decimal('match_confidence', 5, 2)->default(0); // 0.00 to 100.00 %
            $table->boolean('is_dispensed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('customers');
    }
};
