import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MedicinePicker from '@/Components/MedicinePicker';
import {
    Truck,
    Plus,
    Building2,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    DollarSign,
    PackageCheck,
    X,
    Pencil,
    Trash2,
    RotateCcw,
    UserPlus,
} from 'lucide-react';
import { Supplier, PurchaseOrder, GoodsReceiptNote, Medicine, PageProps } from '@/types';
import { confirmDialog } from '@/lib/notify';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Props {
    suppliers: Supplier[];
    purchase_orders: PurchaseOrder[];
    goods_receipt_notes: GoodsReceiptNote[];
    medicines: Medicine[];
}

const EMPTY_SUPPLIER = { name: '', company_code: '', contact_person: '', phone: '', email: '', address: '', tax_registration_number: '' };

export default function SuppliersIndex({ suppliers, purchase_orders, goods_receipt_notes, medicines }: Props) {
    const { errors } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const activeSuppliers = suppliers.filter((s) => s.is_active);

    // Supplier add / edit
    const [supplierModal, setSupplierModal] = useState<'add' | 'edit' | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierForm, setSupplierForm] = useState({ ...EMPTY_SUPPLIER });
    const [savingSupplier, setSavingSupplier] = useState(false);

    const openAddSupplier = () => {
        setEditingSupplier(null);
        setSupplierForm({ ...EMPTY_SUPPLIER });
        setSupplierModal('add');
    };

    const openEditSupplier = (s: Supplier) => {
        setEditingSupplier(s);
        setSupplierForm({
            name: s.name ?? '',
            company_code: s.company_code ?? '',
            contact_person: s.contact_person ?? '',
            phone: s.phone ?? '',
            email: s.email ?? '',
            address: s.address ?? '',
            tax_registration_number: s.tax_registration_number ?? '',
        });
        setSupplierModal('edit');
    };

    const saveSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSupplier(true);
        const options = {
            preserveScroll: true,
            onSuccess: () => setSupplierModal(null),
            onFinish: () => setSavingSupplier(false),
        };
        if (supplierModal === 'edit' && editingSupplier) {
            router.put(`/suppliers/${editingSupplier.id}`, supplierForm, options);
        } else {
            router.post('/suppliers', supplierForm, options);
        }
    };

    const deleteSupplier = async (s: Supplier) => {
        const history = (s.purchase_orders_count ?? 0) + (s.goods_receipt_notes_count ?? 0) > 0;
        const ok = await confirmDialog(history
            ? {
                title: `Deactivate ${s.name}?`,
                message: `This supplier has purchase history, so it will be deactivated instead of deleted. Past orders stay in your records; it just won't appear in new purchase orders. You can reactivate it any time.`,
                confirmLabel: 'Deactivate',
                tone: 'danger',
            }
            : {
                title: `Delete ${s.name}?`,
                message: 'This supplier has no purchase orders, so it will be removed permanently.',
                confirmLabel: 'Delete supplier',
                tone: 'danger',
            });
        if (ok) router.delete(`/suppliers/${s.id}`, { preserveScroll: true });
    };

    const activateSupplier = (s: Supplier) => router.patch(`/suppliers/${s.id}/activate`, {}, { preserveScroll: true });

    const [showPoModal, setShowPoModal] = useState(false);
    const [showGrnModal, setShowGrnModal] = useState(false);
    const [selectedPoForGrn, setSelectedPoForGrn] = useState<PurchaseOrder | null>(null);

    // PO Form
    const [poForm, setPoForm] = useState({
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        notes: '',
        items: [{ medicine_id: '', quantity_ordered: 100, unit_cost: 5.00 }],
    });

    // GRN Form
    const [grnForm, setGrnForm] = useState({
        supplier_invoice_number: '',
        remarks: 'Received and inspected goods.',
        batches: [
            {
                medicine_id: '',
                batch_number: '',
                expiry_date: '',
                received_quantity: 100,
                cost_price: 5.00,
                selling_price: 7.00,
            }
        ],
    });

    const addPoItem = () => {
        setPoForm({
            ...poForm,
            items: [...poForm.items, { medicine_id: '', quantity_ordered: 50, unit_cost: 4.00 }],
        });
    };

    const handleCreatePo = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/suppliers/orders', poForm, {
            onSuccess: () => {
                setShowPoModal(false);
            },
        });
    };

    const openGrnForPo = (po: PurchaseOrder) => {
        setSelectedPoForGrn(po);
        const batches = po.items?.map(item => ({
            medicine_id: item.medicine_id.toString(),
            batch_number: 'BT-' + Math.floor(1000 + Math.random() * 9000),
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            received_quantity: item.quantity_ordered,
            cost_price: parseFloat(item.unit_cost.toString()),
            selling_price: parseFloat(item.unit_cost.toString()) * 1.35,
        })) || [];

        setGrnForm({
            supplier_invoice_number: 'INV-SUP-' + Math.floor(10000 + Math.random() * 90000),
            remarks: 'All packages inspected, unbroken seal.',
            batches: batches.length > 0 ? batches : [{
                medicine_id: '',
                batch_number: '',
                expiry_date: '',
                received_quantity: 100,
                cost_price: 5.00,
                selling_price: 7.00,
            }],
        });

        setShowGrnModal(true);
    };

    const handleReceiveGrn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPoForGrn) return;

        router.post(`/suppliers/orders/${selectedPoForGrn.id}/receive-grn`, grnForm, {
            onSuccess: () => {
                setShowGrnModal(false);
                setSelectedPoForGrn(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            activeTab="suppliers"
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            <span>Suppliers & Purchases</span>
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Suppliers, purchase orders and receiving new stock.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={openAddSupplier}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Supplier</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPoModal(true)}
                            disabled={activeSuppliers.length === 0}
                            title={activeSuppliers.length === 0 ? 'Add a supplier first' : undefined}
                            className="px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-ink shadow-glow-emerald flex items-center gap-1.5 transition disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Purchase Order</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Suppliers & Purchases" />

            {/* Suppliers Grid */}
            {suppliers.length === 0 && (
                <div className="glass-panel rounded-2xl border border-slate-800/80 p-10 text-center mb-6 sm:mb-8">
                    <Truck className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="mt-3 font-semibold text-white">No suppliers yet</p>
                    <p className="text-sm text-slate-400 mt-1">Add the companies or distributors you buy from to create purchase orders.</p>
                    <button
                        type="button"
                        onClick={openAddSupplier}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-ink"
                    >
                        <UserPlus className="w-4 h-4" /> Add your first supplier
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {suppliers.map((s) => (
                    <div key={s.id} className={cn('glass-panel rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between', !s.is_active && 'opacity-60')}>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs text-cyan-300 font-bold">{s.company_code}</span>
                                {s.is_active ? (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                                ) : (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">Inactive</span>
                                )}
                            </div>
                            <h3 className="font-bold text-white text-sm">{s.name}</h3>
                            {(s.contact_person || s.phone) && (
                                <p className="text-xs text-slate-400">{[s.contact_person, s.phone].filter(Boolean).join(' | ')}</p>
                            )}
                            {s.email && <p className="text-xs text-slate-500 truncate">{s.email}</p>}
                            {s.address && <p className="text-xs text-slate-500 mt-1 truncate" title={s.address}>{s.address}</p>}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                            <div>
                                <span className="text-[11px] text-slate-500 block">Total Payable</span>
                                <span className="font-bold text-rose-400">{formatCurrency(s.total_payable)}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] text-slate-500 block">Total Paid</span>
                                <span className="font-bold text-emerald-400">{formatCurrency(s.total_paid)}</span>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-1.5">
                            {s.is_active ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => openEditSupplier(s)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteSupplier(s)}
                                        aria-label={`Delete ${s.name}`}
                                        title="Delete supplier"
                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => activateSupplier(s)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Purchase Orders Table */}
            <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        Purchase Orders (PO) Registry
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold">
                                <th className="py-3 px-4">PO Number</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4">Order Date</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                            {purchase_orders.map((po) => (
                                <tr key={po.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">{po.po_number}</td>
                                    <td className="py-3 px-4 font-bold text-white">{po.supplier?.name}</td>
                                    <td className="py-3 px-4 text-slate-300">{formatDate(po.order_date)}</td>
                                    <td className="py-3 px-4 font-bold text-emerald-400">{formatCurrency(po.total_amount)}</td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase",
                                            po.status === 'received'
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        )}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {po.status !== 'received' && (
                                            <button
                                                onClick={() => openGrnForPo(po)}
                                                className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-ink transition"
                                            >
                                                Receive GRN
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Create Purchase Order */}
            {showPoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-xl p-6 border border-slate-700 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-400" />
                                Create Purchase Order
                            </h3>
                            <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePo} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Supplier *</label>
                                <select
                                    required
                                    value={poForm.supplier_id}
                                    onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })}
                                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">Select Supplier</option>
                                    {activeSuppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.company_code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <span className="block text-xs font-semibold text-slate-300">Order Items</span>
                                <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 font-semibold" aria-hidden>
                                    <span className="col-span-6">Medicine (type to search)</span>
                                    <span className="col-span-2">Quantity</span>
                                    <span className="col-span-3">Unit cost (৳)</span>
                                </div>
                                {poForm.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-6">
                                            <MedicinePicker
                                                required
                                                aria-label={`Medicine for item ${idx + 1}`}
                                                options={medicines}
                                                value={item.medicine_id}
                                                onChange={(id) => {
                                                    const updated = [...poForm.items];
                                                    updated[idx] = { ...updated[idx], medicine_id: id };
                                                    setPoForm({ ...poForm, items: updated });
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                aria-label={`Quantity for item ${idx + 1}`}
                                                placeholder="Qty"
                                                value={item.quantity_ordered}
                                                onChange={(e) => {
                                                    const updated = [...poForm.items];
                                                    updated[idx].quantity_ordered = parseInt(e.target.value) || 0;
                                                    setPoForm({ ...poForm, items: updated });
                                                }}
                                                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                aria-label={`Unit cost for item ${idx + 1}`}
                                                placeholder="Unit Cost"
                                                value={item.unit_cost}
                                                onChange={(e) => {
                                                    const updated = [...poForm.items];
                                                    updated[idx].unit_cost = parseFloat(e.target.value) || 0;
                                                    setPoForm({ ...poForm, items: updated });
                                                }}
                                                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            {poForm.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== idx) })}
                                                    aria-label={`Remove item ${idx + 1}`}
                                                    title="Remove"
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addPoItem}
                                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Another Item
                            </button>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowPoModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-ink"
                                >
                                    Submit Purchase Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Receive GRN */}
            {showGrnModal && selectedPoForGrn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-xl p-6 border border-slate-700 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <PackageCheck className="w-5 h-5 text-cyan-400" />
                                    Goods Receipt Note (GRN) Delivery
                                </h3>
                                <p className="text-xs text-slate-400">PO: {selectedPoForGrn.po_number}</p>
                            </div>
                            <button onClick={() => setShowGrnModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReceiveGrn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Invoice #</label>
                                <input
                                    type="text"
                                    value={grnForm.supplier_invoice_number}
                                    onChange={(e) => setGrnForm({ ...grnForm, supplier_invoice_number: e.target.value })}
                                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-300">Generated FEFO Batches</label>
                                {grnForm.batches.map((b, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-slate-400 block text-[11px]">Batch #</span>
                                            <input
                                                type="text"
                                                value={b.batch_number}
                                                onChange={(e) => {
                                                    const updated = [...grnForm.batches];
                                                    updated[idx].batch_number = e.target.value;
                                                    setGrnForm({ ...grnForm, batches: updated });
                                                }}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-cyan-300 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[11px]">Expiry Date</span>
                                            <input
                                                type="date"
                                                value={b.expiry_date}
                                                onChange={(e) => {
                                                    const updated = [...grnForm.batches];
                                                    updated[idx].expiry_date = e.target.value;
                                                    setGrnForm({ ...grnForm, batches: updated });
                                                }}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowGrnModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-ink"
                                >
                                    Verify & Add Batches to Vault
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal: Add / Edit Supplier */}
            {supplierModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && setSupplierModal(null)}>
                    <div role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title" className="w-full max-w-lg rounded-3xl border border-slate-800 bg-panel p-6 shadow-glass max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 id="supplier-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                                {supplierModal === 'edit' ? <Pencil className="w-4 h-4 text-emerald-400" /> : <UserPlus className="w-4 h-4 text-emerald-400" />}
                                {supplierModal === 'edit' ? 'Edit supplier' : 'Add supplier'}
                            </h3>
                            <button type="button" onClick={() => setSupplierModal(null)} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={saveSupplier} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <label htmlFor="supplier-name" className="block text-xs font-semibold text-slate-300 mb-1">Supplier / company name *</label>
                                    <input
                                        id="supplier-name"
                                        type="text"
                                        required
                                        value={supplierForm.name}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                        placeholder="e.g. Rahman Pharma Distribution"
                                        aria-invalid={Boolean(errors?.name)}
                                        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    {errors?.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="supplier-company_code" className="block text-xs font-semibold text-slate-300 mb-1">Code</label>
                                    <input
                                        id="supplier-company_code"
                                        type="text"
                                        value={supplierForm.company_code}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, company_code: e.target.value })}
                                        placeholder="e.g. RPD-001"
                                        aria-invalid={Boolean(errors?.company_code)}
                                        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    {errors?.company_code && <p className="mt-1 text-xs text-rose-400">{errors.company_code}</p>}
                                    {!errors?.company_code && <p className="mt-1 text-[11px] text-slate-500">Leave empty to create one automatically.</p>}
                                </div>
                                <div>
                                    <label htmlFor="supplier-contact_person" className="block text-xs font-semibold text-slate-300 mb-1">Contact person</label>
                                    <input
                                        id="supplier-contact_person"
                                        type="text"
                                        value={supplierForm.contact_person}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                                        placeholder="e.g. Md. Karim"
                                        aria-invalid={Boolean(errors?.contact_person)}
                                        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    {errors?.contact_person && <p className="mt-1 text-xs text-rose-400">{errors.contact_person}</p>}
                                </div>
                                <div>
                                    <label htmlFor="supplier-phone" className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                                    <input
                                        id="supplier-phone"
                                        type="tel"
                                        value={supplierForm.phone}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                        placeholder="e.g. 01711-000000"
                                        aria-invalid={Boolean(errors?.phone)}
                                        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    {errors?.phone && <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label htmlFor="supplier-email" className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                                    <input
                                        id="supplier-email"
                                        type="email"
                                        value={supplierForm.email}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                        placeholder="orders@example.com"
                                        aria-invalid={Boolean(errors?.email)}
                                        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    {errors?.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="supplier-address" className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                                    <textarea
                                        id="supplier-address"
                                        rows={2}
                                        value={supplierForm.address}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                        aria-invalid={Boolean(errors?.address)}
                                        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    {errors?.address && <p className="mt-1 text-xs text-rose-400">{errors.address}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="supplier-tax_registration_number" className="block text-xs font-semibold text-slate-300 mb-1">BIN / TIN</label>
                                    <input
                                        id="supplier-tax_registration_number"
                                        type="text"
                                        value={supplierForm.tax_registration_number}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, tax_registration_number: e.target.value })}
                                        aria-invalid={Boolean(errors?.tax_registration_number)}
                                        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    {errors?.tax_registration_number && <p className="mt-1 text-xs text-rose-400">{errors.tax_registration_number}</p>}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                                <button type="button" onClick={() => setSupplierModal(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800">
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingSupplier} className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-ink disabled:opacity-60">
                                    {savingSupplier ? 'Saving…' : supplierModal === 'edit' ? 'Save changes' : 'Add supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
