<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A DGDA-registered drug product from the national catalogue (read-only reference data).
 */
class DrugCatalogItem extends Model
{
    protected $fillable = [
        'code',
        'dar_number',
        'trade_name',
        'generic',
        'strength',
        'generic_raw',
        'dosage_form',
        'company',
        'quality_flag',
    ];

    /**
     * Medicine name as shown at the counter: trade name plus strength when the
     * trade name doesn't already carry it (e.g. "Napa 500 mg", but "Olpres 40").
     */
    public function displayName(): string
    {
        $name = trim($this->trade_name);
        $strength = trim((string) $this->strength);

        if ($strength !== '' && ! preg_match('/\d/', $name) && ! str_contains($strength, '+') && mb_strlen($strength) <= 30) {
            $name .= ' '.$strength;
        }

        return mb_substr($name, 0, 255);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);
        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('trade_name', 'like', "%{$term}%")
                ->orWhere('generic', 'like', "%{$term}%")
                ->orWhere('dar_number', 'like', "{$term}%");
        });
    }
}
