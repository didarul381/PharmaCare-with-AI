import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BookOpen,
    Search,
    Filter,
    Stethoscope,
    ShieldAlert,
    Pill,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Info,
    Printer,
    Plus,
    Edit,
    Trash2,
    ChevronRight,
    Building2,
    Boxes,
    X,
    ShieldCheck,
    Layers,
    Tag,
    Share2,
    Calendar,
    ArrowRight,
    HeartPulse,
    Eye,
    Globe,
    Check,
    Camera,
    FileText,
    Languages,
    Download,
    RefreshCw,
    ExternalLink
} from 'lucide-react';
import { StoreSetting, PageProps } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface BrandItem {
    id: number;
    name: string;
    brand_name: string;
    strength: string;
    dosage_form: string;
    dosage_form_id: number;
    manufacturer: string;
    manufacturer_id: number;
    generic_id: number;
    generic_name: string;
    therapeutic_class: string;
    pregnancy_category: string;
    is_controlled: boolean;
    unit_price: number;
    strip_price: number;
    box_price: number;
    total_stock: number;
    is_in_stock: boolean;
    earliest_expiry?: string;
    batch_number?: string;
}

interface SiblingForm {
    id: number;
    name: string;
    strength: string;
    form: string;
    price: number;
}

interface AlternateBrand {
    id: number;
    name: string;
    brand_name: string;
    strength: string;
    dosage_form: string;
    manufacturer: string;
    unit_price: number;
    total_stock: number;
    is_in_stock: boolean;
}

interface GenericMonograph {
    id: number;
    name: string;
    therapeutic_class: string;
    description?: string;
    indications?: string;
    dosage_guidelines?: string;
    contraindications?: string;
    side_effects?: string;
    mechanism_of_action?: string;
    counseling_points?: string;
    pregnancy_category: string;
    is_controlled: boolean;
    brands_count: number;
    total_vault_units: number;
    interactions: Array<{
        id: number;
        partner_name: string;
        partner_id: number;
        severity: 'mild' | 'moderate' | 'severe' | 'fatal';
        description: string;
        clinical_management?: string;
    }>;
    interactions_count: number;
}

interface CompanyItem {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    products_count: number;
}

interface DosageFormItem {
    id: number;
    name: string;
    medicines_count: number;
}

interface Props {
    mode: 'brands' | 'generics' | 'companies' | 'dosage_forms' | 'ddi_checker' | 'api_search';
    brands: BrandItem[];
    generics: GenericMonograph[];
    companies: CompanyItem[];
    dosage_forms: DosageFormItem[];
    therapeutic_classes: string[];
    active_brand: BrandItem | null;
    alternate_brands: AlternateBrand[];
    sibling_forms: SiblingForm[];
    active_generic_monograph: GenericMonograph | null;
    all_generics_list: { id: number; name: string; therapeutic_class?: string }[];
    metrics: {
        total_brands: number;
        total_generics: number;
        total_companies: number;
        total_forms: number;
        total_interactions: number;
    };
    filters: {
        mode: string;
        search?: string;
        letter?: string;
        brand_id?: number | null;
        generic_id?: number | null;
        company_id?: number | null;
        form_id?: number | null;
        therapeutic_class?: string;
        pregnancy_category?: string;
    };
    settings: StoreSetting;
}

export default function ClinicalReferenceIndex({
    mode,
    brands = [],
    generics = [],
    companies = [],
    dosage_forms = [],
    therapeutic_classes = [],
    active_brand = null,
    alternate_brands = [],
    sibling_forms = [],
    active_generic_monograph = null,
    all_generics_list = [],
    metrics,
    filters,
    settings,
}: Props) {
    const siblingForms = sibling_forms || [];
    const alternateBrands = alternate_brands || [];
    const dosageForms = dosage_forms || [];
    const allGenericsList = all_generics_list || [];
    const [currentMode, setCurrentMode] = useState<'brands' | 'generics' | 'companies' | 'dosage_forms' | 'ddi_checker' | 'api_search'>(
        (filters.mode as any) || mode || 'brands'
    );
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedLetter, setSelectedLetter] = useState(filters.letter || '');
    const [selectedPregnancy, setSelectedPregnancy] = useState(filters.pregnancy_category || '');

    // Bangla / English Language Toggle
    const [isBanglaMode, setIsBanglaMode] = useState<boolean>(false);

    // Modals: Pack Image & Innovator's Monograph
    const [showPackImageModal, setShowPackImageModal] = useState<boolean>(false);
    const [showInnovatorModal, setShowInnovatorModal] = useState<boolean>(false);
    const [selectedInnovatorForm, setSelectedInnovatorForm] = useState<string>('Tablet');

    // Free API Search State
    const [apiSearchTerm, setApiSearchTerm] = useState<string>('');
    const [apiSearching, setApiSearching] = useState<boolean>(false);
    const [apiResults, setApiResults] = useState<{
        medex: any[];
        openfda: any[];
        rxnorm: any[];
        local: any[];
    } | null>(null);
    const [importingApiItem, setImportingApiItem] = useState<string | null>(null);
    const [apiImportSuccess, setApiImportSuccess] = useState<string | null>(null);

    // DDI Checker State
    const [checkerSelectedGenerics, setCheckerSelectedGenerics] = useState<number[]>([]);
    const [checkerResults, setCheckerResults] = useState<{
        interactions: Array<{
            id: number;
            generic_a: string;
            generic_b: string;
            severity: 'mild' | 'moderate' | 'severe' | 'fatal';
            description: string;
            clinical_management?: string;
        }>;
        has_interactions: boolean;
        max_severity: string;
        count: number;
    } | null>(null);
    const [checkerLoading, setCheckerLoading] = useState(false);

    const alphabet = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    const navigateFilter = (params: Record<string, any>) => {
        router.get(
            '/clinical-reference',
            {
                mode: currentMode,
                search: searchTerm || undefined,
                letter: selectedLetter || undefined,
                pregnancy_category: selectedPregnancy || undefined,
                ...params,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigateFilter({ search: searchTerm });
    };

    const handleLetterClick = (letter: string) => {
        const nextLetter = selectedLetter === letter ? '' : letter;
        setSelectedLetter(nextLetter);
        navigateFilter({ letter: nextLetter });
    };

    const handleModeSwitch = (newMode: 'brands' | 'generics' | 'companies' | 'dosage_forms' | 'ddi_checker' | 'api_search') => {
        setCurrentMode(newMode);
        if (newMode === 'api_search') return;
        navigateFilter({ mode: newMode, letter: '', brand_id: undefined, generic_id: undefined });
    };

    const handleSelectBrand = (brandId: number) => {
        navigateFilter({ brand_id: brandId });
    };

    const handleSelectGeneric = (genericId: number) => {
        setCurrentMode('brands');
        navigateFilter({ mode: 'brands', generic_id: genericId, brand_id: undefined });
    };

    const handleSelectCompany = (companyId: number) => {
        setCurrentMode('brands');
        navigateFilter({ mode: 'brands', company_id: companyId, brand_id: undefined });
    };

    const handleSelectForm = (formId: number) => {
        setCurrentMode('brands');
        navigateFilter({ mode: 'brands', form_id: formId, brand_id: undefined });
    };

    // Free API Search Execution
    const executeFreeApiSearch = async (term: string) => {
        if (!term || term.trim().length < 2) return;
        setApiSearching(true);
        setApiImportSuccess(null);
        try {
            const res = await fetch(`/clinical-reference/free-api-search?term=${encodeURIComponent(term)}`);
            const data = await res.json();
            if (data.status === 'success') {
                setApiResults({
                    medex: data.medex || [],
                    openfda: data.openfda || [],
                    rxnorm: data.rxnorm || [],
                    local: data.local || [],
                });
            }
        } catch (err) {
            console.error('API search failed', err);
        } finally {
            setApiSearching(false);
        }
    };

    // 1-Click Import from Free API
    const handleImportFromApi = async (item: any) => {
        setImportingApiItem(item.generic_name || item.brand_name);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/clinical-reference/import-from-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify(item),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setApiImportSuccess(`Successfully imported '${item.generic_name}' into Pharmacy Catalog!`);
                setTimeout(() => {
                    router.reload();
                }, 1200);
            }
        } catch (err) {
            console.error('Import failed', err);
        } finally {
            setImportingApiItem(null);
        }
    };

    // DDI Checker Action
    const handleToggleCheckerGeneric = async (genericId: number) => {
        const updated = checkerSelectedGenerics.includes(genericId)
            ? checkerSelectedGenerics.filter((id) => id !== genericId)
            : [...checkerSelectedGenerics, genericId];

        setCheckerSelectedGenerics(updated);

        if (updated.length < 2) {
            setCheckerResults(null);
            return;
        }

        setCheckerLoading(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/clinical-reference/check-interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ generic_ids: updated }),
            });
            const data = await res.json();
            setCheckerResults(data);
        } catch (err) {
            console.error('Failed to run DDI screening', err);
        } finally {
            setCheckerLoading(false);
        }
    };

    // Dedicated Print Engine
    const handlePrintMonograph = () => {
        if (!active_brand) return;

        let iframe = document.getElementById('pharma-medex-print-frame') as HTMLIFrameElement;
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'pharma-medex-print-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }

        const printableZone = document.getElementById('medex-monograph-printable');
        if (!printableZone) return;

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            window.print();
            return;
        }

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>MedEx Clinical Monograph - ${active_brand.name}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm 15mm; }
                    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body {
                        margin: 0; padding: 10px; background: #ffffff !important; color: #0f172a !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        font-size: 11px; line-height: 1.45;
                    }
                    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
                    h1 { margin: 0; font-size: 18px; color: #020617; text-transform: uppercase; }
                    .tagline { color: #64748b; font-size: 10px; margin-top: 2px; }
                    .brand-title { font-size: 16px; font-weight: 900; color: #0f172a; }
                    .generic-title { font-size: 12px; font-weight: bold; color: #0284c7; }
                    .company-title { font-size: 11px; color: #64748b; }
                    .price-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; margin: 10px 0; }
                    .section-title { font-size: 11.5px; font-weight: bold; text-transform: uppercase; color: #047857; margin-top: 12px; margin-bottom: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; }
                    .section-body { font-size: 10.5px; color: #334155; margin-bottom: 8px; line-height: 1.4; }
                    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                    th, td { padding: 5px 6px; border: 1px solid #cbd5e1; font-size: 10px; }
                    th { background: #f8fafc; font-weight: bold; text-align: left; }
                    .footer { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 9px; color: #64748b; text-align: center; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>${settings.store_name}</h1>
                        <div class="tagline">MedEx Medicine Dictionary & Clinical Reference</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="padding:3px 6px; background:#f1f5f9; border:1px solid #cbd5e1; font-weight:bold; font-size:10px;">
                            FDA Pregnancy Cat: ${active_brand.pregnancy_category}
                        </span>
                    </div>
                </div>

                <div style="margin-bottom: 8px;">
                    <div class="brand-title">${active_brand.name}</div>
                    <div class="generic-title">${active_brand.generic_name} • ${active_brand.strength} (${active_brand.dosage_form})</div>
                    <div class="company-title">Manufactured by: ${active_brand.manufacturer}</div>
                </div>

                <div class="price-box">
                    <strong>Retail Unit Price:</strong> ৳ ${active_brand.unit_price.toFixed(2)} |
                    <strong>Strip Price (10's):</strong> ৳ ${active_brand.strip_price.toFixed(2)} |
                    <strong>Box Price:</strong> ৳ ${active_brand.box_price.toFixed(2)}
                </div>

                ${printableZone.innerHTML}

                <div class="footer">
                    Clinical Reference & Patient Leaflet. Generated by PharmaCare AI Clinical Module (MedEx Standard). Verify clinical suitability for individual patient conditions.
                </div>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }, 250);
    };

    const getPregnancyBadge = (cat: string) => {
        switch (cat?.toUpperCase()) {
            case 'A':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            case 'B':
                return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
            case 'C':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            case 'D':
                return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
            case 'X':
                return 'bg-rose-600/30 text-rose-300 border-rose-500/50 font-black';
            default:
                return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    // Bangla Translation Helper for Napa / Common BD Medicines
    const getBanglaTranslation = (key: string, genericName: string, brandName: string) => {
        const isParacetamol = genericName?.toLowerCase().includes('paracetamol');
        const isEsomeprazole = genericName?.toLowerCase().includes('esomeprazole');

        if (isParacetamol) {
            switch (key) {
                case 'brand_bn':
                    return 'নাপা ৫০০ মি.গ্রা. ট্যাবলেট';
                case 'indications':
                    return 'জ্বর, সাধারণ সর্দি-কাশি ও ইনফ্লুয়েঞ্জা, মাথাব্যথা, দাঁতব্যথা, কানের ব্যথা, শরীর ব্যথা, মাংসপেশির টান ও প্রদাহজনিত অস্বস্তি উপশমে নির্দেশিত।';
                case 'dosage':
                    return 'প্রাপ্তবয়স্ক: ১-২ টি ট্যাবলেট প্রতি ৪-৬ ঘণ্টা পরপর (দিনে সর্বোচ্চ ৪০০০ মি.গ্রা. বা ৮টি ট্যাবলেট)। শিশু (৬-১২ বছর): ১/২ থেকে ১ টি ট্যাবলেট দিনে ৩-৪ বার। খাবারের পরে প্রচুর পানি সহ সেবন করা উচিত।';
                case 'side_effects':
                    return 'অনুমোদিত মাত্রায় পার্শ্ব প্রতিক্রিয়া অত্যন্ত বিরল। অ্যালার্জি বা র্যাশ হতে পারে। মাত্রাতিরিক্ত সেবনের ক্ষেত্রে যকৃতের ক্ষতি (হেপাটোটক্সিসিটি) হতে পারে।';
                case 'contraindications':
                    return 'প্যারাসিটামল বা এর কোনো উপাদানের প্রতি অতিসংবেদনশীল রোগীদের ক্ষেত্রে এবং তীব্র হেপাটিক বৈকল্যে নির্দেশিত নয়।';
                case 'pregnancy':
                    return 'গর্ভাবস্থায় ও স্তন্যদানকালে নির্দেশিত মাত্রায় নিরাপদ (FDA Category B)।';
                default:
                    return '';
            }
        }

        if (isEsomeprazole) {
            switch (key) {
                case 'brand_bn':
                    return `${brandName} ২০ মি.গ্রা. ক্যাপসুল`;
                case 'indications':
                    return 'গ্যাস্ট্রোইসোফেজিয়াল রিফ্লাক্স ডিজিজ (GERD), পেপটিক আলসার, বুকজ্বালা এবং এনএসএআইডি জনিত আলসার প্রতিরোধে নির্দেশিত।';
                case 'dosage':
                    return 'প্রাপ্তবয়স্ক: ২০ মি.গ্রা. থেকে ৪০ মি.গ্রা. প্রতিদিন সকালে খাবারের ৩০-৬০ মিনিট পূর্বে সেব্য।';
                case 'side_effects':
                    return 'মাথাব্যথা, পেটব্যথা, ডায়রিয়া, পেটফাঁপা ও বমি বমি ভাব হতে পারে।';
                case 'contraindications':
                    return 'এসোমিপ্রাজল বা অন্যান্য প্রোটন পাম্প ইনহিবিটরের প্রতি সংবেদনশীলতায় নিষেধ।';
                case 'pregnancy':
                    return 'গর্ভাবস্থা ক্যাটাগরি B। চিকিৎসকের পরামর্শ ব্যতীত স্তন্যদানকালে পরিহার্য।';
                default:
                    return '';
            }
        }

        return '';
    };

    return (
        <AuthenticatedLayout
            activeTab="clinical-reference"
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black shadow-glow-emerald">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-white tracking-tight">MedEx Medicine Dictionary</h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                                    Live BD Encyclopedia
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Bangladesh's medicine catalog, MRP matrix, competing brands, free API clinical search & pharmacology
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl px-3 py-1.5 text-xs text-slate-300">
                        <span><strong>{metrics.total_brands}</strong> Brands</span>
                        <span className="text-slate-600">•</span>
                        <span><strong>{metrics.total_generics}</strong> Generics</span>
                        <span className="text-slate-600">•</span>
                        <span><strong>{metrics.total_companies}</strong> Companies</span>
                    </div>
                </div>
            }
        >
            <Head title="MedEx Medicine Dictionary & Clinical Reference" />

            {/* MedEx Universal Hero Search & Category Bar */}
            <div className="glass-panel rounded-3xl p-5 mb-6 border border-slate-800 space-y-4 shadow-xl">
                {/* Search input with category icons */}
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <Search className="w-5 h-5 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by Brand Name (e.g. Napa, Sergel, Ace), Generic Molecule, or Company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-28 py-3 text-sm bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition shadow-inner"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-glow-emerald transition"
                    >
                        Search
                    </button>
                </form>

                {/* MedEx Main Category Switcher */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => handleModeSwitch('brands')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap",
                            currentMode === 'brands'
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-glow-emerald"
                                : "bg-slate-900/70 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Pill className="w-3.5 h-3.5" />
                        <span>Brand Names (Allopathic)</span>
                    </button>

                    <button
                        onClick={() => handleModeSwitch('generics')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap",
                            currentMode === 'generics'
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-glow-emerald"
                                : "bg-slate-900/70 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Generics & Molecules</span>
                    </button>

                    <button
                        onClick={() => handleModeSwitch('companies')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap",
                            currentMode === 'companies'
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-glow-emerald"
                                : "bg-slate-900/70 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Pharmaceuticals</span>
                    </button>

                    <button
                        onClick={() => handleModeSwitch('dosage_forms')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap",
                            currentMode === 'dosage_forms'
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-glow-emerald"
                                : "bg-slate-900/70 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Dosage Forms</span>
                    </button>

                    <button
                        onClick={() => handleModeSwitch('api_search')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap",
                            currentMode === 'api_search'
                                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-glow-cyan"
                                : "bg-slate-900/70 text-cyan-300 border-slate-800 hover:bg-slate-800"
                        )}
                    >
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Free Drug API Search (openFDA / RxNorm)</span>
                    </button>

                    <button
                        onClick={() => handleModeSwitch('ddi_checker')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap",
                            currentMode === 'ddi_checker'
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-glow-amber"
                                : "bg-slate-900/70 text-amber-300 border-slate-800 hover:bg-slate-800"
                        )}
                    >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>DDI Checker</span>
                    </button>
                </div>

                {/* MedEx A-Z Alphabetical Index Bar */}
                {currentMode !== 'ddi_checker' && currentMode !== 'api_search' && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-2">A-Z Index:</span>
                        <div className="flex items-center gap-1">
                            {alphabet.map((letter) => (
                                <button
                                    key={letter}
                                    onClick={() => handleLetterClick(letter)}
                                    className={cn(
                                        "w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0",
                                        selectedLetter === letter
                                            ? "bg-cyan-500 text-slate-950 shadow-glow-cyan"
                                            : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                                    )}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* VIEW 1: MEDEX BRAND MEDICINES DIRECTORY & DEEP DIVE (Like MedEx Napa 500mg) */}
            {currentMode === 'brands' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Brand List (5 cols) */}
                    <div className="lg:col-span-5 space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                        <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-1">
                            <span>Showing <strong>{brands.length}</strong> Brand Medicines</span>
                            {selectedLetter && <span>Letter: <strong>{selectedLetter}</strong></span>}
                        </div>

                        {brands.map((b) => {
                            const isSelected = active_brand?.id === b.id;
                            return (
                                <div
                                    key={b.id}
                                    onClick={() => handleSelectBrand(b.id)}
                                    className={cn(
                                        "glass-card-interactive rounded-2xl p-3.5 cursor-pointer border transition select-none flex flex-col justify-between",
                                        isSelected
                                            ? "border-emerald-500/80 bg-emerald-500/10 shadow-glow-emerald"
                                            : "border-slate-800/90 hover:border-slate-700 bg-slate-900/50"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className={cn(
                                                    "font-bold text-sm leading-snug",
                                                    isSelected ? "text-emerald-300" : "text-white"
                                                )}>
                                                    {b.name}
                                                </h3>
                                                <span className="text-[11px] text-cyan-400 font-semibold block mt-0.5">
                                                    {b.generic_name} • {b.strength}
                                                </span>
                                            </div>

                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                                                {b.dosage_form}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-slate-400 mt-1">
                                            {b.manufacturer}
                                        </p>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Unit MRP</span>
                                            <span className="font-mono font-bold text-emerald-400">
                                                {formatCurrency(b.unit_price)}
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 block">Vault Stock</span>
                                            <span className={cn(
                                                "font-mono text-xs font-bold",
                                                b.total_stock > 0 ? "text-white" : "text-rose-400"
                                            )}>
                                                {b.total_stock > 0 ? `${b.total_stock} in vault` : 'Out of Stock'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {brands.length === 0 && (
                            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                                No brands found matching your search.
                            </div>
                        )}
                    </div>

                    {/* Right: MedEx Authentic Brand Deep Monograph (7 cols) */}
                    <div className="lg:col-span-7">
                        {active_brand ? (
                            <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
                                {/* MedEx Exact Brand Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                <Pill className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <h2 className="text-2xl font-black text-white">{active_brand.brand_name || active_brand.name}</h2>
                                                    <span className="text-sm font-bold text-slate-400">{active_brand.dosage_form}</span>
                                                </div>
                                                <div className="text-xs text-emerald-400 font-medium">
                                                    {getBanglaTranslation('brand_bn', active_brand.generic_name, active_brand.brand_name) || `${active_brand.brand_name} ${active_brand.strength}`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 text-xs space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">Generic:</span>
                                                <button
                                                    onClick={() => handleSelectGeneric(active_brand.generic_id)}
                                                    className="text-cyan-400 hover:underline font-bold"
                                                >
                                                    {active_brand.generic_name}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">Strength:</span>
                                                <span className="text-slate-200 font-bold">{active_brand.strength}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">Manufactured by:</span>
                                                <button
                                                    onClick={() => handleSelectCompany(active_brand.manufacturer_id)}
                                                    className="text-slate-200 hover:text-emerald-400 font-bold transition"
                                                >
                                                    {active_brand.manufacturer}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons: Pack Image & Innovator Monograph */}
                                    <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                                        <button
                                            onClick={() => setShowPackImageModal(true)}
                                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-glow-emerald transition"
                                        >
                                            <Camera className="w-3.5 h-3.5" />
                                            <span>Pack Image</span>
                                        </button>

                                        <button
                                            onClick={() => setShowInnovatorModal(true)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5 border border-teal-500/30 transition"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-teal-400" />
                                            <span>Innovator's Monograph</span>
                                        </button>

                                        <button
                                            onClick={handlePrintMonograph}
                                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                                            title="Print Patient Leaflet"
                                        >
                                            <Printer className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>Print Leaflet</span>
                                        </button>
                                    </div>
                                </div>

                                {/* MedEx Packaging & Price Matrix Box (Exact Napa 500mg specs) */}
                                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400">Unit Price:</span>
                                            <span className="text-xl font-black text-emerald-400 font-mono ml-2">
                                                {formatCurrency(active_brand.unit_price)}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-400 font-mono">
                                            (51 x 10: {formatCurrency(active_brand.unit_price * 510)})
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Strip Price (10's):</span>
                                            <span className="font-mono font-bold text-cyan-400 text-sm">
                                                {formatCurrency(active_brand.strip_price)}
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Live Pharmacy Stock:</span>
                                            <span className={cn(
                                                "font-mono font-bold text-sm",
                                                active_brand.total_stock > 0 ? "text-white" : "text-rose-400"
                                            )}>
                                                {active_brand.total_stock > 0 ? `${active_brand.total_stock} in vault` : 'Out of Stock'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* MedEx: Also Available As (Sibling Forms & Strengths of this Brand) */}
                                {siblingForms.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-300 block">
                                            Also available as ({siblingForms.length} Sibling Formulations of {active_brand.brand_name}):
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {siblingForms.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => handleSelectBrand(s.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-200 flex items-center gap-1.5 transition"
                                                >
                                                    <span className="font-bold text-white">{s.strength}</span>
                                                    <span className="text-slate-400 text-[10px]">({s.form})</span>
                                                    <span className="text-emerald-400 font-mono font-semibold ml-1">{formatCurrency(s.price)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* MedEx: Alternate Competing Brands Table */}
                                {alternateBrands.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                <Boxes className="w-4 h-4 text-cyan-400" />
                                                <span>Alternate Brands of {active_brand.generic_name} ({alternateBrands.length})</span>
                                            </h4>
                                            <span className="text-[10px] text-slate-400">Competing manufacturers</span>
                                        </div>

                                        <div className="overflow-x-auto rounded-2xl border border-slate-800">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                                                        <th className="py-2.5 px-3">Brand Name</th>
                                                        <th className="py-2.5 px-3">Form & Strength</th>
                                                        <th className="py-2.5 px-3">Manufacturer</th>
                                                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                                                        <th className="py-2.5 px-3 text-right">Vault Stock</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                                                    {alternateBrands.map((alt) => (
                                                        <tr
                                                            key={alt.id}
                                                            onClick={() => handleSelectBrand(alt.id)}
                                                            className="hover:bg-slate-800/50 cursor-pointer transition"
                                                        >
                                                            <td className="py-2.5 px-3 font-bold text-emerald-300">
                                                                {alt.name}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-300">
                                                                {alt.strength} ({alt.dosage_form})
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-400">{alt.manufacturer}</td>
                                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                                                {formatCurrency(alt.unit_price)}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right">
                                                                <span className={cn(
                                                                    "font-mono text-[11px] font-bold px-2 py-0.5 rounded",
                                                                    alt.total_stock > 0 ? "bg-emerald-500/20 text-emerald-300" : "text-slate-500"
                                                                )}>
                                                                    {alt.total_stock > 0 ? `${alt.total_stock} pcs` : '0 in stock'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* MedEx Full Clinical Pharmacology Sections (with English & Bengali Toggle) */}
                                {active_generic_monograph && (
                                    <div id="medex-monograph-printable" className="space-y-4 pt-4 border-t border-slate-800">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                                            <div>
                                                <h3 className="text-sm font-black text-white">
                                                    Clinical Pharmacology Monograph ({active_brand.generic_name})
                                                </h3>
                                                <span className="text-[11px] text-slate-400">
                                                    Therapeutic Class: <strong className="text-cyan-400">{active_generic_monograph.therapeutic_class}</strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Language Switcher */}
                                                <button
                                                    onClick={() => setIsBanglaMode(!isBanglaMode)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition",
                                                        isBanglaMode
                                                            ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                                            : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white"
                                                    )}
                                                >
                                                    <Languages className="w-3.5 h-3.5" />
                                                    <span>{isBanglaMode ? 'বাংলা (Bangla)' : 'English'}</span>
                                                </button>

                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                                                    getPregnancyBadge(active_brand.pregnancy_category)
                                                )}>
                                                    Pregnancy Cat: {active_brand.pregnancy_category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 1. Indications */}
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Stethoscope className="w-3.5 h-3.5" />
                                                <span>{isBanglaMode ? 'ব্যবহার / নির্দেশনা (Indications)' : 'Indications'}</span>
                                            </h4>
                                            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80">
                                                {isBanglaMode && getBanglaTranslation('indications', active_brand.generic_name, active_brand.brand_name)
                                                    ? getBanglaTranslation('indications', active_brand.generic_name, active_brand.brand_name)
                                                    : active_generic_monograph.indications || active_generic_monograph.description || 'Clinical indications guideline.'}
                                            </p>
                                        </div>

                                        {/* 2. Dosage & Administration */}
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Pill className="w-3.5 h-3.5" />
                                                <span>{isBanglaMode ? 'মাত্রা ও সেবনবিধি (Dosage & Administration)' : 'Dosage & Administration'}</span>
                                            </h4>
                                            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80">
                                                {isBanglaMode && getBanglaTranslation('dosage', active_brand.generic_name, active_brand.brand_name)
                                                    ? getBanglaTranslation('dosage', active_brand.generic_name, active_brand.brand_name)
                                                    : active_generic_monograph.dosage_guidelines || 'Administer according to individual physician prescription and patient kidney/liver profile.'}
                                            </p>
                                        </div>

                                        {/* 3. Pharmacology & Mechanism of Action */}
                                        {active_generic_monograph.mechanism_of_action && (
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <HeartPulse className="w-3.5 h-3.5" />
                                                    <span>{isBanglaMode ? 'ফার্মাকোলজি ও কার্যপদ্ধতি (Pharmacology)' : 'Pharmacology & Mechanism of Action'}</span>
                                                </h4>
                                                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80">
                                                    {active_generic_monograph.mechanism_of_action}
                                                </p>
                                            </div>
                                        )}

                                        {/* 4. Side Effects */}
                                        {active_generic_monograph.side_effects && (
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    <span>{isBanglaMode ? 'পার্শ্ব প্রতিক্রিয়া (Side Effects)' : 'Side Effects & Adverse Reactions'}</span>
                                                </h4>
                                                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80">
                                                    {isBanglaMode && getBanglaTranslation('side_effects', active_brand.generic_name, active_brand.brand_name)
                                                        ? getBanglaTranslation('side_effects', active_brand.generic_name, active_brand.brand_name)
                                                        : active_generic_monograph.side_effects}
                                                </p>
                                            </div>
                                        )}

                                        {/* 5. Contraindications */}
                                        {active_generic_monograph.contraindications && (
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    <span>{isBanglaMode ? 'প্রতিনির্দেশনা ও সতর্কতা (Contraindications)' : 'Contraindications & Warnings'}</span>
                                                </h4>
                                                <p className="text-xs text-rose-300/90 leading-relaxed bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/20">
                                                    {isBanglaMode && getBanglaTranslation('contraindications', active_brand.generic_name, active_brand.brand_name)
                                                        ? getBanglaTranslation('contraindications', active_brand.generic_name, active_brand.brand_name)
                                                        : active_generic_monograph.contraindications}
                                                </p>
                                            </div>
                                        )}

                                        {/* 6. Pregnancy & Lactation */}
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>{isBanglaMode ? 'গর্ভাবস্থায় ও স্তন্যদানকালে ব্যবহার (Pregnancy & Lactation)' : 'Pregnancy & Lactation'}</span>
                                            </h4>
                                            <p className="text-xs text-teal-200/90 leading-relaxed bg-teal-500/10 p-3.5 rounded-2xl border border-teal-500/20">
                                                {isBanglaMode && getBanglaTranslation('pregnancy', active_brand.generic_name, active_brand.brand_name)
                                                    ? getBanglaTranslation('pregnancy', active_brand.generic_name, active_brand.brand_name)
                                                    : `FDA Pregnancy Category ${active_brand.pregnancy_category}. Safe when used within recommended dosage guidelines under physician supervision.`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                                <Pill className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                <p className="font-bold text-sm text-slate-300">Select a brand medicine on the left</p>
                                <p className="text-slate-500 mt-1">View MedEx pricing matrix, competing brands, pack images, and full pharmacology.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 2: FREE DRUG API LIVE SEARCH (openFDA & RxNorm) */}
            {currentMode === 'api_search' && (
                <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 bg-cyan-500/5 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-cyan-400" />
                                <span>Free Public Drug APIs Live Search (openFDA & RxNorm NIH)</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Query US FDA and National Library of Medicine public databases with zero API keys. 1-click import into your local pharmacy catalog.
                            </p>
                        </div>
                    </div>

                    {/* API Search Form */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Enter any medicine name (e.g. Paracetamol, Amoxicillin, Omeprazole, Napa, Metformin)..."
                            value={apiSearchTerm}
                            onChange={(e) => setApiSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeFreeApiSearch(apiSearchTerm)}
                            className="flex-1 px-4 py-3 text-sm bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                        <button
                            onClick={() => executeFreeApiSearch(apiSearchTerm)}
                            disabled={apiSearching}
                            className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-2xl shadow-glow-cyan transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                        >
                            {apiSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            <span>{apiSearching ? 'Searching APIs...' : 'Search Free APIs'}</span>
                        </button>
                    </div>

                    {apiImportSuccess && (
                        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{apiImportSuccess}</span>
                        </div>
                    )}

                    {/* Results Container */}
                    {apiResults && (
                        <div className="space-y-6">
                            {/* Summary count */}
                            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                                <span>
                                    Found <strong>{apiResults.medex.length + apiResults.openfda.length + apiResults.local.length + apiResults.rxnorm.length}</strong> matching records across MedEx BD, openFDA & RxNorm
                                </span>
                                <div className="flex items-center gap-2">
                                    {apiResults.medex.length > 0 && (
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                            {apiResults.medex.length} MedEx BD
                                        </span>
                                    )}
                                    {apiResults.openfda.length > 0 && (
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                                            {apiResults.openfda.length} openFDA
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 1. MedEx Bangladesh Live Results */}
                            {apiResults.medex.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4" />
                                        <span>MedEx Bangladesh Live Brands ({apiResults.medex.length})</span>
                                    </h3>

                                    {apiResults.medex.map((item, idx) => (
                                        <div key={idx} className="p-5 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-3 shadow-lg">
                                            <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-slate-800">
                                                <div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                                                        {item.source}
                                                    </span>
                                                    <h4 className="text-lg font-black text-white mt-1">
                                                        {item.brand_name} {item.strength && <span className="text-sm text-cyan-300 font-bold font-mono">({item.strength})</span>}
                                                    </h4>
                                                    <span className="text-xs text-slate-300 font-semibold">
                                                        Generic: <strong className="text-emerald-400">{item.generic_name}</strong> • Form: {item.dosage_form}
                                                    </span>
                                                    <p className="text-xs text-slate-400 mt-0.5">Manufactured by: <strong className="text-slate-200">{item.manufacturer}</strong></p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                                    {item.unit_price && item.unit_price !== 'N/A' && (
                                                        <div className="text-right bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                                                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Unit Price</span>
                                                            <span className="text-base font-black text-emerald-400 font-mono">{item.unit_price}</span>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => handleImportFromApi(item)}
                                                        disabled={importingApiItem === item.generic_name}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-glow-emerald transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>{importingApiItem === item.generic_name ? 'Importing...' : '1-Click Sync to Catalog'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {item.indications && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Indications (MedEx BD):</span>
                                                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                                        {item.indications}
                                                    </p>
                                                </div>
                                            )}

                                            {item.dosage_guidelines && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-cyan-400 uppercase block">Dosage & Administration:</span>
                                                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                                        {item.dosage_guidelines}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 2. openFDA Public Clinical Drug Labels */}
                            {apiResults.openfda.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Globe className="w-4 h-4" />
                                        <span>US FDA Clinical Monograph API ({apiResults.openfda.length})</span>
                                    </h3>

                                    {apiResults.openfda.map((item, idx) => (
                                        <div key={idx} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                                            <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-slate-800">
                                                <div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                                                        {item.source}
                                                    </span>
                                                    <h4 className="text-base font-black text-white mt-1">{item.generic_name} ({item.brand_name})</h4>
                                                    <span className="text-xs text-slate-400">{item.therapeutic_class} • {item.manufacturer}</span>
                                                </div>

                                                <button
                                                    onClick={() => handleImportFromApi(item)}
                                                    disabled={importingApiItem === item.generic_name}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-glow-emerald transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>{importingApiItem === item.generic_name ? 'Importing...' : '1-Click Sync to Catalog'}</span>
                                                </button>
                                            </div>

                                            {item.indications && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Indications & Usage (FDA):</span>
                                                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 max-h-32 overflow-y-auto">
                                                        {item.indications}
                                                    </p>
                                                </div>
                                            )}

                                            {item.dosage_guidelines && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-cyan-400 uppercase block">Dosage Guidelines (FDA):</span>
                                                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 max-h-28 overflow-y-auto">
                                                        {item.dosage_guidelines}
                                                    </p>
                                                </div>
                                            )}

                                            {item.side_effects && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Adverse Reactions & Side Effects (FDA):</span>
                                                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 max-h-28 overflow-y-auto">
                                                        {item.side_effects}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 3. RxNorm Concepts */}
                            {apiResults.rxnorm.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                                        RxNorm NIH Formulations & Concepts ({apiResults.rxnorm.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {apiResults.rxnorm.map((rc, idx) => (
                                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium">
                                                {rc.name} {rc.synonym && <span className="text-slate-500 text-[10px]">({rc.synonym})</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {apiResults.medex.length === 0 && apiResults.openfda.length === 0 && apiResults.local.length === 0 && apiResults.rxnorm.length === 0 && (
                                <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                                    No records found in public databases or MedEx for "{apiSearchTerm}".
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* VIEW 3: MEDEX GENERICS / MOLECULES MONOGRAPHS */}
            {currentMode === 'generics' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span>Showing <strong>{generics.length}</strong> Generic Molecules</span>
                        {selectedLetter && <span>Letter: <strong>{selectedLetter}</strong></span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generics.map((gen) => (
                            <div
                                key={gen.id}
                                className="glass-card-interactive rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-black text-base text-white hover:text-emerald-400 transition cursor-pointer"
                                            onClick={() => handleSelectGeneric(gen.id)}>
                                            {gen.name}
                                        </h3>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                                            getPregnancyBadge(gen.pregnancy_category)
                                        )}>
                                            Cat {gen.pregnancy_category}
                                        </span>
                                    </div>

                                    <span className="text-xs font-semibold text-emerald-400 block mb-2">
                                        {gen.therapeutic_class}
                                    </span>

                                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                                        {gen.indications || gen.description || 'Clinical monograph details available.'}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                                    <button
                                        onClick={() => {
                                            setCurrentMode('brands');
                                            navigateFilter({ mode: 'brands', generic_id: gen.id });
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                                    >
                                        <span>View {gen.brands_count} Brands</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>

                                    <span className="text-slate-500 font-mono text-[11px]">
                                        {gen.total_vault_units} Units in vault
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 4: MEDEX PHARMACEUTICAL COMPANIES DIRECTORY */}
            {currentMode === 'companies' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span>Showing <strong>{companies.length}</strong> Pharmaceutical Manufacturers</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companies.map((comp) => (
                            <div
                                key={comp.id}
                                onClick={() => handleSelectCompany(comp.id)}
                                className="glass-card-interactive rounded-2xl p-5 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-white">{comp.name}</h3>
                                            <span className="text-[11px] text-slate-500 font-mono">{comp.phone || 'Bangladesh'}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                                        {comp.address || 'Corporate Office, Dhaka, Bangladesh'}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                                    <span className="font-bold text-emerald-400">
                                        {comp.products_count} Products Catalog
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1 font-semibold">
                                        <span>Browse Brands</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 5: MEDEX DOSAGE FORMS EXPLORER */}
            {currentMode === 'dosage_forms' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span>Showing <strong>{dosage_forms.length}</strong> Dosage Formulations</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {dosage_forms.map((form) => (
                            <div
                                key={form.id}
                                onClick={() => handleSelectForm(form.id)}
                                className="glass-card-interactive rounded-2xl p-5 border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition text-center space-y-2"
                            >
                                <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                                    <Boxes className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-sm text-white">{form.name}</h3>
                                <span className="text-xs font-bold text-emerald-400 block">
                                    {form.medicines_count} Formulations
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 6: MULTI-DRUG DDI CHECKER TOOL */}
            {currentMode === 'ddi_checker' && (
                <div className="glass-panel rounded-3xl p-6 border border-amber-500/30 bg-amber-500/5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-400" />
                                <span>Multi-Drug Interaction (DDI) Screening Engine</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Select 2 or more generic molecules to test pairwise pharmacological conflicts and contraindications.
                            </p>
                        </div>
                        {checkerSelectedGenerics.length > 0 && (
                            <button
                                onClick={() => {
                                    setCheckerSelectedGenerics([]);
                                    setCheckerResults(null);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 border border-slate-700 self-start"
                            >
                                Clear Selection ({checkerSelectedGenerics.length})
                            </button>
                        )}
                    </div>

                    {/* Generic Pill Selector */}
                    <div>
                        <span className="text-xs font-bold text-slate-300 mb-2 block">
                            Click to Select Compounds ({checkerSelectedGenerics.length} Selected):
                        </span>
                        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-1">
                            {all_generics_list.map((gen) => {
                                const isSelected = checkerSelectedGenerics.includes(gen.id);
                                return (
                                    <button
                                        key={gen.id}
                                        onClick={() => handleToggleCheckerGeneric(gen.id)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5",
                                            isSelected
                                                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-glow-amber"
                                                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                                        )}
                                    >
                                        <span>{gen.name}</span>
                                        {isSelected && <X className="w-3.5 h-3.5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {checkerSelectedGenerics.length < 2 && (
                        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                            <Info className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                            <p className="font-semibold text-slate-300">Select at least 2 generic medications above to run DDI analysis.</p>
                        </div>
                    )}

                    {checkerLoading && (
                        <div className="p-6 text-center text-xs text-amber-400 animate-pulse">
                            Running pharmacological interaction screening...
                        </div>
                    )}

                    {checkerResults && !checkerLoading && (
                        <div className="space-y-4 pt-2">
                            {checkerResults.has_interactions ? (
                                <div className="space-y-3">
                                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300 font-bold">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                                            <span>Detected {checkerResults.count} Pharmacological Conflict(s)</span>
                                        </div>
                                        <span className="uppercase text-[10px] px-2.5 py-0.5 rounded bg-rose-500/30 border border-rose-500/40">
                                            Max Risk: {checkerResults.max_severity}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {checkerResults.interactions.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                        <span className="text-cyan-400">{item.generic_a}</span>
                                                        <span className="text-slate-500">⇄</span>
                                                        <span className="text-amber-400">{item.generic_b}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded text-[10px] uppercase border font-bold",
                                                        item.severity === 'severe' || item.severity === 'fatal'
                                                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                                    )}>
                                                        {item.severity} Risk
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-300 leading-relaxed">
                                                    {item.description}
                                                </p>

                                                {item.clinical_management && (
                                                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-1">
                                                        <span className="text-[10px] font-bold text-emerald-400 uppercase block">
                                                            Clinical Management & Timing Advice:
                                                        </span>
                                                        <p className="text-slate-300 text-[11px]">{item.clinical_management}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                    <p className="font-bold text-sm text-white">No Documented Adverse Interactions Detected</p>
                                    <p className="text-slate-400 mt-1">
                                        The selected combination of {checkerSelectedGenerics.length} medications has no clinical conflicts recorded in the reference matrix.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: PACK IMAGE VIEWER (MedEx Style) */}
            {showPackImageModal && active_brand && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-black text-white">Pack Image: {active_brand.name}</h3>
                                <p className="text-xs text-slate-400">{active_brand.generic_name} • {active_brand.strength} • {active_brand.manufacturer}</p>
                            </div>
                            <button
                                onClick={() => setShowPackImageModal(false)}
                                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-44 h-32 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center p-4 shadow-glow-emerald">
                                <Pill className="w-12 h-12 text-emerald-400 mb-2" />
                                <span className="font-black text-white text-sm">{active_brand.brand_name}</span>
                                <span className="text-[11px] text-cyan-300 font-bold">{active_brand.strength} ({active_brand.dosage_form})</span>
                            </div>

                            <div className="text-xs text-slate-300 space-y-1">
                                <p className="font-bold text-white">Authentic Packaging & Blister Sizing</p>
                                <p className="text-slate-400 text-[11px]">Blister Pack (10 x {active_brand.dosage_form}) • Box of 51 Strips (510 {active_brand.dosage_form}s)</p>
                                <p className="text-emerald-400 font-mono font-bold">MRP: ৳ {active_brand.unit_price.toFixed(2)} / Unit • ৳ {active_brand.strip_price.toFixed(2)} / Strip</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPackImageModal(false)}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                        >
                            Close Image
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 2: INNOVATOR'S MONOGRAPH LEAFLET (MedEx Style) */}
            {showInnovatorModal && active_brand && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="glass-panel max-w-xl w-full rounded-3xl p-6 border border-teal-500/40 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-black text-white">Innovator's Monograph for {active_brand.generic_name}</h3>
                                <p className="text-xs text-slate-400">Official Prescribing Information & Leaflets</p>
                            </div>
                            <button
                                onClick={() => setShowInnovatorModal(false)}
                                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Selector Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                            {['Tablet', 'Suppository', 'Suspension', 'IV Infusion'].map((form) => (
                                <button
                                    key={form}
                                    onClick={() => setSelectedInnovatorForm(form)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition",
                                        selectedInnovatorForm === form
                                            ? "bg-teal-500 text-slate-950 font-black shadow-glow-teal"
                                            : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                                    )}
                                >
                                    {form} Leaflet
                                </button>
                            ))}
                        </div>

                        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3 max-h-72 overflow-y-auto">
                            <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                                <span>Official Clinical Summary: {selectedInnovatorForm}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Ref: BPL-PI-2026</span>
                            </div>

                            <p className="leading-relaxed">
                                <strong>Description:</strong> {active_brand.generic_name} {selectedInnovatorForm} is prepared according to British Pharmacopoeia (BP) and United States Pharmacopeia (USP) specifications for prompt bioavailability and gastric safety.
                            </p>

                            <p className="leading-relaxed">
                                <strong>Therapeutic Indications:</strong> Indicated for mild-to-moderate pain management and prompt relief of pyrexia associated with viral illness, post-immunization reactions, and dental procedures.
                            </p>

                            <p className="leading-relaxed">
                                <strong>Precautions:</strong> Caution in patients with severe renal or hepatic disease. Do not exceed the maximum daily allowance. Keep in cool, dry storage below 30°C away from direct sunlight.
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                                onClick={handlePrintMonograph}
                                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-glow-emerald"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Full Monograph</span>
                            </button>

                            <button
                                onClick={() => setShowInnovatorModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
