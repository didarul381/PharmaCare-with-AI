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

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users & Staff
        $admin = User::firstOrCreate(
            ['email' => 'admin@pharmacare.ai'],
            [
                'name' => 'Dr. Alexander Vance (Super Admin)',
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
                'name' => 'Dr. Elena Rostova (Lead Pharmacist)',
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
                'name' => 'Marcus Chen (Senior Cashier)',
                'password' => Hash::make('password'),
                'role' => 'cashier',
                'phone' => '+1 (555) 018-7744',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'is_active' => true,
            ]
        );

        // 2. Master Categories
        $categories = [
            ['name' => 'Antibiotics & Antimicrobials', 'slug' => 'antibiotics', 'icon' => 'ShieldAlert'],
            ['name' => 'Analgesics & Pain Relief', 'slug' => 'analgesics', 'icon' => 'Activity'],
            ['name' => 'Gastrointestinal & Anti-Ulcer', 'slug' => 'gastrointestinal', 'icon' => 'HeartPulse'],
            ['name' => 'Cardiovascular & Hypertension', 'slug' => 'cardiovascular', 'icon' => 'Heart'],
            ['name' => 'Respiratory & Anti-Allergy', 'slug' => 'respiratory', 'icon' => 'Wind'],
            ['name' => 'Diabetes & Endocrine Care', 'slug' => 'diabetes', 'icon' => 'Droplet'],
            ['name' => 'Vitamins & Dietary Supplements', 'slug' => 'vitamins', 'icon' => 'Sparkles'],
            ['name' => 'Dermatology & Topicals', 'slug' => 'dermatology', 'icon' => 'Layers'],
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[$cat['slug']] = Category::create($cat);
        }

        // 3. Dosage Forms
        $forms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream / Ointment', 'Inhaler', 'Eye / Ear Drops', 'Oral Suspension'];
        $formModels = [];
        foreach ($forms as $form) {
            $formModels[$form] = DosageForm::create(['name' => $form]);
        }

        // 4. Units
        $units = [
            ['name' => 'Box', 'short_name' => 'Box'],
            ['name' => 'Strip', 'short_name' => 'Str'],
            ['name' => 'Piece / Tablet', 'short_name' => 'Pcs'],
            ['name' => 'Bottle', 'short_name' => 'Btl'],
            ['name' => 'Vial', 'short_name' => 'Vial'],
            ['name' => 'Tube', 'short_name' => 'Tube'],
            ['name' => 'Inhaler Device', 'short_name' => 'Dev'],
        ];
        $unitModels = [];
        foreach ($units as $u) {
            $unitModels[$u['name']] = Unit::create($u);
        }

        // 5. Manufacturers & Suppliers
        $manufacturers = [
            [
                'name' => 'Square Pharmaceuticals Ltd.',
                'contact_person' => 'Mohammad Rahman',
                'email' => 'sales@squarepharma.com',
                'phone' => '+880 2 8833047',
                'address' => 'Square Centre, 48 Mohakhali C/A, Dhaka',
                'code' => 'SQR-001',
            ],
            [
                'name' => 'Beximco Pharmaceuticals Ltd.',
                'contact_person' => 'Tanvir Ahmed',
                'email' => 'orders@beximcopharma.com',
                'phone' => '+880 2 58611001',
                'address' => '19 Dhanmondi R/A, Road 7, Dhaka',
                'code' => 'BEX-002',
            ],
            [
                'name' => 'Incepta Pharmaceuticals Ltd.',
                'contact_person' => 'Farhana Kabir',
                'email' => 'contact@inceptapharma.com',
                'phone' => '+880 2 8891688',
                'address' => '40 Shahid Tajuddin Ahmed Sarani, Dhaka',
                'code' => 'INC-003',
            ],
            [
                'name' => 'Renata Limited',
                'contact_person' => 'Sazzad Hossain',
                'email' => 'info@renata-ltd.com',
                'phone' => '+880 2 8001450',
                'address' => 'Plot 1, Milk Vita Road, Section 7, Mirpur, Dhaka',
                'code' => 'REN-004',
            ],
            [
                'name' => 'Pfizer Global Healthcare',
                'contact_person' => 'Sarah Jenkins',
                'email' => 'distributors@pfizer.com',
                'phone' => '+1 (800) 879-3477',
                'address' => '66 Hudson Blvd E, New York, NY 10001',
                'code' => 'PFZ-005',
            ],
        ];

        $mfgModels = [];
        $supplierModels = [];
        foreach ($manufacturers as $mfg) {
            $m = Manufacturer::create([
                'name' => $mfg['name'],
                'contact_person' => $mfg['contact_person'],
                'email' => $mfg['email'],
                'phone' => $mfg['phone'],
                'address' => $mfg['address'],
                'is_active' => true,
            ]);
            $mfgModels[$mfg['name']] = $m;

            $s = Supplier::create([
                'name' => $mfg['name'],
                'company_code' => $mfg['code'],
                'contact_person' => $mfg['contact_person'],
                'email' => $mfg['email'],
                'phone' => $mfg['phone'],
                'address' => $mfg['address'],
                'tax_registration_number' => 'TRN-' . rand(1000000, 9999999),
                'total_payable' => 4500.00,
                'total_paid' => 12000.00,
                'is_active' => true,
            ]);
            $supplierModels[$mfg['name']] = $s;
        }

        // 6. Generic Names
        $genericsData = [
            ['name' => 'Paracetamol', 'therapeutic_class' => 'Analgesic / Antipyretic', 'pregnancy_category' => 'B'],
            ['name' => 'Paracetamol + Caffeine', 'therapeutic_class' => 'Combination Analgesic', 'pregnancy_category' => 'C'],
            ['name' => 'Omeprazole', 'therapeutic_class' => 'Proton Pump Inhibitor (PPI)', 'pregnancy_category' => 'C'],
            ['name' => 'Esomeprazole', 'therapeutic_class' => 'Proton Pump Inhibitor (PPI)', 'pregnancy_category' => 'B'],
            ['name' => 'Fexofenadine HCl', 'therapeutic_class' => 'Second-Generation Antihistamine', 'pregnancy_category' => 'C'],
            ['name' => 'Ciprofloxacin', 'therapeutic_class' => 'Fluoroquinolone Antibiotic', 'pregnancy_category' => 'C'],
            ['name' => 'Azithromycin', 'therapeutic_class' => 'Macrolide Antibiotic', 'pregnancy_category' => 'B'],
            ['name' => 'Montelukast Sodium', 'therapeutic_class' => 'Leukotriene Receptor Antagonist', 'pregnancy_category' => 'B'],
            ['name' => 'Amlodipine Besylate', 'therapeutic_class' => 'Calcium Channel Blocker', 'pregnancy_category' => 'C'],
            ['name' => 'Atorvastatin Calcium', 'therapeutic_class' => 'HMG-CoA Reductase Inhibitor', 'pregnancy_category' => 'X'],
            ['name' => 'Metformin HCl', 'therapeutic_class' => 'Biguanide Antidiabetic', 'pregnancy_category' => 'B'],
            ['name' => 'Aluminum Hydroxide + Magnesium (Antacid)', 'therapeutic_class' => 'Antacid', 'pregnancy_category' => 'B'],
            ['name' => 'Warfarin Sodium', 'therapeutic_class' => 'Anticoagulant', 'pregnancy_category' => 'X'],
            ['name' => 'Aspirin (Acetylsalicylic Acid)', 'therapeutic_class' => 'Antiplatelet / NSAID', 'pregnancy_category' => 'D'],
            ['name' => 'Clopidogrel', 'therapeutic_class' => 'Antiplatelet', 'pregnancy_category' => 'B'],
            ['name' => 'Sildenafil Citrate', 'therapeutic_class' => 'PDE5 Inhibitor', 'pregnancy_category' => 'B'],
            ['name' => 'Nitroglycerin / Glyceryl Trinitrate', 'therapeutic_class' => 'Nitrate Vasodilator', 'pregnancy_category' => 'C'],
        ];

        $genericModels = [];
        foreach ($genericsData as $g) {
            $genericModels[$g['name']] = GenericName::create($g);
        }

        // 7. Clinical Drug-Drug Interactions (Critical Safety Shield)
        $interactions = [
            [
                'generic_a' => 'Ciprofloxacin',
                'generic_b' => 'Aluminum Hydroxide + Magnesium (Antacid)',
                'severity' => 'severe',
                'description' => 'Polyvalent cations (aluminum/magnesium) chelate ciprofloxacin in the GI tract, reducing antibiotic absorption by up to 85%.',
                'clinical_management' => 'Administer ciprofloxacin at least 2 hours before or 6 hours after antacid ingestion.',
            ],
            [
                'generic_a' => 'Warfarin Sodium',
                'generic_b' => 'Aspirin (Acetylsalicylic Acid)',
                'severity' => 'fatal',
                'description' => 'Concurrent anticoagulant and antiplatelet therapy dramatically escalates major hemorrhage and fatal gastrointestinal bleeding risks.',
                'clinical_management' => 'Avoid co-prescription unless under specialized cardiac protocol. Closely monitor INR.',
            ],
            [
                'generic_a' => 'Clopidogrel',
                'generic_b' => 'Omeprazole',
                'severity' => 'severe',
                'description' => 'Omeprazole inhibits CYP2C19, significantly blunting the metabolic activation and antiplatelet efficacy of clopidogrel.',
                'clinical_management' => 'Switch to Pantoprazole or H2-receptor blocker if acid suppression is mandatory.',
            ],
            [
                'generic_a' => 'Sildenafil Citrate',
                'generic_b' => 'Nitroglycerin / Glyceryl Trinitrate',
                'severity' => 'fatal',
                'description' => 'Potentiation of nitric oxide pathway causes catastrophic, potentially fatal systemic hypotension.',
                'clinical_management' => 'Absolute contraindication. Minimum 24-48 hour separation required.',
            ],
            [
                'generic_a' => 'Atorvastatin Calcium',
                'generic_b' => 'Azithromycin',
                'severity' => 'moderate',
                'description' => 'Macrolides may increase systemic exposure of atorvastatin, increasing the risk of rhabdomyolysis and myopathy.',
                'clinical_management' => 'Monitor for unexplained muscle pain, tenderness, or weakness.',
            ],
        ];

        foreach ($interactions as $ddi) {
            if (isset($genericModels[$ddi['generic_a']]) && isset($genericModels[$ddi['generic_b']])) {
                DrugInteraction::create([
                    'generic_a_id' => $genericModels[$ddi['generic_a']]->id,
                    'generic_b_id' => $genericModels[$ddi['generic_b']]->id,
                    'severity' => $ddi['severity'],
                    'description' => $ddi['description'],
                    'clinical_management' => $ddi['clinical_management'],
                ]);
            }
        }

        // 8. Realistic Medicines Catalog
        $medicinesCatalog = [
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
                'conversion_rate' => 20, // 20 strips per box
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
                    ['batch' => 'SC99105', 'days' => 240, 'cost' => 4.20, 'sell' => 6.00, 'qty' => 500],
                ],
            ],
            [
                'name' => 'Maxpro 20mg',
                'brand_name' => 'Maxpro Esomeprazole',
                'sku' => 'MED-MAX-020',
                'barcode' => '894110030020',
                'generic' => 'Esomeprazole',
                'category' => 'gastrointestinal',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 10,
                'strength' => '20mg',
                'min_stock' => 40,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'MP8841', 'days' => 25, 'cost' => 5.50, 'sell' => 7.50, 'qty' => 85],
                    ['batch' => 'MP8890', 'days' => 300, 'cost' => 5.50, 'sell' => 7.50, 'qty' => 400],
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
                    ['batch' => 'FX901022', 'days' => 365, 'cost' => 7.00, 'sell' => 9.50, 'qty' => 320],
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
                    ['batch' => 'CP77509', 'days' => 400, 'cost' => 12.00, 'sell' => 16.00, 'qty' => 200],
                ],
            ],
            [
                'name' => 'Azithrox 500mg',
                'brand_name' => 'Azithrox Azithromycin',
                'sku' => 'MED-AZI-500',
                'barcode' => '894110060500',
                'generic' => 'Azithromycin',
                'category' => 'antibiotics',
                'mfg' => 'Incepta Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '500mg',
                'min_stock' => 15,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'AZ44101', 'days' => 120, 'cost' => 28.00, 'sell' => 35.00, 'qty' => 110],
                ],
            ],
            [
                'name' => 'Monas 10mg',
                'brand_name' => 'Monas Montelukast',
                'sku' => 'MED-MON-010',
                'barcode' => '894110070010',
                'generic' => 'Montelukast Sodium',
                'category' => 'respiratory',
                'mfg' => 'Incepta Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '10mg',
                'min_stock' => 20,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'MN8819', 'days' => 180, 'cost' => 12.50, 'sell' => 16.00, 'qty' => 130],
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
            [
                'name' => 'Lipitor 20mg',
                'brand_name' => 'Lipitor Atorvastatin',
                'sku' => 'MED-LIP-020',
                'barcode' => '894110090020',
                'generic' => 'Atorvastatin Calcium',
                'category' => 'cardiovascular',
                'mfg' => 'Pfizer Global Healthcare',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '20mg',
                'min_stock' => 15,
                'is_rx' => true,
                'batches' => [
                    ['batch' => 'PFZ-LIP-89', 'days' => 350, 'cost' => 22.00, 'sell' => 30.00, 'qty' => 95],
                ],
            ],
            [
                'name' => 'Ecosprin 75mg',
                'brand_name' => 'Ecosprin Low Dose',
                'sku' => 'MED-ECO-075',
                'barcode' => '894110100075',
                'generic' => 'Aspirin (Acetylsalicylic Acid)',
                'category' => 'cardiovascular',
                'mfg' => 'Square Pharmaceuticals Ltd.',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 10,
                'strength' => '75mg',
                'min_stock' => 40,
                'is_rx' => false,
                'batches' => [
                    ['batch' => 'EC5519', 'days' => 190, 'cost' => 0.60, 'sell' => 0.85, 'qty' => 300],
                ],
            ],
            [
                'name' => 'Warf-5 (Warfarin 5mg)',
                'brand_name' => 'Warf Anticoagulant',
                'sku' => 'MED-WRF-005',
                'barcode' => '894110110005',
                'generic' => 'Warfarin Sodium',
                'category' => 'cardiovascular',
                'mfg' => 'Renata Limited',
                'form' => 'Tablet',
                'primary_unit' => 'Box',
                'secondary_unit' => 'Strip',
                'conversion_rate' => 3,
                'strength' => '5mg',
                'min_stock' => 10,
                'is_rx' => true,
                'is_controlled' => true,
                'batches' => [
                    ['batch' => 'WRF-901', 'days' => 150, 'cost' => 6.00, 'sell' => 8.50, 'qty' => 75],
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
            ['name' => 'Zubair Al-Hassan', 'phone' => '+880 1711-234567', 'email' => 'zubair@example.com', 'credit' => 0.00, 'limit' => 5000, 'loyalty' => 120],
            ['name' => 'Samantha Reed', 'phone' => '+880 1812-987654', 'email' => 'samantha.r@example.com', 'credit' => 240.00, 'limit' => 3000, 'loyalty' => 85],
            ['name' => 'Tariq Mehmood', 'phone' => '+880 1913-456789', 'email' => 'tariq.m@example.com', 'credit' => 0.00, 'limit' => 8000, 'loyalty' => 450],
            ['name' => 'Ayesha Siddiqua', 'phone' => '+880 1614-112233', 'email' => 'ayesha.s@example.com', 'credit' => 150.00, 'limit' => 4000, 'loyalty' => 90],
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
        $fexo = Medicine::where('sku', 'MED-FEX-120')->first();

        if ($napaExtra && $seclo && $fexo) {
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
            $batch2 = $seclo->batches()->first();

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

            if ($batch2) {
                SaleItem::create([
                    'sale_id' => $sale1->id,
                    'medicine_id' => $seclo->id,
                    'batch_id' => $batch2->id,
                    'unit_name' => 'Strip',
                    'quantity' => 12,
                    'unit_price' => $batch2->selling_price,
                    'cost_price' => $batch2->cost_price,
                    'discount_amount' => 0,
                    'tax_amount' => 3.60,
                    'total_price' => 12 * $batch2->selling_price,
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
            'new_values' => ['status' => 'Master pharmaceutical catalog initialized successfully.'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PharmaCare AI Clinical Engine/1.0',
            'created_at' => Carbon::now(),
        ]);
    }
}
