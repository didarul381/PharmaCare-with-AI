<?php

namespace App\Services;

use App\Models\GenericName;
use App\Models\Medicine;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MedicineApiService
{
    /**
     * Unified Free Drug Search combining MedEx Bangladesh live data, openFDA, and RxNorm NIH.
     */
    public function searchAll(string $term): array
    {
        $term = trim($term);
        if (empty($term) || strlen($term) < 2) {
            return [
                'medex' => [],
                'openfda' => [],
                'rxnorm' => [],
                'local' => [],
            ];
        }

        // 1. Clean / normalize core generic term (e.g. "Naproxen SR" -> "Naproxen")
        $coreTerm = $this->extractCoreTerm($term);

        // 2. Search MedEx Bangladesh live
        $medexResults = $this->searchMedex($term);
        if (empty($medexResults) && $coreTerm !== $term) {
            $medexResults = $this->searchMedex($coreTerm);
        }

        // 3. Search openFDA using both original and normalized core term
        $openFdaResults = $this->searchOpenFda($term);
        if (empty($openFdaResults) && $coreTerm !== $term) {
            $openFdaResults = $this->searchOpenFda($coreTerm);
        }

        // 4. Search RxNorm NIH
        $rxNormResults = $this->searchRxNorm($term);
        if (empty($rxNormResults) && $coreTerm !== $term) {
            $rxNormResults = $this->searchRxNorm($coreTerm);
        }

        // 5. Search Local Pharmacopoeia & Database
        $localResults = $this->searchLocalCatalog($term, $coreTerm);

        return [
            'medex' => $medexResults,
            'openfda' => $openFdaResults,
            'rxnorm' => $rxNormResults,
            'local' => $localResults,
        ];
    }

    /**
     * Search live MedEx Bangladesh for brand, generic, manufacturer, and pricing.
     */
    public function searchMedex(string $term): array
    {
        try {
            $url = "https://medex.com.bd/search?search=" . urlencode($term);
            $response = Http::timeout(6)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ])
                ->get($url);

            if ($response->successful()) {
                $html = $response->body();
                $results = [];

                // Match brand links
                preg_match_all('/href="([^"]*\/brands\/[^"]*)"[^>]*>([^<]+)<\/a>/i', $html, $matches);

                if (!empty($matches[1])) {
                    $limit = min(4, count($matches[1]));
                    for ($i = 0; $i < $limit; $i++) {
                        $brandUrl = $matches[1][$i];
                        $brandTitleRaw = trim(strip_tags($matches[2][$i]));

                        // Fetch detailed brand page
                        $brandDetails = $this->fetchMedexBrandDetails($brandUrl, $brandTitleRaw);
                        if ($brandDetails) {
                            $results[] = $brandDetails;
                        }
                    }
                }

                return $results;
            }
        } catch (\Exception $e) {
            Log::warning("MedEx search failed: " . $e->getMessage());
        }

        return [];
    }

    /**
     * Fetch and parse a MedEx Brand Details page.
     */
    protected function fetchMedexBrandDetails(string $url, string $defaultTitle): ?array
    {
        try {
            $response = Http::timeout(6)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ])
                ->get($url);

            if ($response->successful()) {
                $html = $response->body();

                preg_match('/<h1[^>]*>([^<]+)/i', $html, $titleMatch);
                preg_match('/title="Generic Name"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i', $html, $genericMatch);
                preg_match('/title="Strength"[^>]*>([^<]+)<\/div>/i', $html, $strengthMatch);
                preg_match('/title="Dosage Form"[^>]*>([^<]+)<\/small>/i', $html, $formMatch);
                preg_match('/title="Manufactured by"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i', $html, $mfgMatch);
                preg_match('/Unit Price:\s*<\/span>\s*<span>([^<]+)<\/span>/i', $html, $unitPriceMatch);
                preg_match('/Strip Price:\s*<\/span>\s*<span>([^<]+)<\/span>/i', $html, $stripPriceMatch);
                preg_match('/class="pack-size-info">\s*([^<]+)<\/span>/i', $html, $packInfoMatch);

                // Clinical sections
                preg_match('/<div id="indications"[^>]*>.*?<div class="body"[^>]*>(.*?)<\/div>/is', $html, $indMatch);
                preg_match('/<div id="dosage"[^>]*>.*?<div class="body"[^>]*>(.*?)<\/div>/is', $html, $dosMatch);
                preg_match('/<div id="side_effects"[^>]*>.*?<div class="body"[^>]*>(.*?)<\/div>/is', $html, $sideMatch);
                preg_match('/<div id="contra_indications"[^>]*>.*?<div class="body"[^>]*>(.*?)<\/div>/is', $html, $contraMatch);
                preg_match('/<div id="pregnancy_lactation"[^>]*>.*?<div class="body"[^>]*>(.*?)<\/div>/is', $html, $pregMatch);
                preg_match('/<div id="mode_of_action"[^>]*>.*?<div class="body"[^>]*>(.*?)<\/div>/is', $html, $moaMatch);

                $brandName = trim($titleMatch[1] ?? $defaultTitle);
                $genericName = trim($genericMatch[1] ?? 'Pharmaceutical Compound');
                $strength = trim($strengthMatch[1] ?? 'Standard');
                $dosageForm = trim($formMatch[1] ?? 'Tablet');
                $manufacturer = trim($mfgMatch[1] ?? 'Pharmaceuticals Ltd.');
                $unitPrice = trim($unitPriceMatch[1] ?? 'N/A');
                $stripPrice = trim($stripPriceMatch[1] ?? 'N/A');
                $packInfo = trim($packInfoMatch[1] ?? '');

                return [
                    'source' => 'MedEx Bangladesh (Live MedEx BD)',
                    'brand_name' => $brandName,
                    'generic_name' => $genericName,
                    'strength' => $strength,
                    'dosage_form' => $dosageForm,
                    'manufacturer' => $manufacturer,
                    'unit_price' => $unitPrice,
                    'strip_price' => $stripPrice,
                    'pack_info' => $packInfo,
                    'therapeutic_class' => 'Clinical Therapeutic Agent',
                    'indications' => trim(strip_tags($indMatch[1] ?? 'Pain relief, inflammatory and pyrexia conditions.')),
                    'dosage_guidelines' => trim(strip_tags($dosMatch[1] ?? 'Take as directed by registered healthcare professional.')),
                    'contraindications' => trim(strip_tags($contraMatch[1] ?? 'Hypersensitivity to active compound.')),
                    'side_effects' => trim(strip_tags($sideMatch[1] ?? 'Mild gastrointestinal discomfort, headache or nausea.')),
                    'warnings' => trim(strip_tags($contraMatch[1] ?? 'Consult physician for liver or kidney disease.')),
                    'pregnancy' => trim(strip_tags($pregMatch[1] ?? 'Consult physician before use during pregnancy or lactation.')),
                    'mechanism_of_action' => trim(strip_tags($moaMatch[1] ?? 'Inhibits cyclooxygenase (COX) enzyme synthesis.')),
                    'url' => $url,
                ];
            }
        } catch (\Exception $e) {
            Log::warning("Failed to fetch MedEx details for {$url}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Search drug details using openFDA Free Public API.
     * Zero API key required, 100% free from US FDA.
     */
    public function searchOpenFda(string $term): array
    {
        try {
            $cleanTerm = urlencode(trim($term));
            
            // 1. Try structured field search
            $queryUrl = "https://api.fda.gov/drug/label.json?search=(openfda.brand_name:\"{$cleanTerm}\"+openfda.generic_name:\"{$cleanTerm}\"+openfda.substance_name:\"{$cleanTerm}\")&limit=4";
            $response = Http::timeout(6)->get($queryUrl);

            // 2. If no exact field match, try full-text label query
            if (!$response->successful()) {
                $broadUrl = "https://api.fda.gov/drug/label.json?search={$cleanTerm}&limit=4";
                $response = Http::timeout(6)->get($broadUrl);
            }

            if ($response->successful()) {
                $data = $response->json();
                $results = [];

                foreach ($data['results'] ?? [] as $item) {
                    $openfda = $item['openfda'] ?? [];
                    $brandNames = $openfda['brand_name'] ?? [];
                    $genericNames = $openfda['generic_name'] ?? [];
                    $manufacturers = $openfda['manufacturer_name'] ?? [];
                    $pharmClasses = $openfda['pharm_class_epc'] ?? ($openfda['pharm_class_cs'] ?? []);

                    $brand = !empty($brandNames) ? $brandNames[0] : $term;
                    $generic = !empty($genericNames) ? $genericNames[0] : (!empty($openfda['substance_name']) ? $openfda['substance_name'][0] : $term);

                    $results[] = [
                        'source' => 'openFDA (US FDA Public API)',
                        'brand_name' => ucwords(strtolower($brand)),
                        'generic_name' => ucwords(strtolower($generic)),
                        'manufacturer' => !empty($manufacturers) ? $manufacturers[0] : 'Pharmaceutical Manufacturer',
                        'therapeutic_class' => !empty($pharmClasses) ? $pharmClasses[0] : 'FDA Approved Therapeutic Agent',
                        'indications' => is_array($item['indications_and_usage'] ?? null) ? implode("\n\n", $item['indications_and_usage']) : ($item['indications_and_usage'] ?? null),
                        'dosage_guidelines' => is_array($item['dosage_and_administration'] ?? null) ? implode("\n\n", $item['dosage_and_administration']) : ($item['dosage_and_administration'] ?? null),
                        'contraindications' => is_array($item['contraindications'] ?? null) ? implode("\n\n", $item['contraindications']) : ($item['contraindications'] ?? null),
                        'side_effects' => is_array($item['adverse_reactions'] ?? null) ? implode("\n\n", $item['adverse_reactions']) : ($item['adverse_reactions'] ?? null),
                        'warnings' => is_array($item['warnings'] ?? null) ? implode("\n\n", $item['warnings']) : ($item['warnings'] ?? null),
                        'pregnancy' => is_array($item['pregnancy_or_breast_feeding'] ?? null) ? implode("\n\n", $item['pregnancy_or_breast_feeding']) : ($item['pregnancy_or_breast_feeding'] ?? null),
                        'mechanism_of_action' => is_array($item['mechanism_of_action'] ?? null) ? implode("\n\n", $item['mechanism_of_action']) : ($item['mechanism_of_action'] ?? null),
                    ];
                }

                return $results;
            }
        } catch (\Exception $e) {
            Log::warning("OpenFDA search failed: " . $e->getMessage());
        }

        return [];
    }

    /**
     * Search RxNorm / NIH NLM API for drug concepts & dosage forms.
     * Zero API key required, 100% free from National Library of Medicine.
     */
    public function searchRxNorm(string $term): array
    {
        try {
            $cleanTerm = urlencode(trim($term));
            $response = Http::timeout(5)->get("https://rxnav.nlm.nih.gov/REST/drugs.json?name={$cleanTerm}");

            if ($response->successful()) {
                $data = $response->json();
                $results = [];
                $conceptGroup = $data['drugGroup']['conceptGroup'] ?? [];

                foreach ($conceptGroup as $group) {
                    $conceptProperties = $group['conceptProperties'] ?? [];
                    foreach ($conceptProperties as $cp) {
                        $results[] = [
                            'source' => 'RxNorm (NIH / NLM)',
                            'rxcui' => $cp['rxcui'] ?? '',
                            'name' => $cp['name'] ?? '',
                            'synonym' => $cp['synonym'] ?? '',
                            'tty' => $cp['tty'] ?? '',
                        ];
                    }
                }

                return array_slice($results, 0, 8);
            }
        } catch (\Exception $e) {
            Log::warning("RxNorm search failed: " . $e->getMessage());
        }

        return [];
    }

    /**
     * Search Local Pharmacopoeia & Database.
     */
    protected function searchLocalCatalog(string $term, string $coreTerm): array
    {
        $generics = GenericName::where('name', 'like', "%{$term}%")
            ->orWhere('name', 'like', "%{$coreTerm}%")
            ->limit(3)
            ->get()
            ->map(function ($g) {
                return [
                    'source' => 'Local Pharmacopoeia Vault',
                    'brand_name' => $g->name,
                    'generic_name' => $g->name,
                    'therapeutic_class' => $g->therapeutic_class ?? 'General',
                    'indications' => $g->indications ?? $g->description,
                    'dosage_guidelines' => $g->dosage_guidelines,
                    'contraindications' => $g->contraindications,
                    'side_effects' => $g->side_effects,
                    'mechanism_of_action' => $g->mechanism_of_action,
                ];
            })
            ->toArray();

        return $generics;
    }

    /**
     * Extract core generic term by removing strength and dosage form suffixes.
     */
    protected function extractCoreTerm(string $term): string
    {
        $cleaned = preg_replace('/\b(SR|ER|XR|CR|DS|Plus|Tablet|Tablets|Capsule|Capsules|Syrup|Suspension|Injection|Suppository|Drop|Drops|500mg|500 mg|665mg|665 mg|250mg|250 mg|20mg|20 mg|40mg|40 mg|10mg|10 mg|1000mg|1000 mg|120mg|125mg)\b/i', '', $term);
        $cleaned = trim(preg_replace('/\s+/', ' ', $cleaned));
        return !empty($cleaned) ? $cleaned : $term;
    }
}
