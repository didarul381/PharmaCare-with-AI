<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Category;
use App\Models\DosageForm;
use App\Models\Unit;
use App\Models\Manufacturer;
use App\Models\GenericName;
use App\Models\DrugInteraction;
use App\Models\Medicine;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\StockAdjustment;
use App\Models\AuditLog;

/**
 * Full DEMO dataset: sample staff (password "password"), medicines, batches,
 * customers and sales. Use for the live demo and local development only —
 * real installations use `php artisan pharmacare:install` instead.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users & Staff
        $admin = User::firstOrCreate(
            ['email' => 'admin@pharmacare.ai'],
            [
                'name' => 'Dr. Alexander Vance',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'phone' => '+1 (555) 019-2834',
                'avatar' => 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
                'is_active' => true,
            ]
        );

        $pharmacist = User::firstOrCreate(
            ['email' => 'pharmacist@pharmacare.ai'],
            [
                'name' => 'Dr. Elena Rostova',
                'password' => Hash::make('password'),
                'role' => 'pharmacist',
                'phone' => '+1 (555) 014-9821',
                'avatar' => 'https://images.unsplash.com/photo-1594824813580-0a2b896944e8?w=150&auto=format&fit=crop&q=80',
                'is_active' => true,
            ]
        );

        $cashier = User::firstOrCreate(
            ['email' => 'cashier@pharmacare.ai'],
            [
                'name' => 'Marcus Chen',
                'password' => Hash::make('password'),
                'role' => 'cashier',
                'phone' => '+1 (555) 018-7744',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'is_active' => true,
            ]
        );

        $inventoryManager = User::firstOrCreate(
            ['email' => 'inventory@pharmacare.ai'],
            [
                'name' => 'Tariq Al-Mansoor',
                'password' => Hash::make('password'),
                'role' => 'inventory_manager',
                'phone' => '+1 (555) 012-4491',
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'is_active' => true,
            ]
        );

        // 2–7. Reference data (categories, forms, units, manufacturers, generics, DDI rules)
        $this->call(MasterDataSeeder::class);

        // Demo store profile (shown on receipts & invoices)
        \App\Models\StoreSetting::getSettings()->update([
            'store_name' => 'PharmaCare Demo Pharmacy',
            'store_tagline' => 'Your neighbourhood pharmacy',
            'address' => 'House 12, Road 4, Dhanmondi, Dhaka-1205',
            'phone' => '+880 1711-000000',
            'email' => 'hello@pharmacare.example',
            'drug_license_no' => 'Drug Lic: DL-89410',
            'vat_reg_no' => 'BIN: 002948192-0101',
            'receipt_footer' => 'Thank you! Get well soon.',
        ]);

        $categoryModels = Category::all()->keyBy('slug')->all();
        $formModels = DosageForm::all()->keyBy('name')->all();
        $unitModels = Unit::all()->keyBy('name')->all();
        $mfgModels = Manufacturer::all()->keyBy('name')->all();
        $genericModels = GenericName::all()->keyBy('name')->all();

        // Demo suppliers (one per seeded manufacturer)
        $supplierModels = [];
        foreach (MasterDataSeeder::MANUFACTURERS as $mfg) {
            $supplierModels[$mfg['name']] = Supplier::firstOrCreate(['company_code' => $mfg['code']], [
                'name' => $mfg['name'],
                'contact_person' => $mfg['contact_person'],
                'email' => $mfg['email'],
                'phone' => $mfg['phone'],
                'address' => $mfg['address'],
                'tax_registration_number' => 'TRN-' . rand(1000000, 9999999),
                'total_payable' => 4500.00,
                'total_paid' => 12000.00,
                'is_active' => true,
            ]);
        }

        // 8. Realistic Medicines Catalog
        $medicinesCatalog = [
            // Core Antenatal Prescription items (Prof. Dr. Joysree Saha Rx)
            [
                'name' => 'Zeefol-CI',
                'brand_name' => 'Zeefol-CI Timed Release Capsule',
                'sku' => 'MED-ZEE-001',
                'barcode' => '894110200001',
                'generic' => 'Carbonyl Iron + Folic Acid + Zinc Sulfate Monohydrate',
                'category' => 'obstetrics-gynae',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Capsule',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3, // 30 caps = 3 strips of 10
                'strength' => '50mg + 0.5mg + 61.8mg',
                'min_stock' => 50,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'ZF7719', 'days' => 240, 'cost' => 6.00, 'sell' => 8.50, 'qty' => 350],
                ],
            ],
            [
                'name' => 'Momvit',
                'brand_name' => 'Momvit Antenatal & Nursing Essentials',
                'sku' => 'MED-MOM-002',
                'barcode' => '894110200002',
                'generic' => 'Multivitamin & Multimineral Essentials (For nursing mother)',
                'category' => 'vitamins',
                'mfg' => 'Incepta Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => 'Standard Prenatal Formula',
                'min_stock' => 40,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'MV9012', 'days' => 300, 'cost' => 5.00, 'sell' => 7.00, 'qty' => 400],
                ],
            ],
            [
                'name' => 'Natcoral Dx',
                'brand_name' => 'Natcoral Dx Coral Calcium + D3',
                'sku' => 'MED-NAT-003',
                'barcode' => '894110200003',
                'generic' => 'Calcium Orotate + Vitamin D3 (Coral Calcium)',
                'category' => 'vitamins',
                'mfg' => 'Renata Limited',
                'form' => 'Tablet',
                'primary_unit' => 'Bottle',
                'secondary_unit' => 'Bottle',
                'conversion_rate' => 1,
                'strength' => '500mg + 200 IU',
                'min_stock' => 30,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'NC4410', 'days' => 180, 'cost' => 180.00, 'sell' => 240.00, 'qty' => 120],
                ],
            ],
            [
                'name' => 'Biofol 5mg',
                'brand_name' => 'Biofol Calcium Folinate',
                'sku' => 'MED-BIO-004',
                'barcode' => '894110200004',
                'generic' => 'Calcium Folinate (Folinic Acid)',
                'category' => 'obstetrics-gynae',
                'mfg' => 'Beximco Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '5mg',
                'min_stock' => 25,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'BF3312', 'days' => 200, 'cost' => 8.00, 'sell' => 11.00, 'qty' => 180],
                ],
            ],
            [
                'name' => 'Dicliz plus 20mg',
                'brand_name' => 'Dicliz Plus (Doxylamine + Pyridoxine)',
                'sku' => 'MED-DIC-005',
                'barcode' => '894110200005',
                'generic' => 'Doxylamine Succinate + Pyridoxine HCl',
                'category' => 'obstetrics-gynae',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '10mg + 10mg',
                'min_stock' => 35,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'DC5501', 'days' => 365, 'cost' => 7.50, 'sell' => 10.00, 'qty' => 250],
                ],
            ],
            [
                'name' => 'Progut 20mg',
                'brand_name' => 'Progut Esomeprazole MUPS',
                'sku' => 'MED-PRO-006',
                'barcode' => '894110200006',
                'generic' => 'Esomeprazole',
                'category' => 'gastrointestinal',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Capsule',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '20mg',
                'min_stock' => 50,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'PG8810', 'days' => 120, 'cost' => 5.20, 'sell' => 7.00, 'qty' => 450],
                ],
            ],
            [
                'name' => 'Viset 50mg',
                'brand_name' => 'Viset Tiemonium Methylsulphate',
                'sku' => 'MED-VIS-007',
                'barcode' => '894110200007',
                'generic' => 'Tiemonium Methylsulphate',
                'category' => 'gastrointestinal',
                'mfg' => 'Popular Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 5,
                'strength' => '50mg',
                'min_stock' => 40,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'VS2026', 'days' => 210, 'cost' => 6.50, 'sell' => 9.00, 'qty' => 300],
                ],
            ],
            [
                'name' => 'Avolac 3.35 gm/5 ml Solution',
                'brand_name' => 'Avolac Lactulose Solution',
                'sku' => 'MED-AVO-008',
                'barcode' => '894110200008',
                'generic' => 'Lactulose Solution',
                'category' => 'gastrointestinal',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Oral Solution',
                'primary_unit' => 'Bottle',
                'secondary_unit' => 'Bottle',
                'conversion_rate' => 1,
                'strength' => '3.35g/5ml (100ml)',
                'min_stock' => 20,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'AV9901', 'days' => 260, 'cost' => 110.00, 'sell' => 145.00, 'qty' => 80],
                ],
            ],
            [
                'name' => 'Bexidal 50mg',
                'brand_name' => 'Bexidal Mebhydrolin',
                'sku' => 'MED-BEX-009',
                'barcode' => '894110200009',
                'generic' => 'Mebhydrolin Napadisylate',
                'category' => 'respiratory',
                'mfg' => 'Beximco Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '50mg',
                'min_stock' => 30,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'BX1102', 'days' => 320, 'cost' => 4.00, 'sell' => 5.50, 'qty' => 220],
                ],
            ],

            // Other general medications
            [
                'name' => 'Napa Extra',
                'brand_name' => 'Napa Extra 500mg/65mg',
                'sku' => 'MED-NAP-001',
                'barcode' => '894110010001',
                'generic' => 'Paracetamol + Caffeine',
                'category' => 'analgesics',
                'mfg' => 'Beximco Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 20,
                'strength' => '500mg + 65mg',
                'min_stock' => 50,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'FEX81681', 'days' => 12, 'cost' => 2.10, 'sell' => 2.80, 'qty' => 120],
                    ['batch' => 'FE301081', 'days' => 90, 'cost' => 2.10, 'sell' => 2.80, 'qty' => 450],
                ],
            ],
            [
                'name' => 'Napa 500mg',
                'brand_name' => 'Napa Regular',
                'sku' => 'MED-NAP-002',
                'barcode' => '894110010002',
                'generic' => 'Paracetamol',
                'category' => 'analgesics',
                'mfg' => 'Beximco Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 50,
                'strength' => '500mg',
                'min_stock' => 100,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'FE301061', 'days' => 18, 'cost' => 0.90, 'sell' => 1.20, 'qty' => 180],
                    ['batch' => 'FE501061', 'days' => 180, 'cost' => 0.90, 'sell' => 1.20, 'qty' => 600],
                ],
            ],
            [
                'name' => 'Seclo 20mg',
                'brand_name' => 'Seclo Omeprazole',
                'sku' => 'MED-SEC-020',
                'barcode' => '894110020020',
                'generic' => 'Omeprazole',
                'category' => 'gastrointestinal',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Capsule',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 10,
                'strength' => '20mg',
                'min_stock' => 30,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'SC99102', 'days' => 45, 'cost' => 4.20, 'sell' => 6.00, 'qty' => 240],
                ],
            ],
            [
                'name' => 'Fexo 120mg',
                'brand_name' => 'Fexo Antihistamine',
                'sku' => 'MED-FEX-120',
                'barcode' => '894110040120',
                'generic' => 'Fexofenadine HCl',
                'category' => 'respiratory',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 5,
                'strength' => '120mg',
                'min_stock' => 20,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'FX351081', 'days' => 16, 'cost' => 7.00, 'sell' => 9.50, 'qty' => 30],
                    ['batch' => 'FX501061', 'days' => 60, 'cost' => 7.00, 'sell' => 9.50, 'qty' => 150],
                ],
            ],
            [
                'name' => 'Ciprocin 500mg',
                'brand_name' => 'Ciprocin Ciprofloxacin',
                'sku' => 'MED-CIP-500',
                'barcode' => '894110050500',
                'generic' => 'Ciprofloxacin',
                'category' => 'antibiotics',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '500mg',
                'min_stock' => 25,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'CP77102', 'days' => 28, 'cost' => 12.00, 'sell' => 16.00, 'qty' => 45],
                ],
            ],
            [
                'name' => 'Antacid Max Liquid',
                'brand_name' => 'Antacid Plus Mint',
                'sku' => 'MED-ANT-200',
                'barcode' => '894110080200',
                'generic' => 'Aluminum Hydroxide + Magnesium (Antacid)',
                'category' => 'gastrointestinal',
                'mfg' => 'Beximco Pharmaceuticals Ltd.',
                'form' => 'Oral Suspension',
                'primary_unit' => 'Bottle',
                'secondary_unit' => 'Bottle',
                'conversion_rate' => 1,
                'strength' => '200ml',
                'min_stock' => 10,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'ANT2201', 'days' => 210, 'cost' => 65.00, 'sell' => 85.00, 'qty' => 60],
                ],
            ],
        ];

        foreach ($medicinesCatalog as $item) {
            $cat = $categoryModels[$item['category']] ?? null;
            $gen = $genericModels[$item['generic']] ?? null;
            $mfg = $mfgModels[$item['mfg']] ?? null;
            $form = $formModels[$item['form']] ?? null;
            $primUnit = $unitModels[$item['primary_unit']] ?? null;
            $secUnit = $unitModels[$item['secondary_unit']] ?? null;

            $med = Medicine::create([
                'name' => $item['name'],
                'brand_name' => $item['brand_name'],
                'sku' => $item['sku'],
                'barcode' => $item['barcode'],
                'generic_name_id' => $gen?->id,
                'category_id' => $cat?->id,
                'manufacturer_id' => $mfg?->id,
                'dosage_form_id' => $form?->id,
                'primary_unit_id' => $primUnit?->id,
                'secondary_unit_id' => $secUnit?->id,
                'unit_conversion_rate' => $item['conversion_rate'],
                'strength' => $item['strength'],
                'min_stock_alert' => $item['min_stock'],
                'is_prescription_required' => $item['is_rx'],
                'is_controlled_substance' => $item['is_controlled'] ?? false,
                'is_active' => true,
            ]);

            foreach ($item['batches'] as $b) {
                Batch::create([
                    'medicine_id' => $med->id,
                    'batch_number' => $b['batch'],
                    'expiry_date' => Carbon::now()->addDays($b['days'])->toDateString(),
                    'cost_price' => $b['cost'],
                    'selling_price' => $b['sell'],
                    'initial_quantity' => $b['qty'] * 2,
                    'current_quantity' => $b['qty'],
                    'supplier_id' => $mfg?->id,
                    'is_active' => true,
                ]);
            }
        }

        // 9. Customers
        $customers = [
            ['name' => 'Mrs. Shamima Yasmin', 'phone' => '+880 1711-310326', 'email' => 'shamima.yasmin@gmail.com', 'credit' => 0.00, 'limit' => 5000, 'loyalty' => 150],
            ['name' => 'Zubair Al-Hassan', 'phone' => '+880 1711-234567', 'email' => 'zubair@example.com', 'credit' => 0.00, 'limit' => 5000, 'loyalty' => 120],
            ['name' => 'Samantha Reed', 'phone' => '+880 1812-987654', 'email' => 'samantha.r@example.com', 'credit' => 240.00, 'limit' => 3000, 'loyalty' => 85],
        ];

        $customerModels = [];
        foreach ($customers as $c) {
            $customerModels[] = Customer::create([
                'name' => $c['name'],
                'phone' => $c['phone'],
                'email' => $c['email'],
                'total_credit' => $c['credit'],
                'credit_limit' => $c['limit'],
                'loyalty_points' => $c['loyalty'],
            ]);
        }

        // 10. Sample Recent POS Sales for Analytics
        $napaExtra = Medicine::where('sku', 'MED-NAP-001')->first();
        $seclo = Medicine::where('sku', 'MED-SEC-020')->first();

        if ($napaExtra && $seclo) {
            $sale1 = Sale::create([
                'invoice_number' => 'INV-20260906-0001',
                'customer_id' => $customerModels[0]->id,
                'user_id' => $cashier->id,
                'subtotal' => 114.00,
                'discount_type' => 'fixed',
                'discount_value' => 0.00,
                'discount_amount' => 0.00,
                'tax_percentage' => 5.00,
                'tax_amount' => 5.70,
                'grand_total' => 119.70,
                'paid_amount' => 120.00,
                'change_amount' => 0.30,
                'due_amount' => 0.00,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'created_at' => Carbon::now()->subHours(3),
            ]);

            $batch1 = $napaExtra->batches()->first();

            if ($batch1) {
                SaleItem::create([
                    'sale_id' => $sale1->id,
                    'medicine_id' => $napaExtra->id,
                    'batch_id' => $batch1->id,
                    'unit_name' => 'Strip',
                    'quantity' => 15,
                    'unit_price' => $batch1->selling_price,
                    'cost_price' => $batch1->cost_price,
                    'discount_amount' => 0,
                    'tax_amount' => 2.10,
                    'total_price' => 15 * $batch1->selling_price,
                ]);
            }

            SalePayment::create([
                'sale_id' => $sale1->id,
                'payment_method' => 'cash',
                'amount' => 120.00,
                'created_at' => Carbon::now()->subHours(3),
            ]);
        }

        // 11. Initial Audit Log
        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'system_seed_init',
            'entity_type' => 'System',
            'entity_id' => 1,
            'new_values' => ['status' => 'Master pharmaceutical catalog initialized successfully with Antenatal and Obstetric extensions.'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PharmaCare AI Clinical Engine/1.0',
            'created_at' => Carbon::now(),
        ]);
    }
}
