<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('generic_names', function (Blueprint $table) {
            $table->text('indications')->nullable()->after('description');
            $table->text('dosage_guidelines')->nullable()->after('indications');
            $table->text('contraindications')->nullable()->after('dosage_guidelines');
            $table->text('side_effects')->nullable()->after('contraindications');
            $table->text('mechanism_of_action')->nullable()->after('side_effects');
            $table->text('counseling_points')->nullable()->after('mechanism_of_action');
            $table->boolean('is_controlled')->default(false)->after('pregnancy_category');
        });
    }

    public function down(): void
    {
        Schema::table('generic_names', function (Blueprint $table) {
            $table->dropColumn([
                'indications',
                'dosage_guidelines',
                'contraindications',
                'side_effects',
                'mechanism_of_action',
                'counseling_points',
                'is_controlled',
            ]);
        });
    }
};
