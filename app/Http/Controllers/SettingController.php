<?php

namespace App\Http\Controllers;

use App\Models\StoreSetting;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Render the Settings & Store Profile page.
     */
    public function index(): Response
    {
        $settings = StoreSetting::getSettings();

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
            'ai_config' => [
                'has_gemini' => !empty(config('services.gemini.api_key')) || !empty(\Illuminate\Support\Facades\Cache::get('gemini_api_key')),
                'has_openai' => !empty(config('services.openai.api_key')) || !empty(\Illuminate\Support\Facades\Cache::get('openai_api_key')),
            ],
        ]);
    }

    /**
     * Update store settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'store_tagline' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:100',
            'drug_license_no' => 'nullable|string|max:100',
            'vat_reg_no' => 'nullable|string|max:100',
            'receipt_footer' => 'nullable|string|max:500',
            'default_tax_rate' => 'nullable|numeric|min:0|max:100',
            'currency_symbol' => 'nullable|string|max:10',
            'thermal_printer_width' => 'nullable|string|in:80mm,58mm',
            'show_tax_on_receipt' => 'nullable|boolean',
            'show_license_on_receipt' => 'nullable|boolean',
        ]);

        try {
            $settings = StoreSetting::getSettings();
            $oldValues = $settings->toArray();
            $settings->update($validated);
            StoreSetting::clearCache();

            // Audit Log
            $user = $request->user() ?? \App\Models\User::first();
            if ($user) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'update_store_settings',
                    'entity_type' => 'StoreSetting',
                    'entity_id' => $settings->id,
                    'old_values' => $oldValues,
                    'new_values' => $validated,
                    'ip_address' => $request->ip() ?? '127.0.0.1',
                    'user_agent' => $request->userAgent() ?? 'Pharmacy Admin',
                    'created_at' => \Carbon\Carbon::now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Store & Receipt settings updated successfully!',
                'settings' => StoreSetting::getSettings(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Save failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}
