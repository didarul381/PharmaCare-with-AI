<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrugInteraction extends Model
{
    use HasFactory;

    protected $fillable = [
        'generic_a_id',
        'generic_b_id',
        'severity',
        'description',
        'clinical_management',
    ];

    public function genericA(): BelongsTo
    {
        return $this->belongsTo(GenericName::class, 'generic_a_id');
    }

    public function genericB(): BelongsTo
    {
        return $this->belongsTo(GenericName::class, 'generic_b_id');
    }
}
