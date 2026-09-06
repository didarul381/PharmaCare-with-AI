import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Boxes,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    ShieldAlert,
    Calendar,
    Layers,
    Tag,
    Edit,
    RotateCcw,
    CheckCircle2,
    X,
    TrendingDown,
    Building2,
    ChevronDown,
    Sparkles,
    Trash2
} from 'lucide-react';
import { Medicine, Batch, Category, GenericName, Manufacturer, DosageForm, Unit } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Props {
    medicines: Medicine[];
    batches: Batch[];
    categories: Category[];
    generics: GenericName[];
    manufacturers: Manufacturer[];
    dosage_forms: DosageForm[];
    units: Unit[];
    metrics: {
        total_medicines: number;
        total_stock_value: number;
        total_sales_value: number;
        critical_expiring_count: number;
        low_stock_count: number;
    };
    filters: {
        search?: string;
        category_id?: string;
        generic_id?: string;
        manufacturer_id?: string;
        filter_expiry?: string;
    };
}

export default function InventoryIndex({
    medicines,
    batches,
    categories,
    generics,
    manufacturers,
    dosage_forms,
    units,
    metrics,
    filters,
}: Props) {
    const [viewMode, setViewMode] = useState<'medicines' | 'batches'>('medicines');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedGeneric, setSelectedGeneric] = useState(filters.generic_id || '');
    const [selectedExpiry, setSelectedExpiry] = useState(filters.filter_expiry || '');

    // Master data lists with dynamic quick-add support
    const [genericsList, setGenericsList] = useState<GenericName[]>(generics);
    const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
    const [manufacturersList, setManufacturersList] = useState<Manufacturer[]>(manufacturers);
    const [dosageFormsList, setDosageFormsList] = useState<DosageForm[]>(dosage_forms);

    React.useEffect(() => { setGenericsList(generics); }, [generics]);
    React.useEffect(() => { setCategoriesList(categories); }, [categories]);
    React.useEffect(() => { setManufacturersList(manufacturers); }, [manufacturers]);
    React.useEffect(() => { setDosageFormsList(dosage_forms); }, [dosage_forms]);

    // Quick Add States for In-Modal Master Entity Creation
    const [quickAddGeneric, setQuickAddGeneric] = useState(false);
    const [newGenericName, setNewGenericName] = useState('');

    const [quickAddCategory, setQuickAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [quickAddManufacturer, setQuickAddManufacturer] = useState(false);
    const [newManufacturerName, setNewManufacturerName] = useState('');

    const [quickAddDosageForm, setQuickAddDosageForm] = useState(false);
    const [newDosageFormName, setNewDosageFormName] = useState('');

    const [quickLoading, setQuickLoading] = useState<string | null>(null);
    const [quickError, setQuickError] = useState<string | null>(null);

    // Modals
    const [showMedModal, setShowMedModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedMedicineForAdjust, setSelectedMedicineForAdjust] = useState<Medicine | null>(null);

    // Form states
    const [medForm, setMedForm] = useState({
        name: '',
        brand_name: '',
        sku: '',
        barcode: '',
        generic_name_id: '',
        category_id: '',
        manufacturer_id: '',
        dosage_form_id: '',
        primary_unit_id: '',
        secondary_unit_id: '',
        unit_conversion_rate: 10,
        strength: '',
        min_stock_alert: 20,
        is_prescription_required: false,
        is_controlled_substance: false,
    });

    // Handlers for Quick Adding Master Entities without leaving or resetting form
    const handleQuickAddGeneric = async () => {
        if (!newGenericName.trim()) return;
        setQuickLoading('generic');
        setQuickError(null);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/inventory/quick-generic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ name: newGenericName.trim() }),
            });
            const data = await res.json();
            if (data.success && data.item) {
                setGenericsList((prev) => {
                    if (prev.some((g) => g.id === data.item.id)) return prev;
                    return [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name));
                });
                setMedForm((prev) => ({ ...prev, generic_name_id: String(data.item.id) }));
                setNewGenericName('');
                setQuickAddGeneric(false);
            } else {
                setQuickError(data.message || 'Failed to add generic molecule');
            }
        } catch (e: any) {
            setQuickError(e.message || 'Failed to add generic molecule');
        } finally {
            setQuickLoading(null);
        }
    };

    const handleQuickAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setQuickLoading('category');
        setQuickError(null);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/inventory/quick-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            const data = await res.json();
            if (data.success && data.item) {
                setCategoriesList((prev) => {
                    if (prev.some((c) => c.id === data.item.id)) return prev;
                    return [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name));
                });
                setMedForm((prev) => ({ ...prev, category_id: String(data.item.id) }));
                setNewCategoryName('');
                setQuickAddCategory(false);
            } else {
                setQuickError(data.message || 'Failed to add category');
            }
        } catch (e: any) {
            setQuickError(e.message || 'Failed to add category');
        } finally {
            setQuickLoading(null);
        }
    };

    const handleQuickAddManufacturer = async () => {
        if (!newManufacturerName.trim()) return;
        setQuickLoading('manufacturer');
        setQuickError(null);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/inventory/quick-manufacturer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ name: newManufacturerName.trim() }),
            });
            const data = await res.json();
            if (data.success && data.item) {
                setManufacturersList((prev) => {
                    if (prev.some((m) => m.id === data.item.id)) return prev;
                    return [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name));
                });
                setMedForm((prev) => ({ ...prev, manufacturer_id: String(data.item.id) }));
                setNewManufacturerName('');
                setQuickAddManufacturer(false);
            } else {
                setQuickError(data.message || 'Failed to add manufacturer');
            }
        } catch (e: any) {
            setQuickError(e.message || 'Failed to add manufacturer');
        } finally {
            setQuickLoading(null);
        }
    };

    const handleQuickAddDosageForm = async () => {
        if (!newDosageFormName.trim()) return;
        setQuickLoading('dosage_form');
        setQuickError(null);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/inventory/quick-dosage-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ name: newDosageFormName.trim() }),
            });
            const data = await res.json();
            if (data.success && data.item) {
                setDosageFormsList((prev) => {
                    if (prev.some((f) => f.id === data.item.id)) return prev;
                    return [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name));
                });
                setMedForm((prev) => ({ ...prev, dosage_form_id: String(data.item.id) }));
                setNewDosageFormName('');
                setQuickAddDosageForm(false);
            } else {
                setQuickError(data.message || 'Failed to add dosage form');
            }
        } catch (e: any) {
            setQuickError(e.message || 'Failed to add dosage form');
        } finally {
            setQuickLoading(null);
        }
    };

    const [batchForm, setBatchForm] = useState({
        medicine_id: '',
        batch_number: '',
        expiry_date: '',
        cost_price: '',
        selling_price: '',
        quantity: '',
        supplier_id: '',
    });

    const [adjustForm, setAdjustForm] = useState({
        medicine_id: '',
        batch_id: '',
        type: 'deduction',
        quantity: 1,
        reason: 'Physical count reconciliation',
        notes: '',
    });

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        router.get('/inventory', {
            search: searchTerm,
            category_id: selectedCategory,
            generic_id: selectedGeneric,
            filter_expiry: selectedExpiry,
            ...newFilters,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const handleCreateMedicine = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/inventory/medicines', medForm, {
            onSuccess: () => {
                setShowMedModal(false);
                setMedForm({
                    name: '',
                    brand_name: '',
                    sku: '',
                    barcode: '',
                    generic_name_id: '',
                    category_id: '',
                    manufacturer_id: '',
                    dosage_form_id: '',
                    primary_unit_id: '',
                    secondary_unit_id: '',
                    unit_conversion_rate: 10,
                    strength: '',
                    min_stock_alert: 20,
                    is_prescription_required: false,
                    is_controlled_substance: false,
                });
            },
        });
    };

    const handleCreateBatch = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/inventory/batches', batchForm, {
            onSuccess: () => {
                setShowBatchModal(false);
                setBatchForm({
                    medicine_id: '',
                    batch_number: '',
                    expiry_date: '',
                    cost_price: '',
                    selling_price: '',
                    quantity: '',
                    supplier_id: '',
                });
            },
        });
    };

    const handleAdjustStock = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/inventory/adjust-stock', adjustForm, {
            onSuccess: () => {
                setShowAdjustModal(false);
                setSelectedMedicineForAdjust(null);
            },
        });
    };

    const openAdjustForMedicine = (med: Medicine) => {
        setSelectedMedicineForAdjust(med);
        setAdjustForm({
            medicine_id: med.id.toString(),
            batch_id: med.batches && med.batches[0] ? med.batches[0].id.toString() : '',
            type: 'damage',
            quantity: 1,
            reason: 'Damage / Expiration discard',
            notes: '',
        });
        setShowAdjustModal(true);
    };

    const handleDeleteMedicine = (med: Medicine) => {
        if (confirm(`Are you sure you want to deactivate and archive '${med.name}' (${med.sku})?\n\nThis action will be logged in the immutable regulatory audit trail.`)) {
            router.delete(`/inventory/medicines/${med.id}`);
        }
    };

    return (
        <AuthenticatedLayout
            activeTab="inventory"
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                            Pharmaceutical Inventory & FEFO Vault
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Batch tracking, expiry timelines, packaging conversions, and regulatory logs
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* View Switcher */}
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                            <button
                                onClick={() => setViewMode('medicines')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                                    viewMode === 'medicines' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                                )}
                            >
                                Medicine Master ({medicines.length})
                            </button>
                            <button
                                onClick={() => setViewMode('batches')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                                    viewMode === 'batches' ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                                )}
                            >
                                FEFO Batches ({batches.length})
                            </button>
                        </div>

                        <button
                            onClick={() => setShowBatchModal(true)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Batch</span>
                        </button>

                        <button
                            onClick={() => setShowMedModal(true)}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald transition flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Medicine</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Inventory & FEFO Manager" />

            {/* Filter & Search Bar */}
            <div className="glass-panel rounded-2xl p-4 mb-6 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by name, SKU, generic name, or barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                </form>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Category filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            applyFilters({ category_id: e.target.value });
                        }}
                        className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    {/* Expiry filter */}
                    <select
                        value={selectedExpiry}
                        onChange={(e) => {
                            setSelectedExpiry(e.target.value);
                            applyFilters({ filter_expiry: e.target.value });
                        }}
                        className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">All Expiry Status</option>
                        <option value="critical">Critical (&lt; 30 Days)</option>
                        <option value="warning">Warning (&lt; 90 Days)</option>
                    </select>

                    {(searchTerm || selectedCategory || selectedGeneric || selectedExpiry) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('');
                                setSelectedGeneric('');
                                setSelectedExpiry('');
                                router.get('/inventory');
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 flex items-center gap-1 font-semibold"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    )}
                </div>
            </div>

            {/* View 1: Medicine Catalog Table */}
            {viewMode === 'medicines' && (
                <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="py-3 px-4">Medicine & Generic</th>
                                    <th className="py-3 px-4">SKU / Barcode</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Dosage / Ratio</th>
                                    <th className="py-3 px-4">Total Stock</th>
                                    <th className="py-3 px-4">Selling Price</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                                {medicines.map((med) => (
                                    <tr key={med.id} className="hover:bg-slate-800/30 transition group">
                                        <td className="py-3 px-4">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                                                    Rx
                                                </div>
                                                <div>
                                                    <span className="font-bold text-white text-sm block">
                                                        {med.name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {med.generic_name?.name || 'Generic unassigned'} ({med.strength || 'N/A'})
                                                    </span>
                                                    {med.is_controlled_substance && (
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold">
                                                            CONTROLLED SUBSTANCE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-cyan-300">
                                            <div>{med.sku}</div>
                                            <div className="text-[10px] text-slate-500">{med.barcode || 'No barcode'}</div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px]">
                                                {med.category?.name || 'General'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            <div>{med.dosage_form?.name || 'Tablet'}</div>
                                            <div className="text-[10px] text-slate-400">
                                                1 {med.primary_unit?.name || 'Box'} = {med.unit_conversion_rate} {med.secondary_unit?.name || 'Strip'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-black text-sm",
                                                    med.is_low_stock ? "text-amber-400" : "text-white"
                                                )}>
                                                    {med.total_stock}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {med.secondary_unit?.name || 'Units'}
                                                </span>
                                            </div>
                                            {med.is_low_stock && (
                                                <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                                    <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                                            {formatCurrency(med.current_selling_price)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openAdjustForMedicine(med)}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                                                >
                                                    Adjust
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMedicine(med)}
                                                    title="Deactivate / Archive (Audit Logged)"
                                                    className="p-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View 2: FEFO Batches Inspector */}
            {viewMode === 'batches' && (
                <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
                    <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="font-bold text-white">FEFO Queue Protocol:</span>
                            <span>Items sorted strictly by earliest expiration date first.</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="py-3 px-4">Batch Number</th>
                                    <th className="py-3 px-4">Medicine Item</th>
                                    <th className="py-3 px-4">Expiry Date</th>
                                    <th className="py-3 px-4">Days Remaining</th>
                                    <th className="py-3 px-4">Batch Stock</th>
                                    <th className="py-3 px-4">Cost / Selling</th>
                                    <th className="py-3 px-4">Supplier</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                                {batches.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 font-mono font-bold text-cyan-300 text-sm">
                                            {b.batch_number}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-white block">{b.medicine?.name}</span>
                                            <span className="text-[11px] text-slate-400">{b.medicine?.generic_name?.name}</span>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-slate-300">
                                            {formatDate(b.expiry_date)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                                                b.days_until_expiry <= 30
                                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                                    : b.days_until_expiry <= 90
                                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            )}>
                                                {b.days_until_expiry <= 30 && <AlertTriangle className="w-3 h-3" />}
                                                {b.days_until_expiry} Days Left
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-white">
                                            {b.current_quantity} / {b.initial_quantity} Units
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-emerald-400 font-bold">{formatCurrency(b.selling_price)}</div>
                                            <div className="text-[10px] text-slate-500">Cost: {formatCurrency(b.cost_price)}</div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">
                                            {b.supplier?.name || 'Direct Procurement'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal 1: Add Medicine */}
            {showMedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="glass-panel-elevated rounded-2xl w-full max-w-2xl p-6 border border-slate-700/80 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-400" />
                                Add New Pharmaceutical Entity
                            </h3>
                            <button onClick={() => setShowMedModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {quickError && (
                            <div className="mb-4 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
                                <span>{quickError}</span>
                                <button type="button" onClick={() => setQuickError(null)} className="text-rose-400 hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleCreateMedicine} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Brand / Product Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Napa Extra"
                                        value={medForm.name}
                                        onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">SKU Code *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. MED-NAP-003"
                                        value={medForm.sku}
                                        onChange={(e) => setMedForm({ ...medForm, sku: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                {/* Generic Molecule */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-slate-300">Generic Molecule *</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickAddGeneric(!quickAddGeneric);
                                                setQuickError(null);
                                            }}
                                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {quickAddGeneric ? 'Cancel' : 'Add New'}
                                        </button>
                                    </div>
                                    {quickAddGeneric ? (
                                        <div className="flex items-center gap-1.5 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-in fade-in duration-150">
                                            <input
                                                type="text"
                                                placeholder="Enter generic molecule..."
                                                value={newGenericName}
                                                onChange={(e) => setNewGenericName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleQuickAddGeneric();
                                                    }
                                                }}
                                                autoFocus
                                                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                                            />
                                            <button
                                                type="button"
                                                disabled={quickLoading === 'generic' || !newGenericName.trim()}
                                                onClick={handleQuickAddGeneric}
                                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg shadow-sm whitespace-nowrap"
                                            >
                                                {quickLoading === 'generic' ? '...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickAddGeneric(false)}
                                                className="p-1 text-slate-400 hover:text-slate-200"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={medForm.generic_name_id}
                                            onChange={(e) => setMedForm({ ...medForm, generic_name_id: e.target.value })}
                                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Select Generic</option>
                                            {genericsList.map((g) => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Therapeutic Category */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-slate-300">Therapeutic Category</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickAddCategory(!quickAddCategory);
                                                setQuickError(null);
                                            }}
                                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {quickAddCategory ? 'Cancel' : 'Add New'}
                                        </button>
                                    </div>
                                    {quickAddCategory ? (
                                        <div className="flex items-center gap-1.5 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-in fade-in duration-150">
                                            <input
                                                type="text"
                                                placeholder="Enter category name..."
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleQuickAddCategory();
                                                    }
                                                }}
                                                autoFocus
                                                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                                            />
                                            <button
                                                type="button"
                                                disabled={quickLoading === 'category' || !newCategoryName.trim()}
                                                onClick={handleQuickAddCategory}
                                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg shadow-sm whitespace-nowrap"
                                            >
                                                {quickLoading === 'category' ? '...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickAddCategory(false)}
                                                className="p-1 text-slate-400 hover:text-slate-200"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={medForm.category_id}
                                            onChange={(e) => setMedForm({ ...medForm, category_id: e.target.value })}
                                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Select Category</option>
                                            {categoriesList.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Manufacturer */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-slate-300">Manufacturer</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickAddManufacturer(!quickAddManufacturer);
                                                setQuickError(null);
                                            }}
                                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {quickAddManufacturer ? 'Cancel' : 'Add New'}
                                        </button>
                                    </div>
                                    {quickAddManufacturer ? (
                                        <div className="flex items-center gap-1.5 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-in fade-in duration-150">
                                            <input
                                                type="text"
                                                placeholder="Enter manufacturer..."
                                                value={newManufacturerName}
                                                onChange={(e) => setNewManufacturerName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleQuickAddManufacturer();
                                                    }
                                                }}
                                                autoFocus
                                                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                                            />
                                            <button
                                                type="button"
                                                disabled={quickLoading === 'manufacturer' || !newManufacturerName.trim()}
                                                onClick={handleQuickAddManufacturer}
                                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg shadow-sm whitespace-nowrap"
                                            >
                                                {quickLoading === 'manufacturer' ? '...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickAddManufacturer(false)}
                                                className="p-1 text-slate-400 hover:text-slate-200"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={medForm.manufacturer_id}
                                            onChange={(e) => setMedForm({ ...medForm, manufacturer_id: e.target.value })}
                                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Select Manufacturer</option>
                                            {manufacturersList.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Dosage Form */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-slate-300">Dosage Form</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuickAddDosageForm(!quickAddDosageForm);
                                                setQuickError(null);
                                            }}
                                            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {quickAddDosageForm ? 'Cancel' : 'Add New'}
                                        </button>
                                    </div>
                                    {quickAddDosageForm ? (
                                        <div className="flex items-center gap-1.5 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-in fade-in duration-150">
                                            <input
                                                type="text"
                                                placeholder="Enter dosage form (e.g. Capsule)..."
                                                value={newDosageFormName}
                                                onChange={(e) => setNewDosageFormName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleQuickAddDosageForm();
                                                    }
                                                }}
                                                autoFocus
                                                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                                            />
                                            <button
                                                type="button"
                                                disabled={quickLoading === 'dosage_form' || !newDosageFormName.trim()}
                                                onClick={handleQuickAddDosageForm}
                                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg shadow-sm whitespace-nowrap"
                                            >
                                                {quickLoading === 'dosage_form' ? '...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickAddDosageForm(false)}
                                                className="p-1 text-slate-400 hover:text-slate-200"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={medForm.dosage_form_id}
                                            onChange={(e) => setMedForm({ ...medForm, dosage_form_id: e.target.value })}
                                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Select Form</option>
                                            {dosageFormsList.map((f) => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Strength (e.g. 500mg)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 500mg"
                                        value={medForm.strength}
                                        onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Min Stock Alert Level</label>
                                    <input
                                        type="number"
                                        value={medForm.min_stock_alert}
                                        onChange={(e) => setMedForm({ ...medForm, min_stock_alert: parseInt(e.target.value) || 0 })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={medForm.is_prescription_required}
                                        onChange={(e) => setMedForm({ ...medForm, is_prescription_required: e.target.checked })}
                                        className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span>Prescription Required (Rx)</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={medForm.is_controlled_substance}
                                        onChange={(e) => setMedForm({ ...medForm, is_controlled_substance: e.target.checked })}
                                        className="rounded bg-slate-900 border-slate-800 text-rose-500 focus:ring-rose-500"
                                    />
                                    <span className="text-rose-400">Controlled Narcotic / Substance</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowMedModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald"
                                >
                                    Save Medicine Entity
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Add Batch */}
            {showBatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel-elevated rounded-2xl w-full max-w-lg p-6 border border-slate-700/80 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-cyan-400" />
                                Add Inventory Batch (FEFO)
                            </h3>
                            <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateBatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Medicine *</label>
                                <select
                                    required
                                    value={batchForm.medicine_id}
                                    onChange={(e) => setBatchForm({ ...batchForm, medicine_id: e.target.value })}
                                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="">Select Medicine</option>
                                    {medicines.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Number *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. BT-2026-99"
                                        value={batchForm.batch_number}
                                        onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Expiration Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={batchForm.expiry_date}
                                        onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cost Price (৳) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={batchForm.cost_price}
                                        onChange={(e) => setBatchForm({ ...batchForm, cost_price: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Selling Price (৳) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={batchForm.selling_price}
                                        onChange={(e) => setBatchForm({ ...batchForm, selling_price: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Received Quantity (Units) *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="100"
                                    value={batchForm.quantity}
                                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowBatchModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-glow-cyan"
                                >
                                    Register Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: Stock Adjustment */}
            {showAdjustModal && selectedMedicineForAdjust && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel-elevated rounded-2xl w-full max-w-lg p-6 border border-slate-700/80 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <RotateCcw className="w-5 h-5 text-amber-400" />
                                    Stock Adjustment & Audit Log
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Medicine: <span className="text-white font-semibold">{selectedMedicineForAdjust.name}</span>
                                </p>
                            </div>
                            <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustStock} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Type *</label>
                                <select
                                    value={adjustForm.type}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                >
                                    <option value="damage">Damaged / Broken Ampoule or Bottle</option>
                                    <option value="expired">Expired Discard</option>
                                    <option value="deduction">Physical Shortage (Deduction)</option>
                                    <option value="addition">Found Excess (Addition)</option>
                                    <option value="reconciliation">Audit Reconciliation</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target Batch</label>
                                    <select
                                        value={adjustForm.batch_id}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, batch_id: e.target.value })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="">General (No batch)</option>
                                        {selectedMedicineForAdjust.batches?.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                Batch {b.batch_number} ({b.current_quantity} in stock)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={adjustForm.quantity}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Mandatory Regulatory Reason *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="State reason for stock adjustment audit trail..."
                                    value={adjustForm.reason}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                                >
                                    Commit Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
