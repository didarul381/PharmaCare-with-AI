<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reference catalogue of DGDA-registered drug products (synced from the
     * DGHS terminology server). Kept separate from `medicines` so tens of
     * thousands of entries never slow down the POS or inventory screens;
     * a pharmacy adds only the products it actually stocks.
     */
    public function up(): void
    {
        Schema::create('drug_catalog_items', function (Blueprint $table) {
            $table->id();
            $table->string('code', 191)->unique();          // DGHS/OCL concept id, e.g. "341-0160-020--tericin"
            $table->string('dar_number', 50)->nullable()->index();
            $table->string('trade_name')->index();
            $table->string('generic')->nullable()->index();
            $table->string('strength')->nullable();
            $table->text('generic_raw')->nullable();
            $table->string('dosage_form', 100)->nullable()->index();
            $table->string('company')->nullable()->index();
            $table->string('quality_flag', 50)->nullable();  // DGDA data notes, e.g. shared_dar
            $table->timestamps();
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->string('catalog_code', 191)->nullable()->index()->after('barcode');
        });
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropIndex(['catalog_code']);
            $table->dropColumn('catalog_code');
        });

        Schema::dropIfExists('drug_catalog_items');
    }
};
