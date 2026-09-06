<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'short_name',
    ];

    public function primaryMedicines(): HasMany
    {
        return $this->hasMany(Medicine::class, 'primary_unit_id');
    }

    public function secondaryMedicines(): HasMany
    {
        return $this->hasMany(Medicine::class, 'secondary_unit_id');
    }
}
