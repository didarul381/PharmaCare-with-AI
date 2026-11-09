<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Generates realistic POS sales for the last 30 days (including today) so the
 * dashboard, reports and invoice ledger have data for screenshots / live demo.
 *
 * Idempotent: re-running removes previously generated demo invoices (INV-*-D*)
 * and creates a fresh set relative to the current date.
 *
 *   php artisan db:seed --class=DemoSalesSeeder
 */
class DemoSalesSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(20261109);

        $demoIds = DB::table('sales')->where('invoice_number', 'like', 'INV-%-D%')->pluck('id');
        DB::table('sale_payments')->whereIn('sale_id', $demoIds)->delete();
        DB::table('sale_items')->whereIn('sale_id', $demoIds)->delete();
        DB::table('sales')->whereIn('id', $demoIds)->delete();

        $batches = Batch::with('medicine')
            ->where('is_active', true)
            ->where('current_quantity', '>', 0)
            ->whereDate('expiry_date', '>', now())
            ->get();

        if ($batches->isEmpty()) {
            $this->command?->warn('No active batches found — run DatabaseSeeder first.');
            return;
        }

        // A handful of "bestsellers" get picked more often so the Top-10 report looks realistic.
        $popular = $batches->shuffle()->take(8)->values();
        $staffIds = User::whereIn('role', ['cashier', 'pharmacist', 'super_admin'])->pluck('id')->all();
        $customerIds = Customer::pluck('id')->all();
        $methods = ['cash', 'cash', 'cash', 'card', 'bKash', 'bKash', 'nagad'];
        $units = ['Strip', 'Strip', 'Piece', 'Box'];

        $counter = 0;
        for ($daysAgo = 29; $daysAgo >= 0; $daysAgo--) {
            $day = Carbon::today()->subDays($daysAgo);
            // gentle upward trend + weekend bump
            $count = mt_rand(7, 11) + intdiv(29 - $daysAgo, 8) + ($day->isFriday() ? 3 : 0);
            $latestHour = $daysAgo === 0 ? max(9, min(21, now()->hour)) : 22;

            for ($n = 0; $n < $count; $n++) {
                $counter++;
                $at = $day->copy()->setTime(mt_rand(9, $latestHour), mt_rand(0, 59), mt_rand(0, 59));
                if ($at->isFuture()) {
                    $at = now()->subMinutes(mt_rand(5, 300));
                }

                $lines = [];
                $subtotal = 0;
                foreach (range(1, mt_rand(1, 4)) as $_) {
                    $batch = mt_rand(1, 100) <= 55 ? $popular->random() : $batches->random();
                    $qty = mt_rand(1, 100) <= 70 ? mt_rand(1, 6) : mt_rand(8, 30);
                    $total = round($qty * $batch->selling_price, 2);
                    $subtotal += $total;
                    $lines[] = [
                        'medicine_id' => $batch->medicine_id,
                        'batch_id' => $batch->id,
                        'unit_name' => $units[array_rand($units)],
                        'quantity' => $qty,
                        'unit_price' => $batch->selling_price,
                        'cost_price' => $batch->cost_price,
                        'discount_amount' => 0,
                        'tax_amount' => round($total * 0.05, 2),
                        'total_price' => $total,
                        'created_at' => $at,
                        'updated_at' => $at,
                    ];
                }

                $discount = mt_rand(1, 100) <= 20 ? round($subtotal * 0.05, 2) : 0;
                $tax = round(($subtotal - $discount) * 0.05, 2);
                $grand = round($subtotal - $discount + $tax, 2);

                $method = $methods[array_rand($methods)];
                $customerId = ($customerIds && mt_rand(1, 100) <= 45) ? $customerIds[array_rand($customerIds)] : null;
                $isCredit = $customerId && mt_rand(1, 100) <= 12;
                $paid = $isCredit ? round($grand * (mt_rand(0, 6) / 10), 2) : ($method === 'cash' ? ceil($grand / 10) * 10 : $grand);
                $due = max(0, round($grand - $paid, 2));
                $returned = !$isCredit && mt_rand(1, 100) <= 2;

                $saleId = DB::table('sales')->insertGetId([
                    'invoice_number' => sprintf('INV-%s-D%04d', $at->format('Ymd'), $counter),
                    'customer_id' => $customerId,
                    'user_id' => $staffIds[array_rand($staffIds)],
                    'subtotal' => round($subtotal, 2),
                    'discount_type' => 'percentage',
                    'discount_value' => $discount ? 5 : 0,
                    'discount_amount' => $discount,
                    'tax_percentage' => 5,
                    'tax_amount' => $tax,
                    'grand_total' => $grand,
                    'paid_amount' => $paid,
                    'change_amount' => max(0, round($paid - $grand, 2)),
                    'due_amount' => $due,
                    'payment_method' => $isCredit ? 'credit' : $method,
                    'payment_status' => $returned ? 'refunded' : ($due <= 0 ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid')),
                    'is_returned' => $returned,
                    'created_at' => $at,
                    'updated_at' => $at,
                ]);

                DB::table('sale_items')->insert(array_map(fn ($l) => $l + ['sale_id' => $saleId], $lines));

                if ($paid > 0) {
                    DB::table('sale_payments')->insert([
                        'sale_id' => $saleId,
                        'payment_method' => $method,
                        'amount' => min($paid, $grand),
                        'transaction_reference' => in_array($method, ['bKash', 'nagad'], true) ? strtoupper(substr(md5((string) $counter), 0, 10)) : null,
                        'card_last_four' => $method === 'card' ? (string) mt_rand(1000, 9999) : null,
                        'created_at' => $at,
                    ]);
                }
            }
        }

        $this->command?->info("Generated {$counter} demo sales across the last 30 days.");
    }
}
