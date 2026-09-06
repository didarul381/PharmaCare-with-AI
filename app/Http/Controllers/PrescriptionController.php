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
        $aiConfig = $this->parserService->getAiConfig();

        return Inertia::render('Prescriptions/Index', [
            'prescriptions' => $prescriptions,
            'customers' => $customers,
            'ai_config' => $aiConfig,
        ]);
    }

    public function saveAiKey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'openai_api_key' => 'nullable|string',
            'gemini_api_key' => 'nullable|string',
        ]);

        $openaiKey = trim($validated['openai_api_key'] ?? '');
        $geminiKey = trim($validated['gemini_api_key'] ?? '');

        // Persist into runtime Cache
        if (!empty($openaiKey)) {
            \Illuminate\Support\Facades\Cache::forever('openai_api_key', $openaiKey);
        }
        if (!empty($geminiKey)) {
            \Illuminate\Support\Facades\Cache::forever('gemini_api_key', $geminiKey);
        }

        // Persist into .env file if writable
        try {
            $envPath = base_path('.env');
            if (file_exists($envPath) && is_writable($envPath)) {
                $envContent = file_get_contents($envPath);

                if (!empty($openaiKey)) {
                    if (str_contains($envContent, 'OPENAI_API_KEY=')) {
                        $envContent = preg_replace('/OPENAI_API_KEY=.*/', 'OPENAI_API_KEY=' . $openaiKey, $envContent);
                    } else {
                        $envContent .= "\nOPENAI_API_KEY=" . $openaiKey;
                    }
                }

                if (!empty($geminiKey)) {
                    if (str_contains($envContent, 'GEMINI_API_KEY=')) {
                        $envContent = preg_replace('/GEMINI_API_KEY=.*/', 'GEMINI_API_KEY=' . $geminiKey, $envContent);
                    } else {
                        $envContent .= "\nGEMINI_API_KEY=" . $geminiKey;
                    }
                }

                file_put_contents($envPath, $envContent);
            }
        } catch (\Throwable $e) {
            // Silently fallback to cache
        }

        return response()->json([
            'success' => true,
            'message' => 'AI Vision API Keys updated successfully! Live OCR is now active.',
            'ai_config' => $this->parserService->getAiConfig(),
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

        try {
            $result = $this->parserService->parsePrescription($file, $user);

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
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
