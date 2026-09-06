<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\AiInsightsController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\AuditLogController;

// Dashboard
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// Inventory
Route::prefix('inventory')->name('inventory.')->group(function () {
    Route::get('/', [InventoryController::class, 'index'])->name('index');
    Route::post('/medicines', [InventoryController::class, 'storeMedicine'])->name('medicines.store');
    Route::post('/batches', [InventoryController::class, 'storeBatch'])->name('batches.store');
    Route::post('/adjust-stock', [InventoryController::class, 'adjustStock'])->name('adjust-stock');
});

// POS & Dispensing
Route::prefix('pos')->name('pos.')->group(function () {
    Route::get('/', [PosController::class, 'index'])->name('index');
    Route::get('/barcode-lookup', [PosController::class, 'lookupBarcode'])->name('barcode-lookup');
    Route::post('/check-safety', [PosController::class, 'checkCartSafety'])->name('check-safety');
    Route::post('/checkout', [PosController::class, 'checkout'])->name('checkout');
});

// Prescriptions & AI OCR
Route::prefix('prescriptions')->name('prescriptions.')->group(function () {
    Route::get('/', [PrescriptionController::class, 'index'])->name('index');
    Route::post('/parse-image', [PrescriptionController::class, 'parseImage'])->name('parse-image');
    Route::post('/save-ai-key', [PrescriptionController::class, 'saveAiKey'])->name('save-ai-key');
    Route::patch('/{prescription}/status', [PrescriptionController::class, 'updateStatus'])->name('update-status');
});

// AI Intelligence & Safety Shield
Route::prefix('ai-insights')->name('ai-insights.')->group(function () {
    Route::get('/', [AiInsightsController::class, 'index'])->name('index');
    Route::post('/test-ddi', [AiInsightsController::class, 'testDdi'])->name('test-ddi');
});

// Suppliers & Purchase Orders
Route::prefix('suppliers')->name('suppliers.')->group(function () {
    Route::get('/', [SupplierController::class, 'index'])->name('index');
    Route::post('/orders', [SupplierController::class, 'storeOrder'])->name('orders.store');
    Route::post('/orders/{order}/receive-grn', [SupplierController::class, 'receiveGRN'])->name('orders.receive-grn');
});

// Audit Logs & Regulatory Compliance
Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
