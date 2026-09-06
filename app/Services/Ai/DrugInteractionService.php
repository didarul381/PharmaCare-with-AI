<?php

namespace App\Services\Ai;

use App\Models\Medicine;
use App\Models\DrugInteraction;

class DrugInteractionService
{
    /**
     * Check for Drug-Drug Interactions across a list of medicine IDs in cart.
     *
     * @param array $medicineIds Array of integer medicine IDs
     * @return array Detected interactions with severity ratings, descriptions, and clinical guidance
     */
    public function checkInteractions(array $medicineIds): array
    {
        if (count($medicineIds) < 2) {
            return [
                'has_interactions' => false,
                'max_severity' => 'none',
                'interactions' => [],
            ];
        }

        $medicines = Medicine::with('genericName')
            ->whereIn('id', $medicineIds)
            ->get();

        $genericMap = [];
        foreach ($medicines as $med) {
            if ($med->genericName) {
                $genericMap[$med->generic_name_id] = [
                    'generic_id' => $med->generic_name_id,
                    'generic_name' => $med->genericName->name,
                    'medicine_name' => $med->name,
                    'sku' => $med->sku,
                ];
            }
        }

        $genericIds = array_keys($genericMap);
        if (count($genericIds) < 2) {
            return [
                'has_interactions' => false,
                'max_severity' => 'none',
                'interactions' => [],
            ];
        }

        // Query interactions between generic pairs
        $detected = DrugInteraction::with(['genericA', 'genericB'])
            ->where(function ($query) use ($genericIds) {
                $query->whereIn('generic_a_id', $genericIds)
                      ->whereIn('generic_b_id', $genericIds);
            })
            ->get();

        $results = [];
        $severityRank = ['none' => 0, 'mild' => 1, 'moderate' => 2, 'severe' => 3, 'fatal' => 4];
        $highestSeverity = 'none';

        foreach ($detected as $interaction) {
            $drugA = $genericMap[$interaction->generic_a_id] ?? null;
            $drugB = $genericMap[$interaction->generic_b_id] ?? null;

            if ($drugA && $drugB) {
                $results[] = [
                    'id' => $interaction->id,
                    'drug_a' => $drugA['medicine_name'],
                    'generic_a' => $interaction->genericA->name,
                    'drug_b' => $drugB['medicine_name'],
                    'generic_b' => $interaction->genericB->name,
                    'severity' => $interaction->severity,
                    'description' => $interaction->description,
                    'clinical_management' => $interaction->clinical_management,
                ];

                if ($severityRank[$interaction->severity] > $severityRank[$highestSeverity]) {
                    $highestSeverity = $interaction->severity;
                }
            }
        }

        return [
            'has_interactions' => count($results) > 0,
            'max_severity' => $highestSeverity,
            'interactions' => $results,
        ];
    }
}
