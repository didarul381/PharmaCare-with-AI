<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\Category;
use App\Models\DosageForm;
use App\Models\GenericName;
use App\Models\Manufacturer;
use App\Models\Medicine;
use App\Models\Unit;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MedexExpandedSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Manufacturers
        $companies = [
            'Square Pharmaceuticals PLC' => ['contact' => 'info@squarepharma.com.bd', 'phone' => '+880-2-8833047', 'address' => 'Square Centre, 48 Mohakhali C/A, Dhaka-1212'],
            'Beximco Pharmaceuticals Ltd.' => ['contact' => 'info@bpl.net', 'phone' => '+880-2-58611001', 'address' => '19 Dhanmondi R/A, Road #7, Dhaka-1205'],
            'Incepta Pharmaceuticals Ltd.' => ['contact' => 'incepta@inceptapharma.com', 'phone' => '+880-2-8891688', 'address' => '40 Shahid Tajuddin Ahmed Sarani, Tejgaon I/A, Dhaka'],
            'Healthcare Pharmaceuticals Ltd.' => ['contact' => 'info@hplbd.com', 'phone' => '+880-2-9669041', 'address' => 'Nasir Trade Centre, Level 9-11, 89 Bir Uttam C.R. Datta Road, Dhaka'],
            'Renata Limited' => ['contact' => 'renata@renata-ltd.com', 'phone' => '+880-2-8001450', 'address' => 'Plot #1, Milk Vita Road, Section-7, Mirpur, Dhaka'],
            'Acme Laboratories Ltd.' => ['contact' => 'headoffice@acmeglobal.com', 'phone' => '+880-2-9004145', 'address' => '1/4 Kallayanpur, Mirpur Road, Dhaka-1207'],
            'Eskayef Pharmaceuticals Ltd.' => ['contact' => 'info@skf.transcombd.com', 'phone' => '+880-2-8878855', 'address' => 'Transcom Bhaban, 52 Motijheel C/A, Dhaka'],
            'ACI Limited' => ['contact' => 'info@aci-bd.com', 'phone' => '+880-2-8878600', 'address' => 'ACI Centre, 245 Tejgaon Industrial Area, Dhaka-1208'],
            'Opsonin Pharma Ltd.' => ['contact' => 'info@opsonin.net', 'phone' => '+880-2-9558584', 'address' => '30 New Eskaton Road, Dhaka-1000'],
            'Popular Pharmaceuticals Ltd.' => ['contact' => 'info@popular-pharma.com', 'phone' => '+880-2-9669480', 'address' => 'House #11A, Road #2, Dhanmondi R/A, Dhaka-1205'],
        ];

        $companyModels = [];
        foreach ($companies as $name => $info) {
            $companyModels[$name] = Manufacturer::updateOrCreate(
                ['name' => $name],
                [
                    'email' => $info['contact'],
                    'phone' => $info['phone'],
                    'address' => $info['address'],
                    'is_active' => true,
                ]
            );
        }

        // 2. Dosage forms & Units
        $forms = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Suppository', 'Eye Drops', 'Inhaler', 'Cream', 'Ointment'];
        $formModels = [];
        foreach ($forms as $f) {
            $formModels[$f] = DosageForm::firstOrCreate(['name' => $f]);
        }

        $pieceUnit = Unit::firstOrCreate(['name' => 'Piece'], ['short_name' => 'Pcs']);
        $stripUnit = Unit::firstOrCreate(['name' => 'Strip'], ['short_name' => 'Str']);
        $bottleUnit = Unit::firstOrCreate(['name' => 'Bottle'], ['short_name' => 'Btl']);

        // 3. Categories
        $createCat = fn($catName) => Category::firstOrCreate(['slug' => Str::slug($catName)], ['name' => $catName]);
        $catAnalgesic = $createCat('Analgesic & Antipyretic');
        $catGastro = $createCat('Gastrointestinal & PPI');
        $catAntibiotic = $createCat('Antibiotics & Antimicrobials');
        $catRespiratory = $createCat('Respiratory & Antiallergic');
        $catCardio = $createCat('Cardiovascular');
        $catDiabetic = $createCat('Antidiabetic');

        // 4. MedEx Brands with alternate equivalents
        $medexCatalog = [
            // PARACETAMOL
            [
                'name' => 'Napa 500 mg Tablet',
                'brand_name' => 'Napa',
                'generic' => 'Paracetamol',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catAnalgesic,
                'price' => 1.20,
                'stock' => 1500,
                'sku' => 'MED-NAPA-500',
            ],
            [
                'name' => 'Napa Extend 665 mg Tablet',
                'brand_name' => 'Napa',
                'generic' => 'Paracetamol',
                'strength' => '665 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catAnalgesic,
                'price' => 2.00,
                'stock' => 800,
                'sku' => 'MED-NAPA-EXT-665',
            ],
            [
                'name' => 'Napa Rapid 500 mg Tablet',
                'brand_name' => 'Napa',
                'generic' => 'Paracetamol',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catAnalgesic,
                'price' => 1.30,
                'stock' => 950,
                'sku' => 'MED-NAPA-RAPID-500',
            ],
            [
                'name' => 'Napa One 1000 mg Tablet',
                'brand_name' => 'Napa',
                'generic' => 'Paracetamol',
                'strength' => '1000 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catAnalgesic,
                'price' => 2.50,
                'stock' => 600,
                'sku' => 'MED-NAPA-ONE-1000',
            ],
            [
                'name' => 'Napa 120 mg/5 ml Syrup',
                'brand_name' => 'Napa',
                'generic' => 'Paracetamol',
                'strength' => '120 mg/5 ml',
                'form' => 'Syrup',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catAnalgesic,
                'price' => 35.00,
                'stock' => 120,
                'sku' => 'MED-NAPA-SYR-120',
            ],
            [
                'name' => 'Napa 125 mg Suppository',
                'brand_name' => 'Napa',
                'generic' => 'Paracetamol',
                'strength' => '125 mg',
                'form' => 'Suppository',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catAnalgesic,
                'price' => 6.00,
                'stock' => 150,
                'sku' => 'MED-NAPA-SUPP-125',
            ],
            [
                'name' => 'Ace 500 mg Tablet',
                'brand_name' => 'Ace',
                'generic' => 'Paracetamol',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catAnalgesic,
                'price' => 1.20,
                'stock' => 2200,
                'sku' => 'MED-ACE-500',
            ],
            [
                'name' => 'Renova 500 mg Tablet',
                'brand_name' => 'Renova',
                'generic' => 'Paracetamol',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Renata Limited',
                'category' => $catAnalgesic,
                'price' => 1.20,
                'stock' => 600,
                'sku' => 'MED-RENOVA-500',
            ],
            [
                'name' => 'Fast 500 mg Tablet',
                'brand_name' => 'Fast',
                'generic' => 'Paracetamol',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Acme Laboratories Ltd.',
                'category' => $catAnalgesic,
                'price' => 1.15,
                'stock' => 450,
                'sku' => 'MED-FAST-500',
            ],
            [
                'name' => 'Reset 500 mg Tablet',
                'brand_name' => 'Reset',
                'generic' => 'Paracetamol',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Incepta Pharmaceuticals Ltd.',
                'category' => $catAnalgesic,
                'price' => 1.20,
                'stock' => 700,
                'sku' => 'MED-RESET-500',
            ],

            // ESOMEPRAZOLE
            [
                'name' => 'Sergel 20 mg Capsule',
                'brand_name' => 'Sergel',
                'generic' => 'Esomeprazole',
                'strength' => '20 mg',
                'form' => 'Capsule',
                'company' => 'Healthcare Pharmaceuticals Ltd.',
                'category' => $catGastro,
                'price' => 7.00,
                'stock' => 1200,
                'sku' => 'MED-SERGEL-20',
            ],
            [
                'name' => 'Maxpro 20 mg Capsule',
                'brand_name' => 'Maxpro',
                'generic' => 'Esomeprazole',
                'strength' => '20 mg',
                'form' => 'Capsule',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catGastro,
                'price' => 7.00,
                'stock' => 1800,
                'sku' => 'MED-MAXPRO-20',
            ],
            [
                'name' => 'Nexum 20 mg Capsule',
                'brand_name' => 'Nexum',
                'generic' => 'Esomeprazole',
                'strength' => '20 mg',
                'form' => 'Capsule',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catGastro,
                'price' => 7.00,
                'stock' => 950,
                'sku' => 'MED-NEXUM-20',
            ],
            [
                'name' => 'Opton 20 mg Capsule',
                'brand_name' => 'Opton',
                'generic' => 'Esomeprazole',
                'strength' => '20 mg',
                'form' => 'Capsule',
                'company' => 'Incepta Pharmaceuticals Ltd.',
                'category' => $catGastro,
                'price' => 6.50,
                'stock' => 500,
                'sku' => 'MED-OPTON-20',
            ],

            // CIPROFLOXACIN
            [
                'name' => 'Ciprocin 500 mg Tablet',
                'brand_name' => 'Ciprocin',
                'generic' => 'Ciprofloxacin',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catAntibiotic,
                'price' => 15.00,
                'stock' => 650,
                'sku' => 'MED-CIPROCIN-500',
            ],
            [
                'name' => 'Neofloxin 500 mg Tablet',
                'brand_name' => 'Neofloxin',
                'generic' => 'Ciprofloxacin',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catAntibiotic,
                'price' => 15.00,
                'stock' => 400,
                'sku' => 'MED-NEOFLOX-500',
            ],
            [
                'name' => 'Ciprox 500 mg Tablet',
                'brand_name' => 'Ciprox',
                'generic' => 'Ciprofloxacin',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Incepta Pharmaceuticals Ltd.',
                'category' => $catAntibiotic,
                'price' => 14.50,
                'stock' => 300,
                'sku' => 'MED-CIPROX-500',
            ],

            // MONTELUKAST
            [
                'name' => 'Monas 10 mg Tablet',
                'brand_name' => 'Monas',
                'generic' => 'Montelukast Sodium',
                'strength' => '10 mg',
                'form' => 'Tablet',
                'company' => 'Acme Laboratories Ltd.',
                'category' => $catRespiratory,
                'price' => 16.00,
                'stock' => 850,
                'sku' => 'MED-MONAS-10',
            ],
            [
                'name' => 'Odmon 10 mg Tablet',
                'brand_name' => 'Odmon',
                'generic' => 'Montelukast Sodium',
                'strength' => '10 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catRespiratory,
                'price' => 16.00,
                'stock' => 500,
                'sku' => 'MED-ODMON-10',
            ],
            [
                'name' => 'Lumona 10 mg Tablet',
                'brand_name' => 'Lumona',
                'generic' => 'Montelukast Sodium',
                'strength' => '10 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catRespiratory,
                'price' => 16.00,
                'stock' => 1100,
                'sku' => 'MED-LUMONA-10',
            ],
            [
                'name' => 'Provair 10 mg Tablet',
                'brand_name' => 'Provair',
                'generic' => 'Montelukast Sodium',
                'strength' => '10 mg',
                'form' => 'Tablet',
                'company' => 'Incepta Pharmaceuticals Ltd.',
                'category' => $catRespiratory,
                'price' => 15.50,
                'stock' => 450,
                'sku' => 'MED-PROVAIR-10',
            ],

            // AZITHROMYCIN
            [
                'name' => 'Zithrin 500 mg Tablet',
                'brand_name' => 'Zithrin',
                'generic' => 'Azithromycin',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catAntibiotic,
                'price' => 35.00,
                'stock' => 400,
                'sku' => 'MED-ZITHRIN-500',
            ],
            [
                'name' => 'Macrozit 500 mg Tablet',
                'brand_name' => 'Macrozit',
                'generic' => 'Azithromycin',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Incepta Pharmaceuticals Ltd.',
                'category' => $catAntibiotic,
                'price' => 35.00,
                'stock' => 350,
                'sku' => 'MED-MACROZIT-500',
            ],

            // ATORVASTATIN
            [
                'name' => 'Atova 10 mg Tablet',
                'brand_name' => 'Atova',
                'generic' => 'Atorvastatin Calcium',
                'strength' => '10 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catCardio,
                'price' => 12.00,
                'stock' => 600,
                'sku' => 'MED-ATOVA-10',
            ],
            [
                'name' => 'Anclog 10 mg Tablet',
                'brand_name' => 'Anclog',
                'generic' => 'Atorvastatin Calcium',
                'strength' => '10 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catCardio,
                'price' => 12.00,
                'stock' => 800,
                'sku' => 'MED-ANCLOG-10',
            ],

            // METFORMIN
            [
                'name' => 'Comet 500 mg Tablet',
                'brand_name' => 'Comet',
                'generic' => 'Metformin HCl',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catDiabetic,
                'price' => 4.50,
                'stock' => 1400,
                'sku' => 'MED-COMET-500',
            ],
            [
                'name' => 'Daomin 500 mg Tablet',
                'brand_name' => 'Daomin',
                'generic' => 'Metformin HCl',
                'strength' => '500 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catDiabetic,
                'price' => 4.50,
                'stock' => 900,
                'sku' => 'MED-DAOMIN-500',
            ],

            // AMLODIPINE
            [
                'name' => 'Amdocal 5 mg Tablet',
                'brand_name' => 'Amdocal',
                'generic' => 'Amlodipine Besylate',
                'strength' => '5 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catCardio,
                'price' => 5.00,
                'stock' => 1100,
                'sku' => 'MED-AMDOCAL-5',
            ],
            [
                'name' => 'Camlodin 5 mg Tablet',
                'brand_name' => 'Camlodin',
                'generic' => 'Amlodipine Besylate',
                'strength' => '5 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catCardio,
                'price' => 5.00,
                'stock' => 1350,
                'sku' => 'MED-CAMLODIN-5',
            ],

            // FEXOFENADINE
            [
                'name' => 'Fexo 120 mg Tablet',
                'brand_name' => 'Fexo',
                'generic' => 'Fexofenadine HCl',
                'strength' => '120 mg',
                'form' => 'Tablet',
                'company' => 'Square Pharmaceuticals PLC',
                'category' => $catRespiratory,
                'price' => 9.00,
                'stock' => 950,
                'sku' => 'MED-FEXO-120',
            ],
            [
                'name' => 'Fenadin 120 mg Tablet',
                'brand_name' => 'Fenadin',
                'generic' => 'Fexofenadine HCl',
                'strength' => '120 mg',
                'form' => 'Tablet',
                'company' => 'Beximco Pharmaceuticals Ltd.',
                'category' => $catRespiratory,
                'price' => 9.00,
                'stock' => 700,
                'sku' => 'MED-FENADIN-120',
            ],
        ];

        foreach ($medexCatalog as $item) {
            $generic = GenericName::where('name', $item['generic'])->first();
            if (!$generic) {
                $generic = GenericName::create([
                    'name' => $item['generic'],
                    'therapeutic_class' => $item['category']->name,
                    'pregnancy_category' => 'B',
                ]);
            }

            $company = $companyModels[$item['company']] ?? Manufacturer::first();
            $dosageForm = $formModels[$item['form']] ?? DosageForm::first();

            $medicine = Medicine::updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'name' => $item['name'],
                    'brand_name' => $item['brand_name'],
                    'generic_name_id' => $generic->id,
                    'category_id' => $item['category']->id,
                    'manufacturer_id' => $company->id,
                    'dosage_form_id' => $dosageForm->id,
                    'primary_unit_id' => $pieceUnit->id,
                    'strength' => $item['strength'],
                    'min_stock_alert' => 50,
                    'is_prescription_required' => false,
                    'is_controlled_substance' => false,
                    'is_active' => true,
                ]
            );

            // Seed active batch in vault
            $batchNumber = 'BPL-' . strtoupper(substr(md5($item['sku']), 0, 6));
            Batch::updateOrCreate(
                ['medicine_id' => $medicine->id, 'batch_number' => $batchNumber],
                [
                    'expiry_date' => Carbon::now()->addMonths(18)->toDateString(),
                    'cost_price' => round($item['price'] * 0.75, 2),
                    'selling_price' => $item['price'],
                    'initial_quantity' => $item['stock'] + 200,
                    'current_quantity' => $item['stock'],
                    'supplier_id' => $company->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
