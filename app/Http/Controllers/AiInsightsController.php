<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\GenericName;
use App\Models\DrugInteraction;
use App\Services\Ai\DemandForecastService;
use App\Services\Ai\DrugInteractionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class AiInsightsController extends Controller
{
    public function __construct(
        protected DemandForecastService $forecastService,
        protected DrugInteractionService $interactionService
    ) {}

    public function index(): Response
    {
        $forecast = $this->forecastService->generateForecast();
        $generics = GenericName::all();
        $interactions = DrugInteraction::with(['genericA', 'genericB'])->get();

        return Inertia::render('AiInsights/Index', [
            'forecast' => $forecast,
            'generics' => $generics,
            'interactions' => $interactions,
        ]);
    }

    public function testDdi(Request $request): JsonResponse
    {
        $genericAId = $request->input('generic_a_id');
        $genericBId = $request->input('generic_b_id');

        $interaction = DrugInteraction::with(['genericA', 'genericB'])
            ->where(function ($q) use ($genericAId, $genericBId) {
                $q->where('generic_a_id', $genericAId)->where('generic_b_id', $genericBId);
            })
            ->orWhere(function ($q) use ($genericAId, $genericBId) {
                $q->where('generic_a_id', $genericBId)->where('generic_b_id', $genericAId);
            })
            ->first();

        if ($interaction) {
            return response()->json([
                'has_interaction' => true,
                'interaction' => $interaction,
            ]);
        }

        return response()->json([
            'has_interaction' => false,
            'message' => 'No known clinical contraindication or severe interaction detected for this drug pair.',
        ]);
    }
}
