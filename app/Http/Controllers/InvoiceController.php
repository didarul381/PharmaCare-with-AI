<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Customer;
use App\Models\Batch;
use App\Models\StoreSetting;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;

class InvoiceController extends Controller
{
    /**
     * Display a listing of sales invoices with financial metrics and filters.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status'); // 'all', 'paid', 'partial', 'unpaid', 'returned'
        $paymentMethod = $request->input('payment_method');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Sale::with([
            'customer',
            'user',
            'prescription.doctor',
            'items.medicine.genericName',
            'items.medicine.dosageForm',
            'items.batch',
            'payments',
        ])->latest('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'LIKE', "%{$search}%")
                  ->orWhereHas('customer', fn($c) => $c->where('name', 'LIKE', "%{$search}%")->orWhere('phone', 'LIKE', "%{$search}%"))
                  ->orWhereHas('user', fn($u) => $u->where('name', 'LIKE', "%{$search}%"));
            });
        }

        if ($status && $status !== 'all') {
            if ($status === 'returned') {
                $query->where('is_returned', true);
            } else {
                $query->where('payment_status', $status)->where('is_returned', false);
            }
        }

        if ($paymentMethod) {
            $query->where('payment_method', $paymentMethod);
        }

        if ($startDate) {
            $query->whereDate('created_at', '>=', Carbon::parse($startDate));
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', Carbon::parse($endDate));
        }

        $invoices = $query->take(150)->get();

        $metrics = [
            'total_invoiced' => (float) Sale::where('is_returned', false)->sum('grand_total'),
            'total_collected' => (float) Sale::where('is_returned', false)->sum('paid_amount'),
            'total_dues' => (float) Sale::where('is_returned', false)->sum('due_amount'),
            'total_invoices' => Sale::count(),
            'returned_count' => Sale::where('is_returned', true)->count(),
        ];

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'metrics' => $metrics,
            'settings' => StoreSetting::getSettings(),
            'filters' => [
                'search' => $search,
                'status' => $status ?? 'all',
                'payment_method' => $paymentMethod,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Collect outstanding due payment on a sale invoice.
     */
    public function collectDue(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . max(0.01, (float) $sale->due_amount)],
            'payment_method' => ['required', 'string', 'in:cash,card,bkash,nagad,rocket,bank_transfer'],
            'transaction_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $currentUserId = $request->session()->get('active_user_id') ?? $request->user()?->id;
        $currentUser = $currentUserId ? User::find($currentUserId) : User::first();

        DB::transaction(function () use ($sale, $validated, $currentUser, $request) {
            $amount = (float) $validated['amount'];

            // 1. Record payment
            SalePayment::create([
                'sale_id' => $sale->id,
                'payment_method' => $validated['payment_method'],
                'amount' => $amount,
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'created_at' => Carbon::now(),
            ]);

            // 2. Update Sale ledger
            $oldPaid = $sale->paid_amount;
            $oldDue = $sale->due_amount;

            $newPaid = $oldPaid + $amount;
            $newDue = max(0, $oldDue - $amount);
            $newStatus = $newDue <= 0 ? 'paid' : 'partial';

            $sale->update([
                'paid_amount' => $newPaid,
                'due_amount' => $newDue,
                'payment_status' => $newStatus,
            ]);

            // 3. Update Customer total_credit if customer is linked
            if ($sale->customer_id) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $customer->total_credit = max(0, $customer->total_credit - $amount);
                    $customer->save();
                }
            }

            // 4. Regulatory Audit Log
            AuditLog::create([
                'user_id' => $currentUser?->id ?? 1,
                'action' => 'invoice_due_collected',
                'entity_type' => 'Sale',
                'entity_id' => $sale->id,
                'old_values' => [
                    'invoice_number' => $sale->invoice_number,
                    'paid_amount' => $oldPaid,
                    'due_amount' => $oldDue,
                    'payment_status' => $sale->payment_status,
                ],
                'new_values' => [
                    'invoice_number' => $sale->invoice_number,
                    'collected_amount' => $amount,
                    'payment_method' => $validated['payment_method'],
                    'new_due_balance' => $newDue,
                    'new_status' => $newStatus,
                    'collected_by' => $currentUser?->name ?? 'Staff',
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => Carbon::now(),
            ]);
        });

        return redirect()->back()->with('success', "Due payment of ৳{$validated['amount']} recorded for invoice {$sale->invoice_number}.");
    }

    /**
     * Process return / refund on a sale invoice with batch restocking.
     */
    public function processReturn(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
            'restock_items' => ['boolean'],
            'refund_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $currentUserId = $request->session()->get('active_user_id') ?? $request->user()?->id;
        $currentUser = $currentUserId ? User::find($currentUserId) : User::first();

        DB::transaction(function () use ($sale, $validated, $currentUser, $request) {
            $restock = $validated['restock_items'] ?? true;

            // Restock batch items if requested
            if ($restock) {
                foreach ($sale->items as $item) {
                    if ($item->batch_id) {
                        $batch = Batch::find($item->batch_id);
                        if ($batch) {
                            $batch->current_quantity += $item->quantity;
                            $batch->save();
                        }
                    }
                }
            }

            $sale->update([
                'is_returned' => true,
                'notes' => ($sale->notes ? $sale->notes . " | " : "") . "Returned: " . $validated['reason'],
            ]);

            // Regulatory Audit Log
            AuditLog::create([
                'user_id' => $currentUser?->id ?? 1,
                'action' => 'invoice_returned_refunded',
                'entity_type' => 'Sale',
                'entity_id' => $sale->id,
                'old_values' => [
                    'invoice_number' => $sale->invoice_number,
                    'grand_total' => $sale->grand_total,
                    'paid_amount' => $sale->paid_amount,
                ],
                'new_values' => [
                    'invoice_number' => $sale->invoice_number,
                    'refund_amount' => $validated['refund_amount'],
                    'items_restocked' => $restock,
                    'reason' => $validated['reason'],
                    'processed_by' => $currentUser?->name ?? 'Staff',
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => Carbon::now(),
            ]);
        });

        return redirect()->back()->with('success', "Invoice {$sale->invoice_number} has been marked as returned and refund logged.");
    }
}
