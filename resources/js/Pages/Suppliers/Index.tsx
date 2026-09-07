import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    X
} from 'lucide-react';
import { Supplier, PurchaseOrder, GoodsReceiptNote, Medicine } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Props {
    suppliers: Supplier[];
    purchase_orders: PurchaseOrder[];
    goods_receipt_notes: GoodsReceiptNote[];
    medicines: Medicine[];
}

export default function SuppliersIndex({ suppliers, purchase_orders, goods_receipt_notes, medicines }: Props) {
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
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                            <span>Suppliers & Purchase Order (PO)</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Vendor ledgers, procurement orders, and Goods Receipt Notes (GRN) batch generation
                        </p>
                    </div>

                    <button
                        onClick={() => setShowPoModal(true)}
                        className="px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald flex items-center gap-1.5 transition self-start sm:self-auto"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Purchase Order</span>
                    </button>
                </div>
            }
        >
            <Head title="Suppliers & Purchase Orders" />

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {suppliers.map((s) => (
                    <div key={s.id} className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs text-cyan-300 font-bold">{s.company_code}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                    Active Vendor
                                </span>
                            </div>
                            <h3 className="font-bold text-white text-sm">{s.name}</h3>
                            <p className="text-[11px] text-slate-400">{s.contact_person} | {s.phone}</p>
                            <p className="text-[11px] text-slate-500 mt-1 truncate">{s.address}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                            <div>
                                <span className="text-[10px] text-slate-500 block">Total Payable</span>
                                <span className="font-bold text-rose-400">{formatCurrency(s.total_payable)}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">Total Paid</span>
                                <span className="font-bold text-emerald-400">{formatCurrency(s.total_paid)}</span>
                            </div>
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
                            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
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
                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
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
                                                className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
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
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.company_code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-300">Order Items</label>
                                {poForm.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2">
                                        <div className="col-span-6">
                                            <select
                                                required
                                                value={item.medicine_id}
                                                onChange={(e) => {
                                                    const updated = [...poForm.items];
                                                    updated[idx].medicine_id = e.target.value;
                                                    setPoForm({ ...poForm, items: updated });
                                                }}
                                                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                            >
                                                <option value="">Select Medicine</option>
                                                {medicines.map((m) => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
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
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
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
                                            <span className="text-slate-400 block text-[10px]">Batch #</span>
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
                                            <span className="text-slate-400 block text-[10px]">Expiry Date</span>
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
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                                >
                                    Verify & Add Batches to Vault
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
