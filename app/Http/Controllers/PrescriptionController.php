<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Customer;
use App\Services\Ai\PrescriptionParserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class PrescriptionController extends Controller
{
    public function __construct(
        protected PrescriptionParserService $parserService
    ) {}

    public function index(): Response
    {
        $prescriptions = Prescription::with(['customer', 'user', 'items.medicine.genericName'])
            ->latest()
            ->get();

        $customers = Customer::all();

        return Inertia::render('Prescriptions/Index', [
            'prescriptions' => $prescriptions,
            'customers' => $customers,
        ]);
    }

    public function parseImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'nullable|image|max:10240', // 10MB max
            'image_base64' => 'nullable|string',
        ]);

        $user = $request->user() ?? \App\Models\User::first();
        $file = $request->file('image') ?? $request->input('image_base64');

        $result = $this->parserService->parsePrescription($file, $user);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function updateStatus(Request $request, Prescription $prescription): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,verified,dispensed,cancelled',
        ]);

        $prescription->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => "Prescription status updated to {$validated['status']}.",
            'prescription' => $prescription->fresh(),
        ]);
    }
}
