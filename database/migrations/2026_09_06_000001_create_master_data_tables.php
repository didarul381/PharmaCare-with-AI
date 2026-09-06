<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('generic_names', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('therapeutic_class')->nullable();
            $table->text('description')->nullable();
            $table->string('pregnancy_category', 10)->nullable();
            $table->timestamps();
        });

        Schema::create('manufacturers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('dosage_forms', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Tablet, Capsule, Syrup, Injection, Cream, Inhaler, Drops, Suspension
            $table->string('icon')->nullable();
            $table->timestamps();
        });

        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Box, Strip, Piece, Bottle, Vial, Tube, Ampoule
            $table->string('short_name'); // Box, Str, Pcs, Btl, Vial, Tube, Amp
            $table->timestamps();
        });

        Schema::create('drug_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generic_a_id')->constrained('generic_names')->cascadeOnDelete();
            $table->foreignId('generic_b_id')->constrained('generic_names')->cascadeOnDelete();
            $table->enum('severity', ['mild', 'moderate', 'severe', 'fatal'])->default('moderate');
            $table->text('description');
            $table->text('clinical_management')->nullable();
            $table->timestamps();

            $table->unique(['generic_a_id', 'generic_b_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drug_interactions');
        Schema::dropIfExists('units');
        Schema::dropIfExists('dosage_forms');
        Schema::dropIfExists('manufacturers');
        Schema::dropIfExists('generic_names');
        Schema::dropIfExists('categories');
    }
};
