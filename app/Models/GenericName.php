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
        'pregnancy_category',
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
}
