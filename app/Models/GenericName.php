<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GenericName extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'therapeutic_class',
        'description',
        'indications',
        'dosage_guidelines',
        'contraindications',
        'side_effects',
        'mechanism_of_action',
        'counseling_points',
        'pregnancy_category',
        'is_controlled',
    ];

    protected $casts = [
        'is_controlled' => 'boolean',
    ];

    public function medicines(): HasMany
    {
        return $this->hasMany(Medicine::class);
    }

    public function interactionsAsPrimary(): HasMany
    {
        return $this->hasMany(DrugInteraction::class, 'generic_a_id');
    }

    public function interactionsAsSecondary(): HasMany
    {
        return $this->hasMany(DrugInteraction::class, 'generic_b_id');
    }

    /**
     * Get all interactions for this generic (as either A or B).
     */
    public function allInteractions()
    {
        return DrugInteraction::where('generic_a_id', $this->id)
            ->orWhere('generic_b_id', $this->id)
            ->with(['genericA', 'genericB']);
    }
}
