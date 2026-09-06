<?php

namespace Database\Seeders;

use App\Models\DrugInteraction;
use App\Models\GenericName;
use Illuminate\Database\Seeder;

class ClinicalMonographSeeder extends Seeder
{
    public function run(): void
    {
        $monographs = [
            'Paracetamol' => [
                'therapeutic_class' => 'Analgesics & Antipyretics',
                'description' => 'Non-opioid analgesic and antipyretic agent used for the relief of mild-to-moderate pain and reduction of fever.',
                'indications' => 'Fever, tension headache, migraine, musculoskeletal pain, osteoarthritis discomfort, post-vaccination febrile reactions, and dental pain.',
                'dosage_guidelines' => 'Adults: 500mg to 1000mg every 4 to 6 hours as needed (Max 4000mg/24 hours). Children (6-12y): 250mg to 500mg every 4 to 6 hours (Max 2000mg/24 hours). Dose reduction required in hepatic impairment.',
                'contraindications' => 'Severe active hepatic impairment, acute liver failure, or known hypersensitivity to paracetamol.',
                'side_effects' => 'Rare at therapeutic doses. Hepatotoxicity at elevated doses, maculopapular rash, thrombocytopenia, and leukopenia in chronic abuse.',
                'mechanism_of_action' => 'Inhibits central prostaglandin synthesis via peroxidase inhibition of COX enzymes in the central nervous system; acts on hypothalamic heat-regulating center.',
                'counseling_points' => 'Do not exceed 4g daily across all combination medications (cough/cold syrups often contain paracetamol). Avoid concurrent heavy alcohol consumption.',
                'pregnancy_category' => 'B',
                'is_controlled' => false,
            ],
            'Esomeprazole' => [
                'therapeutic_class' => 'Proton Pump Inhibitors (PPI)',
                'description' => 'S-isomer of omeprazole that suppresses gastric acid secretion by specific inhibition of the H+/K+-ATPase proton pump.',
                'indications' => 'Gastroesophageal reflux disease (GERD), erosive esophagitis healing and maintenance, Zollinger-Ellison syndrome, NSAID-induced ulcer prophylaxis, and H. pylori eradication.',
                'dosage_guidelines' => 'Adults: 20mg to 40mg once daily 30 to 60 minutes prior to morning breakfast for 4 to 8 weeks. For H. pylori: 40mg once daily or 20mg BID combined with Amoxicillin and Clarithromycin.',
                'contraindications' => 'Hypersensitivity to substituted benzimidazoles; co-administration with rilpivirine or nelfinavir.',
                'side_effects' => 'Headache, abdominal flatulence, nausea, diarrhea, hypomagnesemia with long-term use, and increased risk of Clostridioides difficile infection.',
                'mechanism_of_action' => 'Concentrates in acidic secretory canaliculi of parietal cells, converting to active sulfenamide which irreversibly inhibits the H+/K+-ATPase enzyme.',
                'counseling_points' => 'Swallow capsules whole; do not chew or crush pellets. Best taken 30 to 60 minutes before the first meal of the day.',
                'pregnancy_category' => 'B',
                'is_controlled' => false,
            ],
            'Ciprofloxacin' => [
                'therapeutic_class' => 'Fluoroquinolone Antibiotics',
                'description' => 'Broad-spectrum synthetic fluoroquinolone antibacterial active against a wide range of Gram-negative and Gram-positive pathogens.',
                'indications' => 'Complicated urinary tract infections (UTIs), pyelonephritis, infectious diarrhea, typhoid fever, intra-abdominal infections, bone/joint infections, and severe respiratory tract infections.',
                'dosage_guidelines' => 'Adults: 250mg to 750mg orally every 12 hours depending on infection severity. Dose adjustment mandatory in renal impairment (CrCl < 50 mL/min).',
                'contraindications' => 'Concurrent administration of tizanidine; history of fluoroquinolone-associated tendon rupture or myasthenia gravis.',
                'side_effects' => 'Nausea, diarrhea, tendonitis / Achilles tendon rupture risk, QT prolongation, CNS stimulation (dizziness, insomnia), and photosensitivity.',
                'mechanism_of_action' => 'Inhibits bacterial DNA gyrase (topoisomerase II) and topoisomerase IV, inhibiting DNA supercoiling and bacterial replication.',
                'counseling_points' => 'Take with full glass of water. Avoid taking antacids, calcium, iron, or dairy products within 2 hours before or 4 hours after taking ciprofloxacin.',
                'pregnancy_category' => 'C',
                'is_controlled' => false,
            ],
            'Atorvastatin Calcium' => [
                'therapeutic_class' => 'HMG-CoA Reductase Inhibitors (Statins)',
                'description' => 'Synthetic lipid-lowering agent that reduces LDL-C, apolipoprotein B, and triglycerides while increasing HDL-C.',
                'indications' => 'Primary hypercholesterolemia, mixed dyslipidemia, hypertriglyceridemia, and primary/secondary prevention of cardiovascular events in coronary artery disease.',
                'dosage_guidelines' => 'Adults: Initial dose 10mg to 20mg once daily in the evening; titrate up to 80mg daily according to target LDL-C reduction guidelines.',
                'contraindications' => 'Active liver disease, unexplained persistent elevations of hepatic transaminases, pregnancy, and breastfeeding.',
                'side_effects' => 'Myalgia, elevated serum transaminases, dyspepsia, insomnia, rarely rhabdomyolysis or immune-mediated necrotizing myopathy.',
                'mechanism_of_action' => 'Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, upregulating hepatic LDL receptors.',
                'counseling_points' => 'Report any unexplained muscle pain, tenderness, or weakness immediately. Avoid drinking excessive quantities of grapefruit juice.',
                'pregnancy_category' => 'X',
                'is_controlled' => false,
            ],
            'Metformin HCl' => [
                'therapeutic_class' => 'Biguanides (Antidiabetic)',
                'description' => 'First-line oral antihyperglycemic agent for glycemic management in Type 2 Diabetes Mellitus.',
                'indications' => 'Type 2 Diabetes Mellitus as monotherapy or in combination with other oral hypoglycemic agents or insulin; polycystic ovary syndrome (PCOS) off-label.',
                'dosage_guidelines' => 'Adults: 500mg once or twice daily with meals, titrating gradually by 500mg weekly up to max 2000mg to 2550mg daily. Contraindicated if eGFR < 30 mL/min.',
                'contraindications' => 'Severe renal impairment (eGFR < 30 mL/min/1.73m²), acute or chronic metabolic acidosis including diabetic ketoacidosis, severe hypoxia.',
                'side_effects' => 'Gastrointestinal upset (diarrhea, nausea, abdominal cramping, flatulence), metallic taste, Vitamin B12 deficiency with chronic therapy, rare lactic acidosis.',
                'mechanism_of_action' => 'Decreases hepatic glucose production (gluconeogenesis), decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake.',
                'counseling_points' => 'Always take with or immediately after meals to minimize gastrointestinal discomfort. Discontinue before radiographic iodinated contrast studies.',
                'pregnancy_category' => 'B',
                'is_controlled' => false,
            ],
            'Azithromycin' => [
                'therapeutic_class' => 'Macrolide Antibiotics',
                'description' => 'Azalide subclass macrolide antibiotic with long tissue half-life and post-antibiotic effect against atypical and respiratory pathogens.',
                'indications' => 'Community-acquired pneumonia, acute bacterial sinusitis, pharyngitis/tonsillitis, acute otitis media, skin/soft tissue infections, and urethritis/cervicitis.',
                'dosage_guidelines' => 'Adults: 500mg on Day 1, followed by 250mg once daily on Days 2 through 5, or 500mg once daily for 3 days. Single 1g dose for chlamydial urethritis.',
                'contraindications' => 'Hypersensitivity to azithromycin, erythromycin, or any macrolide; history of cholestatic jaundice/hepatic dysfunction with prior azithromycin use.',
                'side_effects' => 'Diarrhea, nausea, abdominal pain, vomiting, QT prolongation, transient hearing loss at high doses, cholestatic jaundice.',
                'mechanism_of_action' => 'Binds reversibly to the 50S ribosomal subunit of susceptible microorganisms, thereby inhibiting transpeptidation and protein synthesis.',
                'counseling_points' => 'Can be taken with or without food, though taking with food reduces stomach irritation. Complete the entire prescribed duration.',
                'pregnancy_category' => 'B',
                'is_controlled' => false,
            ],
            'Amlodipine Besylate' => [
                'therapeutic_class' => 'Dihydropyridine Calcium Channel Blockers',
                'description' => 'Long-acting dihydropyridine calcium antagonist with potent peripheral and coronary arterial vasodilatory properties.',
                'indications' => 'Essential hypertension, chronic stable angina, and vasospastic (Prinzmetal\'s) angina.',
                'dosage_guidelines' => 'Adults: Initial 5mg orally once daily, titrating up to maximum 10mg once daily after 1 to 2 weeks. Initial 2.5mg in elderly or hepatic impairment.',
                'contraindications' => 'Severe hypotension, cardiogenic shock, clinically significant aortic stenosis, unstable angina.',
                'side_effects' => 'Peripheral edema (especially ankle swelling), flushing, dizziness, palpitations, fatigue, gingival hyperplasia.',
                'mechanism_of_action' => 'Inhibits transmembrane influx of extracellular calcium ions into vascular smooth muscle and cardiac muscle cells, reducing systemic vascular resistance.',
                'counseling_points' => 'Take at the same time each day. Rise slowly from sitting or lying positions to avoid postural dizziness. Ankle swelling is dose-dependent.',
                'pregnancy_category' => 'C',
                'is_controlled' => false,
            ],
            'Warfarin Sodium' => [
                'therapeutic_class' => 'Vitamin K Antagonists (Anticoagulant)',
                'description' => 'Oral anticoagulant indicated for the prophylaxis and treatment of venous thromboembolism and thromboembolic complications associated with atrial fibrillation or cardiac valve replacement.',
                'indications' => 'Deep vein thrombosis (DVT), pulmonary embolism (PE), stroke prevention in non-valvular and valvular atrial fibrillation, mechanical heart valve prosthesis.',
                'dosage_guidelines' => 'Individualized dosing strictly guided by target International Normalized Ratio (INR, usually 2.0 to 3.0 for AF/DVT, 2.5 to 3.5 for mechanical mitral valves).',
                'contraindications' => 'Active major hemorrhage, hemorrhagic tendencies, severe uncontrolled hypertension, pregnancy (teratogenic), recent eye/brain/spinal cord surgery.',
                'side_effects' => 'Major and minor bleeding, hematuria, epistaxis, GI hemorrhage, purple toe syndrome, skin necrosis in protein C deficiency.',
                'mechanism_of_action' => 'Competitively inhibits vitamin K epoxide reductase (VKORC1) complex, depleting functional clotting factors II, VII, IX, and X, as well as proteins C and S.',
                'counseling_points' => 'Maintain consistent dietary vitamin K intake (green leafy vegetables). Avoid NSAIDs and aspirin unless specifically co-prescribed. Monitor INR regularly.',
                'pregnancy_category' => 'X',
                'is_controlled' => true,
            ],
            'Montelukast Sodium' => [
                'therapeutic_class' => 'Leukotriene Receptor Antagonists (LTRA)',
                'description' => 'Selective and orally active cysteinyl leukotriene receptor antagonist that inhibits bronchoconstriction caused by LTD4.',
                'indications' => 'Prophylaxis and chronic treatment of asthma in adults and pediatric patients, prevention of exercise-induced bronchoconstriction, seasonal and perennial allergic rhinitis.',
                'dosage_guidelines' => 'Adults & Adolescents (>=15y): 10mg once daily taken in the evening. Children (6-14y): 5mg chewable tablet once daily in evening. Children (2-5y): 4mg chewable in evening.',
                'contraindications' => 'Hypersensitivity to montelukast sodium.',
                'side_effects' => 'Headache, upper respiratory tract infection, abdominal pain, neuropsychiatric events (FDA Black Box warning: agitation, depression, dream abnormalities, suicidal thoughts).',
                'mechanism_of_action' => 'Binds with high affinity and selectivity to the CysLT1 receptor, blocking cysteinyl leukotriene-mediated airway edema, smooth muscle contraction, and cellular inflammation.',
                'counseling_points' => 'Take in the evening for asthma or allergic rhinitis. Not intended for reversal of acute bronchospasm / acute asthma attack. Report mood changes immediately.',
                'pregnancy_category' => 'B',
                'is_controlled' => false,
            ],
            'Aspirin (Acetylsalicylic Acid)' => [
                'therapeutic_class' => 'Antiplatelet & NSAID',
                'description' => 'Irreversible cyclooxygenase inhibitor providing potent antiplatelet cardioprotection as well as analgesic, anti-inflammatory, and antipyretic actions at higher doses.',
                'indications' => 'Secondary prevention of recurrent myocardial infarction, ischemic stroke, TIA, acute coronary syndrome, and post-angioplasty stent thrombosis prevention.',
                'dosage_guidelines' => 'Antiplatelet maintenance: 75mg to 150mg once daily orally with food. Acute coronary syndrome loading: 300mg chewed/dispersed.',
                'contraindications' => 'Active peptic ulceration, bleeding diathesis, hemophilia, severe cardiac/renal/hepatic failure, children < 16 years with viral infection (Reye\'s syndrome risk).',
                'side_effects' => 'Gastrointestinal irritation, peptic ulceration, occult gastrointestinal bleeding, tinnitus at high doses, bronchospasm in aspirin-sensitive asthmatics.',
                'mechanism_of_action' => 'Irreversibly acetylates serine 529 of platelet COX-1, permanently blocking thromboxane A2 (TXA2) synthesis for the platelet lifespan (7-10 days).',
                'counseling_points' => 'Take with or immediately after food to reduce gastric irritation. Do not take with other NSAIDs without medical supervision.',
                'pregnancy_category' => 'D',
                'is_controlled' => false,
            ],
        ];

        foreach ($monographs as $name => $data) {
            GenericName::where('name', $name)->update($data);
        }

        // Seed comprehensive pairwise Drug Interactions
        $interactions = [
            [
                'gen_a' => 'Warfarin Sodium',
                'gen_b' => 'Aspirin (Acetylsalicylic Acid)',
                'severity' => 'severe',
                'description' => 'Concurrent use of warfarin and aspirin significantly amplifies gastrointestinal and systemic hemorrhage risk via dual antiplatelet and anticoagulant inhibition.',
                'clinical_management' => 'Avoid combination unless specifically indicated (e.g. mechanical valve with acute coronary stent). If essential, co-prescribe a proton pump inhibitor and monitor INR closely.',
            ],
            [
                'gen_a' => 'Ciprofloxacin',
                'gen_b' => 'Aluminum Hydroxide + Magnesium (Antacid)',
                'severity' => 'moderate',
                'description' => 'Multivalent antacid cations (Al3+, Mg2+) form insoluble chelate complexes with ciprofloxacin in the gastrointestinal tract, decreasing fluoroquinolone bioavailability by up to 85%.',
                'clinical_management' => 'Administer ciprofloxacin at least 2 hours before or 4 to 6 hours after aluminum/magnesium antacid ingestion.',
            ],
            [
                'gen_a' => 'Ciprofloxacin',
                'gen_b' => 'Calcium Orotate + Vitamin D3 (Coral Calcium)',
                'severity' => 'moderate',
                'description' => 'Calcium cations chelate fluoroquinolones, drastically reducing antibiotic absorption and clinical efficacy.',
                'clinical_management' => 'Separate oral administration by at least 2 hours before or 4 hours after calcium supplementation.',
            ],
            [
                'gen_a' => 'Atorvastatin Calcium',
                'gen_b' => 'Azithromycin',
                'severity' => 'moderate',
                'description' => 'Macrolide antimicrobial inhibition may moderately elevate serum atorvastatin concentrations, increasing the risk of statin-induced myopathy or rhabdomyolysis.',
                'clinical_management' => 'Monitor patient for unexplained muscle pain or weakness. Consider temporarily holding atorvastatin during short-course macrolide therapy if symptoms arise.',
            ],
            [
                'gen_a' => 'Metformin HCl',
                'gen_b' => 'Ciprofloxacin',
                'severity' => 'moderate',
                'description' => 'Fluoroquinolones may perturb blood glucose homeostasis in patients on metformin, producing dysglycemia (severe hypoglycemia or hyperglycemia).',
                'clinical_management' => 'Advise diabetic patients to increase blood glucose self-monitoring frequency while on ciprofloxacin therapy.',
            ],
            [
                'gen_a' => 'Amlodipine Besylate',
                'gen_b' => 'Atorvastatin Calcium',
                'severity' => 'mild',
                'description' => 'Amlodipine modestly inhibits CYP3A4-mediated metabolism of atorvastatin, increasing AUC of atorvastatin by approximately 18%.',
                'clinical_management' => 'Safe combination widely used in clinical cardiology; do not exceed 20mg to 40mg atorvastatin daily without monitoring.',
            ],
        ];

        foreach ($interactions as $item) {
            $genA = GenericName::where('name', $item['gen_a'])->first();
            $genB = GenericName::where('name', $item['gen_b'])->first();

            if ($genA && $genB) {
                DrugInteraction::updateOrCreate(
                    [
                        'generic_a_id' => min($genA->id, $genB->id),
                        'generic_b_id' => max($genA->id, $genB->id),
                    ],
                    [
                        'severity' => $item['severity'],
                        'description' => $item['description'],
                        'clinical_management' => $item['clinical_management'],
                    ]
                );
            }
        }
    }
}
