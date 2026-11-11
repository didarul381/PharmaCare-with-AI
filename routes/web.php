<?php

use App\Http\Controllers\AiInsightsController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClinicalReferenceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Guest routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login.post');
});

/*
|--------------------------------------------------------------------------
| Authenticated routes — every module is checked server-side against the
| role matrix in config/pharmacare.php ("module:<key>" middleware).
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Demo-only staff switcher (returns 404 unless PHARMACARE_DEMO_MODE=true)
    Route::post('/switch-role', [RoleController::class, 'switchRole'])->name('switch-role');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->middleware('demo.block')->name('profile.update');

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->middleware('module:dashboard')->name('dashboard');

    // Clinical Reference & Medicine Dictionary
    Route::prefix('clinical-reference')->name('clinical-reference.')->middleware('module:clinical-reference')->group(function () {
        Route::get('/', [ClinicalReferenceController::class, 'index'])->name('index');
        Route::get('/free-api-search', [ClinicalReferenceController::class, 'freeApiSearch'])->name('free-api-search');
        Route::post('/import-from-api', [ClinicalReferenceController::class, 'importFromApi'])->name('import-from-api');
        Route::post('/check-interactions', [ClinicalReferenceController::class, 'checkInteractions'])->name('check-interactions');
        Route::post('/generics', [ClinicalReferenceController::class, 'store'])->name('generics.store');
        Route::put('/generics/{generic}', [ClinicalReferenceController::class, 'update'])->name('generics.update');
        Route::post('/interactions', [ClinicalReferenceController::class, 'storeInteraction'])->name('interactions.store');
        Route::delete('/interactions/{interaction}', [ClinicalReferenceController::class, 'destroyInteraction'])->middleware('demo.block')->name('interactions.destroy');
    });

    // Reports
    Route::prefix('reports')->name('reports.')->middleware('module:reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/export', [ReportController::class, 'exportCsv'])->name('export');
    });

    // Invoices & Sales Ledger
    Route::prefix('invoices')->name('invoices.')->middleware('module:invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index'])->name('index');
        Route::post('/{sale}/collect-due', [InvoiceController::class, 'collectDue'])->name('collect-due');
        Route::post('/{sale}/return', [InvoiceController::class, 'processReturn'])->name('return');
    });

    // Staff & Roles (super admin)
    Route::prefix('users')->name('users.')->middleware('module:users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::post('/', [UserController::class, 'store'])->middleware('demo.block')->name('store');
        Route::put('/{user}', [UserController::class, 'update'])->middleware('demo.block')->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('demo.block')->name('destroy');
    });

    // Settings & Store Profile (super admin)
    Route::prefix('settings')->name('settings.')->middleware('module:settings')->group(function () {
        Route::get('/', [SettingController::class, 'index'])->name('index');
        Route::post('/update', [SettingController::class, 'update'])->middleware('demo.block')->name('update');
    });

    // Inventory
    Route::prefix('inventory')->name('inventory.')->middleware('module:inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('index');
        Route::post('/medicines', [InventoryController::class, 'storeMedicine'])->name('medicines.store');
        Route::delete('/medicines/{medicine}', [InventoryController::class, 'destroyMedicine'])->middleware('demo.block')->name('medicines.destroy');
        Route::post('/batches', [InventoryController::class, 'storeBatch'])->name('batches.store');
        Route::post('/adjust-stock', [InventoryController::class, 'adjustStock'])->name('adjust-stock');
        Route::post('/quick-generic', [InventoryController::class, 'quickCreateGeneric'])->name('quick-generic');
        Route::post('/quick-category', [InventoryController::class, 'quickCreateCategory'])->name('quick-category');
        Route::post('/quick-manufacturer', [InventoryController::class, 'quickCreateManufacturer'])->name('quick-manufacturer');
        Route::post('/quick-dosage-form', [InventoryController::class, 'quickCreateDosageForm'])->name('quick-dosage-form');
    });

    // POS & Dispensing
    Route::prefix('pos')->name('pos.')->middleware('module:pos')->group(function () {
        Route::get('/', [PosController::class, 'index'])->name('index');
        Route::get('/barcode-lookup', [PosController::class, 'lookupBarcode'])->name('barcode-lookup');
        Route::post('/check-safety', [PosController::class, 'checkCartSafety'])->name('check-safety');
        Route::post('/checkout', [PosController::class, 'checkout'])->name('checkout');
    });

    // Prescriptions & AI OCR
    Route::prefix('prescriptions')->name('prescriptions.')->middleware('module:prescriptions')->group(function () {
        Route::get('/', [PrescriptionController::class, 'index'])->name('index');
        Route::post('/parse-image', [PrescriptionController::class, 'parseImage'])->name('parse-image');
        Route::post('/save-ai-key', [PrescriptionController::class, 'saveAiKey'])->middleware('demo.block')->name('save-ai-key');
        Route::delete('/clear-all', [PrescriptionController::class, 'clearAll'])->middleware('demo.block')->name('clear-all');
        Route::post('/bulk-delete', [PrescriptionController::class, 'bulkDelete'])->middleware('demo.block')->name('bulk-delete');
        Route::get('/{prescription}', [PrescriptionController::class, 'show'])->name('show');
        Route::delete('/{prescription}', [PrescriptionController::class, 'destroy'])->middleware('demo.block')->name('destroy');
        Route::patch('/{prescription}/status', [PrescriptionController::class, 'updateStatus'])->name('update-status');
    });

    // AI Intelligence
    Route::prefix('ai-insights')->name('ai-insights.')->middleware('module:ai-insights')->group(function () {
        Route::get('/', [AiInsightsController::class, 'index'])->name('index');
        Route::post('/test-ddi', [AiInsightsController::class, 'testDdi'])->name('test-ddi');
    });

    // Suppliers & Purchase Orders
    Route::prefix('suppliers')->name('suppliers.')->middleware('module:suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index'])->name('index');
        Route::post('/orders', [SupplierController::class, 'storeOrder'])->name('orders.store');
        Route::post('/orders/{order}/receive-grn', [SupplierController::class, 'receiveGRN'])->name('orders.receive-grn');
    });

    // Audit Logs
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('module:audit-logs')->name('audit-logs.index');
});
