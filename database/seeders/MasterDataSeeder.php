<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DosageForm;
use App\Models\DrugInteraction;
use App\Models\GenericName;
use App\Models\Manufacturer;
use App\Models\StoreSetting;
use App\Models\Unit;
use Illuminate\Database\Seeder;

/**
 * Reference data every installation needs (no demo users, stock or sales):
 * categories, dosage forms, units, manufacturers, generic molecules,
 * drug–drug interaction rules and clinical monographs.
 *
 * Safe to run repeatedly.
 */
class MasterDataSeeder extends Seeder
{
    public const MANUFACTURERS = [
        ['name' => 'Square Pharmaceuticals Ltd.', 'contact_person' => 'Mohammad Rahman', 'email' => 'sales@squarepharma.com', 'phone' => '+880 2 8833047', 'address' => 'Square Centre, 48 Mohakhali C/A, Dhaka', 'code' => 'SQR-001'],
        ['name' => 'Beximco Pharmaceuticals Ltd.', 'contact_person' => 'Tanvir Ahmed', 'email' => 'orders@beximcopharma.com', 'phone' => '+880 2 58611001', 'address' => '19 Dhanmondi R/A, Road 7, Dhaka', 'code' => 'BEX-002'],
        ['name' => 'Incepta Pharmaceuticals Ltd.', 'contact_person' => 'Farhana Kabir', 'email' => 'contact@inceptapharma.com', 'phone' => '+880 2 8891688', 'address' => '40 Shahid Tajuddin Ahmed Sarani, Dhaka', 'code' => 'INC-003'],
        ['name' => 'Renata Limited', 'contact_person' => 'Sazzad Hossain', 'email' => 'info@renata-ltd.com', 'phone' => '+880 2 8001450', 'address' => 'Plot 1, Milk Vita Road, Section 7, Mirpur, Dhaka', 'code' => 'REN-004'],
        ['name' => 'Popular Pharmaceuticals Ltd.', 'contact_person' => 'Dr. Kazi Mostafa', 'email' => 'contact@popular-pharma.com', 'phone' => '+880 2 9669480', 'address' => 'Popular Tower, Dhanmondi, Dhaka', 'code' => 'POP-005'],
        ['name' => 'Pfizer Global Healthcare', 'contact_person' => 'Sarah Jenkins', 'email' => 'distributors@pfizer.com', 'phone' => '+1 (800) 879-3477', 'address' => '66 Hudson Blvd E, New York, NY 10001', 'code' => 'PFZ-006'],
    ];

    public function run(): void
    {
        // Categories
        $categories = [
            ['name' => 'Antibiotics & Antimicrobials', 'slug' => 'antibiotics', 'icon' => 'ShieldAlert'],
            ['name' => 'Analgesics & Pain Relief', 'slug' => 'analgesics', 'icon' => 'Activity'],
            ['name' => 'Gastrointestinal & Anti-Ulcer', 'slug' => 'gastrointestinal', 'icon' => 'HeartPulse'],
            ['name' => 'Cardiovascular & Hypertension', 'slug' => 'cardiovascular', 'icon' => 'Heart'],
            ['name' => 'Respiratory & Anti-Allergy', 'slug' => 'respiratory', 'icon' => 'Wind'],
            ['name' => 'Diabetes & Endocrine Care', 'slug' => 'diabetes', 'icon' => 'Droplet'],
            ['name' => 'Vitamins & Dietary Supplements', 'slug' => 'vitamins', 'icon' => 'Sparkles'],
            ['name' => 'Obstetrics, Gynae & Antenatal', 'slug' => 'obstetrics-gynae', 'icon' => 'Heart'],
            ['name' => 'Dermatology & Topicals', 'slug' => 'dermatology', 'icon' => 'Layers'],
        ];
        foreach ($categories as $cat) {
            Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        // Dosage forms
        foreach (['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream / Ointment', 'Inhaler', 'Eye / Ear Drops', 'Oral Suspension', 'Oral Solution'] as $form) {
            DosageForm::firstOrCreate(['name' => $form]);
        }

        // Units
        $units = [
            ['name' => 'Box', 'short_name' => 'Box'],
            ['name' => 'Strip', 'short_name' => 'Str'],
            ['name' => 'Piece / Tablet', 'short_name' => 'Pcs'],
            ['name' => 'Bottle', 'short_name' => 'Btl'],
            ['name' => 'Vial', 'short_name' => 'Vial'],
            ['name' => 'Tube', 'short_name' => 'Tube'],
            ['name' => 'Inhaler Device', 'short_name' => 'Dev'],
        ];
        foreach ($units as $u) {
            Unit::firstOrCreate(['name' => $u['name']], $u);
        }

        // Manufacturers
        foreach (self::MANUFACTURERS as $mfg) {
            Manufacturer::firstOrCreate(['name' => $mfg['name']], [
                'contact_person' => $mfg['contact_person'],
                'email' => $mfg['email'],
                'phone' => $mfg['phone'],
                'address' => $mfg['address'],
                'is_active' => true,
            ]);
        }

        // Generic molecules
        $generics = [
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
            ['name' => 'Carbonyl Iron + Folic Acid + Zinc Sulfate Monohydrate', 'therapeutic_class' => 'Hematinic & Antianemic', 'pregnancy_category' => 'A'],
            ['name' => 'Multivitamin & Multimineral Essentials (For nursing mother)', 'therapeutic_class' => 'Antenatal Vitamin Supplement', 'pregnancy_category' => 'A'],
            ['name' => 'Calcium Orotate + Vitamin D3 (Coral Calcium)', 'therapeutic_class' => 'Mineral & Vitamin Supplement', 'pregnancy_category' => 'C'],
            ['name' => 'Calcium Folinate (Folinic Acid)', 'therapeutic_class' => 'Active Folate / Antianemic', 'pregnancy_category' => 'A'],
            ['name' => 'Doxylamine Succinate + Pyridoxine HCl', 'therapeutic_class' => 'Antiemetic for Nausea/Vomiting of Pregnancy', 'pregnancy_category' => 'A'],
            ['name' => 'Tiemonium Methylsulphate', 'therapeutic_class' => 'Antispasmodic / Smooth Muscle Relaxant', 'pregnancy_category' => 'B'],
            ['name' => 'Lactulose Solution', 'therapeutic_class' => 'Osmotic Laxative', 'pregnancy_category' => 'B'],
            ['name' => 'Mebhydrolin Napadisylate', 'therapeutic_class' => 'Antihistamine / Antiallergic', 'pregnancy_category' => 'B'],
        ];
        foreach ($generics as $g) {
            GenericName::firstOrCreate(['name' => $g['name']], $g);
        }

        // Detailed monographs (indications, dosage, counselling) + extra interaction pairs.
        $this->call(ClinicalMonographSeeder::class);

        // Core drug–drug interaction rules (take precedence over the monograph defaults above)
        $interactions = [
            ['Ciprofloxacin', 'Aluminum Hydroxide + Magnesium (Antacid)', 'severe',
                'Polyvalent cations (aluminum/magnesium) chelate ciprofloxacin in the GI tract, reducing antibiotic absorption by up to 85%.',
                'Administer ciprofloxacin at least 2 hours before or 6 hours after antacid ingestion.'],
            ['Warfarin Sodium', 'Aspirin (Acetylsalicylic Acid)', 'fatal',
                'Concurrent anticoagulant and antiplatelet therapy dramatically escalates major hemorrhage and fatal gastrointestinal bleeding risks.',
                'Avoid co-prescription unless under specialized cardiac protocol. Closely monitor INR.'],
            ['Clopidogrel', 'Omeprazole', 'severe',
                'Omeprazole inhibits CYP2C19, significantly blunting the metabolic activation and antiplatelet efficacy of clopidogrel.',
                'Switch to Pantoprazole or H2-receptor blocker if acid suppression is mandatory.'],
            ['Sildenafil Citrate', 'Nitroglycerin / Glyceryl Trinitrate', 'fatal',
                'Potentiation of nitric oxide pathway causes catastrophic, potentially fatal systemic hypotension.',
                'Absolute contraindication. Minimum 24-48 hour separation required.'],
            ['Atorvastatin Calcium', 'Azithromycin', 'moderate',
                'Macrolides may increase systemic exposure of atorvastatin, increasing the risk of rhabdomyolysis and myopathy.',
                'Monitor for unexplained muscle pain, tenderness, or weakness.'],
        ];
        foreach ($interactions as [$a, $b, $severity, $description, $management]) {
            $genA = GenericName::where('name', $a)->first();
            $genB = GenericName::where('name', $b)->first();
            if ($genA && $genB) {
                DrugInteraction::updateOrCreate(
                    ['generic_a_id' => min($genA->id, $genB->id), 'generic_b_id' => max($genA->id, $genB->id)],
                    ['severity' => $severity, 'description' => $description, 'clinical_management' => $management],
                );
            }
        }

        // Make sure a store profile row exists.
        StoreSetting::getSettings();
    }
}
