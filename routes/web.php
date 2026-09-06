<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\AiInsightsController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;

// Authentication
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// User Profile
Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');

// Staff & Role Management (Super Admin)
Route::prefix('users')->name('users.')->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('index');
    Route::post('/', [UserController::class, 'store'])->name('store');
    Route::put('/{user}', [UserController::class, 'update'])->name('update');
    Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
});

// Dashboard
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// Role Switcher (RBAC Demo & Staff Switching)
Route::post('/switch-role', [RoleController::class, 'switchRole'])->name('switch-role');

// Settings & Store Profile
Route::prefix('settings')->name('settings.')->group(function () {
    Route::get('/', [SettingController::class, 'index'])->name('index');
    Route::post('/update', [SettingController::class, 'update'])->name('update');
});

// Inventory
Route::prefix('inventory')->name('inventory.')->group(function () {
    Route::get('/', [InventoryController::class, 'index'])->name('index');
    Route::post('/medicines', [InventoryController::class, 'storeMedicine'])->name('medicines.store');
    Route::delete('/medicines/{medicine}', [InventoryController::class, 'destroyMedicine'])->name('medicines.destroy');
    Route::post('/batches', [InventoryController::class, 'storeBatch'])->name('batches.store');
    Route::post('/adjust-stock', [InventoryController::class, 'adjustStock'])->name('adjust-stock');
    Route::post('/quick-generic', [InventoryController::class, 'quickCreateGeneric'])->name('quick-generic');
    Route::post('/quick-category', [InventoryController::class, 'quickCreateCategory'])->name('quick-category');
    Route::post('/quick-manufacturer', [InventoryController::class, 'quickCreateManufacturer'])->name('quick-manufacturer');
    Route::post('/quick-dosage-form', [InventoryController::class, 'quickCreateDosageForm'])->name('quick-dosage-form');
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
    Route::delete('/clear-all', [PrescriptionController::class, 'clearAll'])->name('clear-all');
    Route::post('/bulk-delete', [PrescriptionController::class, 'bulkDelete'])->name('bulk-delete');
    Route::get('/{prescription}', [PrescriptionController::class, 'show'])->name('show');
    Route::delete('/{prescription}', [PrescriptionController::class, 'destroy'])->name('destroy');
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
