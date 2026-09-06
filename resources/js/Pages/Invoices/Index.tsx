import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Receipt,
    Search,
    Filter,
    Printer,
    Eye,
    RotateCcw,
    CheckCircle2,
    Clock,
    AlertTriangle,
    CreditCard,
    DollarSign,
    Calendar,
    User as UserIcon,
    Stethoscope,
    FileText,
    Download,
    X,
    TrendingUp,
    ShieldCheck,
    Tag,
    ChevronDown,
    Building2,
    Phone,
    MapPin,
    QrCode
} from 'lucide-react';
import { Sale, StoreSetting, PageProps } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Props {
    invoices: Sale[];
    metrics: {
        total_invoiced: number;
        total_collected: number;
        total_dues: number;
        total_invoices: number;
        returned_count: number;
    };
    settings: StoreSetting;
    filters: {
        search?: string;
        status?: string;
        payment_method?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function InvoicesIndex({ invoices, metrics, settings, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedMethod, setSelectedMethod] = useState(filters.payment_method || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Modals
    const [viewingInvoice, setViewingInvoice] = useState<Sale | null>(null);
    const [printTemplate, setPrintTemplate] = useState<'a4' | 'thermal80' | 'thermal58'>('a4');
    const [dueInvoice, setDueInvoice] = useState<Sale | null>(null);
    const [returnInvoice, setReturnInvoice] = useState<Sale | null>(null);

    // Form states
    const [dueForm, setDueForm] = useState({
        amount: '',
        payment_method: 'cash',
        transaction_reference: '',
        notes: '',
    });

    const [returnForm, setReturnForm] = useState({
        reason: '',
        restock_items: true,
        refund_amount: '',
    });

    const [loading, setLoading] = useState(false);

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        router.get('/invoices', {
            search: searchTerm,
            status: selectedStatus,
            payment_method: selectedMethod,
            start_date: startDate,
            end_date: endDate,
            ...newFilters,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const handleStatusClick = (status: string) => {
        setSelectedStatus(status);
        applyFilters({ status });
    };

    const openDueModal = (sale: Sale) => {
        setDueInvoice(sale);
        setDueForm({
            amount: sale.due_amount.toString(),
            payment_method: 'cash',
            transaction_reference: '',
            notes: `Due clearance for ${sale.invoice_number}`,
        });
    };

    const handleCollectDue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dueInvoice) return;
        setLoading(true);
        router.post(`/invoices/${dueInvoice.id}/collect-due`, dueForm, {
            onSuccess: () => setDueInvoice(null),
            onFinish: () => setLoading(false),
        });
    };

    const openReturnModal = (sale: Sale) => {
        setReturnInvoice(sale);
        setReturnForm({
            reason: 'Customer return / prescription adjustment',
            restock_items: true,
            refund_amount: sale.paid_amount.toString(),
        });
    };

    const handleProcessReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnInvoice) return;
        setLoading(true);
        router.post(`/invoices/${returnInvoice.id}/return`, returnForm, {
            onSuccess: () => setReturnInvoice(null),
            onFinish: () => setLoading(false),
        });
    };

    const handlePrintTrigger = () => {
        const targetElement = printTemplate === 'a4' 
            ? document.getElementById('printable-invoice')
            : document.getElementById('printable-thermal');

        if (!targetElement) {
            window.print();
            return;
        }

        const isThermal = printTemplate === 'thermal80' || printTemplate === 'thermal58';
        const pageSize = printTemplate === 'a4' ? 'A4 portrait' : printTemplate === 'thermal80' ? '80mm auto' : '58mm auto';
        const contentWidth = printTemplate === 'a4' ? '100%' : printTemplate === 'thermal80' ? '76mm' : '54mm';
        const marginSetting = printTemplate === 'a4' ? '12mm 15mm' : '2mm 1mm';

        let iframe = document.getElementById('pharma-invoice-print-frame') as HTMLIFrameElement;
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'pharma-invoice-print-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.opacity = '0';
            document.body.appendChild(iframe);
        }

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
                <title>Invoice - ${viewingInvoice?.invoice_number || 'Print'}</title>
                <style>
                    @page {
                        size: ${pageSize};
                        margin: ${marginSetting};
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        padding: ${printTemplate === 'a4' ? '10px' : '4px 2px'};
                        width: ${contentWidth};
                        max-width: ${printTemplate === 'a4' ? '210mm' : contentWidth};
                        margin: 0 auto;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        font-family: ${isThermal ? '"Courier New", Courier, monospace' : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'};
                        font-size: ${printTemplate === 'a4' ? '12px' : printTemplate === 'thermal80' ? '11px' : '9.5px'};
                        line-height: 1.35;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 6px 8px;
                    }
                    .flex { display: flex; }
                    .items-center { align-items: center; }
                    .items-start { align-items: flex-start; }
                    .justify-between { justify-content: space-between; }
                    .justify-center { justify-content: center; }
                    .grid { display: grid; }
                    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                    .gap-4 { gap: 1rem; }
                    .gap-6 { gap: 1.5rem; }
                    .border-b { border-bottom: 1px solid #cbd5e1; }
                    .border-t { border-top: 1px solid #cbd5e1; }
                    .border-t-2 { border-top: 2px solid #0f172a; }
                    .border-dashed { border-style: dashed; }
                    .border-slate-200 { border-color: #e2e8f0; }
                    .border-slate-300 { border-color: #cbd5e1; }
                    .border-slate-400 { border-color: #94a3b8; }
                    .bg-slate-50 { background-color: #f8fafc; }
                    .bg-slate-100 { background-color: #f1f5f9; }
                    .bg-slate-950 { background-color: #020617; }
                    .text-white { color: #ffffff !important; }
                    .text-slate-950 { color: #020617; }
                    .text-slate-900 { color: #0f172a; }
                    .text-slate-800 { color: #1e293b; }
                    .text-slate-700 { color: #334155; }
                    .text-slate-600 { color: #475569; }
                    .text-slate-500 { color: #64748b; }
                    .text-slate-400 { color: #94a3b8; }
                    .text-emerald-700 { color: #047857; }
                    .text-emerald-800 { color: #065f46; }
                    .text-rose-600 { color: #e11d48; }
                    .text-rose-700 { color: #be123c; }
                    .font-bold { font-weight: 700; }
                    .font-black { font-weight: 900; }
                    .font-semibold { font-weight: 600; }
                    .font-mono { font-family: "Courier New", Courier, monospace; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .text-left { text-align: left; }
                    .text-xs { font-size: 11px; }
                    .text-sm { font-size: 13px; }
                    .text-base { font-size: 15px; }
                    .text-xl { font-size: 18px; }
                    .text-\\[10px\\] { font-size: 10px; }
                    .text-\\[11px\\] { font-size: 11px; }
                    .text-\\[9px\\] { font-size: 9px; }
                    .uppercase { text-transform: uppercase; }
                    .tracking-tight { letter-spacing: -0.025em; }
                    .tracking-wider { letter-spacing: 0.05em; }
                    .space-y-1 > * + * { margin-top: 0.25rem; }
                    .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
                    .space-y-2 > * + * { margin-top: 0.5rem; }
                    .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
                    .p-3 { padding: 0.75rem; }
                    .p-4 { padding: 1rem; }
                    .p-8 { padding: 1.5rem; }
                    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                    .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
                    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
                    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
                    .pb-2 { padding-bottom: 0.5rem; }
                    .pb-3 { padding-bottom: 0.75rem; }
                    .pb-6 { padding-bottom: 1.25rem; }
                    .pt-1 { padding-top: 0.25rem; }
                    .pt-2 { padding-top: 0.5rem; }
                    .pt-3 { padding-top: 0.75rem; }
                    .pt-4 { padding-top: 1rem; }
                    .mt-0\\.5 { margin-top: 0.125rem; }
                    .mt-1 { margin-top: 0.25rem; }
                    .mt-8 { margin-top: 1.5rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .rounded-md { border-radius: 0.375rem; }
                    .rounded-xl { border-radius: 0.5rem; }
                    .rounded-2xl { border-radius: 0.75rem; }
                    .divide-y > * + * { border-top: 1px solid #e2e8f0; }
                    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                </style>
            </head>
            <body>
                ${targetElement.innerHTML}
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }, 200);
    };

    const getStatusBadge = (sale: Sale) => {
        if (sale.is_returned) {
            return {
                label: 'RETURNED / REFUNDED',
                className: 'bg-red-500/20 text-red-300 border-red-500/30',
            };
        }
        if (sale.payment_status === 'paid' || sale.due_amount <= 0) {
            return {
                label: 'PAID FULL',
                className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            };
        }
        if (sale.payment_status === 'partial' || (sale.due_amount > 0 && sale.paid_amount > 0)) {
            return {
                label: `DUE ৳${sale.due_amount}`,
                className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            };
        }
        return {
            label: 'UNPAID',
            className: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
    };

    const getMethodBadge = (method: string) => {
        switch (method) {
            case 'bkash':
                return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
            case 'nagad':
                return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'rocket':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'card':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            default:
                return 'bg-slate-800 text-slate-300 border-slate-700';
        }
    };

    return (
        <AuthenticatedLayout
            activeTab="invoices"
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                            Invoice Manager & Clinical Sales Ledger
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                Multi-Template Print
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Real-time sales invoices, due collections, customer credit balances, and return restocks
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrintTrigger}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Ledger</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Invoice Manager & Sales Ledger" />

            {/* Top Financial Stat Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Total Invoiced Sales</span>
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                            <Receipt className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{formatCurrency(metrics.total_invoiced)}</div>
                    <p className="text-[10px] text-slate-500 mt-1">{metrics.total_invoices} total generated invoices</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-300">Total Cash Collected</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400">{formatCurrency(metrics.total_collected)}</div>
                    <p className="text-[10px] text-emerald-400/70 mt-1">Settled payments received</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-300">Outstanding Customer Dues</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-amber-400">{formatCurrency(metrics.total_dues)}</div>
                    <p className="text-[10px] text-amber-400/70 mt-1">Pending credit balance collections</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-rose-300">Returns & Refunds</span>
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-rose-400">{metrics.returned_count}</div>
                    <p className="text-[10px] text-rose-400/70 mt-1">Invoices adjusted & restocked</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel rounded-2xl p-4 mb-6 border border-slate-800/80 flex flex-col gap-3">
                {/* Status Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                        { key: 'all', label: 'All Invoices' },
                        { key: 'paid', label: 'Paid Full' },
                        { key: 'partial', label: 'Due / Partial' },
                        { key: 'unpaid', label: 'Unpaid' },
                        { key: 'returned', label: 'Returned / Refunded' },
                    ].map((st) => {
                        const isSelected = selectedStatus === st.key;
                        return (
                            <button
                                key={st.key}
                                onClick={() => handleStatusClick(st.key)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition",
                                    isSelected
                                        ? "bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan"
                                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                                )}
                            >
                                {st.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search & Secondary Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                    <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by invoice number (INV-...), customer name, phone, or cashier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                    </form>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Payment Method filter */}
                        <select
                            value={selectedMethod}
                            onChange={(e) => {
                                setSelectedMethod(e.target.value);
                                applyFilters({ payment_method: e.target.value });
                            }}
                            className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                        >
                            <option value="">All Payment Methods</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card / POS</option>
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="rocket">Rocket</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>

                        {/* Date Filters */}
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                applyFilters({ start_date: e.target.value });
                            }}
                            className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-slate-500 text-xs">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                applyFilters({ end_date: e.target.value });
                            }}
                            className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                        />

                        {(searchTerm || selectedStatus !== 'all' || selectedMethod || startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedStatus('all');
                                    setSelectedMethod('');
                                    setStartDate('');
                                    setEndDate('');
                                    router.get('/invoices');
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 font-semibold flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="glass-panel rounded-3xl p-5 border border-slate-800/80">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-cyan-400" />
                        Invoiced Transactions Directory
                    </h2>
                    <span className="text-[11px] text-slate-400">Showing {invoices.length} invoices</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                <th className="py-3 px-4">Invoice # & Date</th>
                                <th className="py-3 px-4">Customer</th>
                                <th className="py-3 px-4">Staff / Cashier</th>
                                <th className="py-3 px-4">Items Breakdown</th>
                                <th className="py-3 px-4">Grand Total</th>
                                <th className="py-3 px-4">Settlement & Due</th>
                                <th className="py-3 px-4">Payment Method</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500">
                                        No invoices found matching current filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((sale) => {
                                    const statusBadge = getStatusBadge(sale);
                                    return (
                                        <tr key={sale.id} className="hover:bg-slate-800/30 transition group">
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => setViewingInvoice(sale)}
                                                    className="font-mono font-bold text-cyan-300 hover:text-cyan-200 text-xs block text-left"
                                                >
                                                    {sale.invoice_number}
                                                </button>
                                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                    {formatDate(sale.created_at)}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-bold text-white">{sale.customer?.name || 'Walk-in Customer'}</div>
                                                {sale.customer?.phone && (
                                                    <span className="text-[10px] text-slate-400 font-mono">{sale.customer.phone}</span>
                                                )}
                                                {sale.prescription?.doctor && (
                                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                                        <Stethoscope className="w-2.5 h-2.5" /> Dr. {sale.prescription.doctor.name}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="font-medium text-slate-300 block">{sale.user?.name || 'Cashier'}</span>
                                                <span className="text-[10px] text-slate-500 capitalize">{sale.user?.role?.replace('_', ' ') || 'Staff'}</span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="font-bold text-white">{sale.items?.length || 0} Products</span>
                                                <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                                                    {sale.items?.map(i => i.medicine?.name).filter(Boolean).join(', ') || 'Prescription items'}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 font-bold text-white text-sm">
                                                {formatCurrency(sale.grand_total)}
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block",
                                                    statusBadge.className
                                                )}>
                                                    {statusBadge.label}
                                                </span>
                                                {sale.due_amount > 0 && (
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        Paid: {formatCurrency(sale.paid_amount)}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border",
                                                    getMethodBadge(sale.payment_method)
                                                )}>
                                                    {sale.payment_method}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setViewingInvoice(sale)}
                                                        title="View & Print Invoice"
                                                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 text-xs font-semibold inline-flex items-center gap-1 transition"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        <span>Invoice</span>
                                                    </button>

                                                    {sale.due_amount > 0 && !sale.is_returned && (
                                                        <button
                                                            onClick={() => openDueModal(sale)}
                                                            title="Collect Due Payment"
                                                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                                                        >
                                                            Collect Due
                                                        </button>
                                                    )}

                                                    {!sale.is_returned && (
                                                        <button
                                                            onClick={() => openReturnModal(sale)}
                                                            title="Process Return / Refund"
                                                            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal 1: Multi-Format Invoice Viewer & Print Generator */}
            {viewingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-3xl p-6 border border-slate-700 shadow-2xl relative max-h-[92vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-cyan-400" />
                                    Invoice {viewingInvoice.invoice_number}
                                </h3>

                                {/* Template switcher */}
                                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                                    <button
                                        onClick={() => setPrintTemplate('a4')}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs font-semibold transition",
                                            printTemplate === 'a4' ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        A4 Tax Invoice
                                    </button>
                                    <button
                                        onClick={() => setPrintTemplate('thermal80')}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs font-semibold transition",
                                            printTemplate === 'thermal80' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        80mm Thermal
                                    </button>
                                    <button
                                        onClick={() => setPrintTemplate('thermal58')}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs font-semibold transition",
                                            printTemplate === 'thermal58' ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        58mm Compact
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrintTrigger}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center gap-1.5 transition"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Print Now</span>
                                </button>
                                <button onClick={() => setViewingInvoice(null)} className="text-slate-400 hover:text-white p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Printable Area */}
                        <div className="flex-1 overflow-y-auto py-4 font-sans text-slate-900">
                            {/* Template 1: A4 Standard Tax Invoice */}
                            {printTemplate === 'a4' && (
                                <div id="printable-invoice" className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-slate-900 text-xs">
                                    {/* Header & Pharmacy Profile */}
                                    <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                                        <div>
                                            <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                                                {settings.store_name}
                                            </h2>
                                            <p className="text-xs text-slate-600 mt-0.5">{settings.store_tagline}</p>
                                            <p className="text-[11px] text-slate-600 mt-1 max-w-sm">{settings.store_address}</p>
                                            {(settings.store_phone || settings.store_email) && (
                                                <div className="flex items-center gap-4 text-[11px] text-slate-600 mt-1 font-mono">
                                                    {settings.store_phone && <span>Phone: {settings.store_phone}</span>}
                                                    {settings.store_email && <span>Email: {settings.store_email}</span>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <span className="px-3 py-1 bg-slate-950 text-white rounded-md font-bold text-xs uppercase tracking-wider block mb-2">
                                                TAX INVOICE / CASH MEMO
                                            </span>
                                            <div className="font-mono font-bold text-sm text-slate-950">{viewingInvoice.invoice_number}</div>
                                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatDate(viewingInvoice.created_at)}</div>
                                            {settings.tax_id_number && (
                                                <div className="text-[11px] text-slate-600 font-mono mt-1">BIN/TIN: {settings.tax_id_number}</div>
                                            )}
                                            {settings.drug_license_number && (
                                                <div className="text-[11px] text-emerald-700 font-mono font-bold">DGDA Lic: {settings.drug_license_number}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer & Prescribing Doctor details */}
                                    <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Billed To (Patient / Customer)</span>
                                            <p className="text-sm font-bold text-slate-950 mt-0.5">{viewingInvoice.customer?.name || 'Walk-in Customer'}</p>
                                            {viewingInvoice.customer?.phone && (
                                                <p className="text-[11px] text-slate-600 font-mono">Phone: {viewingInvoice.customer.phone}</p>
                                            )}
                                            {viewingInvoice.customer?.address && (
                                                <p className="text-[11px] text-slate-600">{viewingInvoice.customer.address}</p>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Dispensation Station</span>
                                            <p className="text-xs font-bold text-slate-950 mt-0.5">Dispensed by: {viewingInvoice.user?.name || 'Lead Pharmacist'}</p>
                                            {viewingInvoice.prescription?.doctor && (
                                                <p className="text-[11px] text-emerald-700 font-semibold">
                                                    Rx Doctor: Dr. {viewingInvoice.prescription.doctor.name} ({viewingInvoice.prescription.doctor.qualification || 'MBBS'})
                                                </p>
                                            )}
                                            <p className="text-[11px] text-slate-600 uppercase font-mono">Payment: {viewingInvoice.payment_method}</p>
                                        </div>
                                    </div>

                                    {/* Medicines Items Table */}
                                    <div className="py-4">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                                                    <th className="py-2.5 px-3">#</th>
                                                    <th className="py-2.5 px-3">Item / Generic Molecule</th>
                                                    <th className="py-2.5 px-3">Batch & Expiry</th>
                                                    <th className="py-2.5 px-3 text-center">Qty</th>
                                                    <th className="py-2.5 px-3 text-right">Rate</th>
                                                    <th className="py-2.5 px-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {viewingInvoice.items?.map((item, idx) => (
                                                    <tr key={item.id}>
                                                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                                                        <td className="py-2.5 px-3">
                                                            <div className="font-bold text-slate-950">{item.medicine?.name}</div>
                                                            <div className="text-[10px] text-slate-500">{item.medicine?.generic_name?.name}</div>
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                                            <div>{item.batch?.batch_number || 'Direct'}</div>
                                                            {item.batch?.expiry_date && (
                                                                <div className="text-[10px] text-slate-500">Exp: {formatDate(item.batch.expiry_date)}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center font-bold text-slate-950">
                                                            {item.quantity} {item.unit_name}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                                            {formatCurrency(item.unit_price)}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-950">
                                                            {formatCurrency(item.total_price)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Calculations & Settlement Breakdown */}
                                    <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                                                <span className="font-bold text-slate-800 block">Payment History & Ledger</span>
                                                {viewingInvoice.payments?.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between text-slate-600 font-mono">
                                                        <span>{formatDate(p.created_at)} ({p.payment_method.toUpperCase()})</span>
                                                        <span className="font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                                                    </div>
                                                ))}
                                                {viewingInvoice.notes && (
                                                    <p className="text-[10px] text-slate-500 italic mt-1 border-t border-slate-200 pt-1">
                                                        Notes: {viewingInvoice.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 font-mono text-xs text-right">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Subtotal Amount:</span>
                                                <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                                            </div>

                                            {viewingInvoice.discount_amount > 0 && (
                                                <div className="flex justify-between text-emerald-700 font-bold">
                                                    <span>Special Discount:</span>
                                                    <span>- {formatCurrency(viewingInvoice.discount_amount)}</span>
                                                </div>
                                            )}

                                            {viewingInvoice.tax_amount > 0 && (
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Govt VAT / Tax ({viewingInvoice.tax_percentage}%):</span>
                                                    <span>+ {formatCurrency(viewingInvoice.tax_amount)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between text-base font-black text-slate-950 border-t-2 border-slate-950 pt-2">
                                                <span>Grand Net Total:</span>
                                                <span>{formatCurrency(viewingInvoice.grand_total)}</span>
                                            </div>

                                            <div className="flex justify-between text-slate-700 font-bold">
                                                <span>Paid Amount:</span>
                                                <span>{formatCurrency(viewingInvoice.paid_amount)}</span>
                                            </div>

                                            {viewingInvoice.due_amount > 0 ? (
                                                <div className="flex justify-between text-rose-600 font-black text-sm border-t border-rose-200 pt-1">
                                                    <span>Remaining Due Balance:</span>
                                                    <span>{formatCurrency(viewingInvoice.due_amount)}</span>
                                                </div>
                                            ) : (
                                                <div className="text-emerald-700 font-bold text-xs pt-1">
                                                    ✓ Fully Paid & Settled
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer Terms & Legal Disclaimer */}
                                    <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
                                        <p>{settings.receipt_footer_message}</p>
                                        <p className="mt-1 font-mono">This is a system generated institutional tax invoice. Thank you for choosing {settings.store_name}.</p>
                                    </div>
                                </div>
                            )}

                            {/* Template 2 & 3: Thermal Receipt (80mm / 58mm) */}
                            {(printTemplate === 'thermal80' || printTemplate === 'thermal58') && (
                                <div className="flex justify-center">
                                    <div
                                        id="printable-thermal"
                                        className={cn(
                                            "bg-white text-slate-950 p-4 rounded-xl shadow-lg border border-slate-200 font-mono text-[11px]",
                                            printTemplate === 'thermal80' ? "w-[340px]" : "w-[260px] text-[10px]"
                                        )}
                                    >
                                        <div className="text-center pb-2 border-b border-dashed border-slate-400">
                                            <h3 className="font-black text-base uppercase">{settings.store_name}</h3>
                                            <p className="text-[10px] text-slate-600">{settings.store_tagline}</p>
                                            <p className="text-[10px] text-slate-600">{settings.store_address}</p>
                                            {settings.store_phone && <p className="text-[10px] text-slate-600">Tel: {settings.store_phone}</p>}
                                            {settings.drug_license_number && (
                                                <p className="text-[10px] font-bold text-slate-800">Lic: {settings.drug_license_number}</p>
                                            )}
                                        </div>

                                        <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
                                            <div className="flex justify-between">
                                                <span>INV: <strong>{viewingInvoice.invoice_number}</strong></span>
                                                <span>{formatDate(viewingInvoice.created_at)}</span>
                                            </div>
                                            <div>Cust: {viewingInvoice.customer?.name || 'Walk-in'}</div>
                                            <div>Operator: {viewingInvoice.user?.name || 'Cashier'}</div>
                                        </div>

                                        {/* Items */}
                                        <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                                            {viewingInvoice.items?.map(i => (
                                                <div key={i.id} className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="font-bold truncate">{i.medicine?.name}</div>
                                                        <div className="text-[9px] text-slate-500">{i.quantity} x {formatCurrency(i.unit_price)}</div>
                                                    </div>
                                                    <div className="font-bold">{formatCurrency(i.total_price)}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Totals */}
                                        <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                                            </div>
                                            {viewingInvoice.discount_amount > 0 && (
                                                <div className="flex justify-between text-emerald-800">
                                                    <span>Discount:</span>
                                                    <span>-{formatCurrency(viewingInvoice.discount_amount)}</span>
                                                </div>
                                            )}
                                            {viewingInvoice.tax_amount > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Govt VAT ({viewingInvoice.tax_percentage}%):</span>
                                                    <span>+{formatCurrency(viewingInvoice.tax_amount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                                                <span>TOTAL:</span>
                                                <span>{formatCurrency(viewingInvoice.grand_total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Paid ({viewingInvoice.payment_method.toUpperCase()}):</span>
                                                <span>{formatCurrency(viewingInvoice.paid_amount)}</span>
                                            </div>
                                            {viewingInvoice.due_amount > 0 && (
                                                <div className="flex justify-between font-bold text-rose-700">
                                                    <span>DUE BALANCE:</span>
                                                    <span>{formatCurrency(viewingInvoice.due_amount)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center pt-3 text-[9px] text-slate-600">
                                            <p>{settings.receipt_footer_message}</p>
                                            <p className="mt-1 font-bold">*** PHARMACARE AI ***</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Collect Due Payment */}
            {dueInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-md p-6 border border-slate-700 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-amber-400" />
                                Collect Due Payment
                            </h3>
                            <button onClick={() => setDueInvoice(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCollectDue} className="space-y-4">
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-1">
                                <div className="flex justify-between text-slate-300">
                                    <span>Invoice:</span>
                                    <span className="font-mono font-bold text-white">{dueInvoice.invoice_number}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Customer:</span>
                                    <span className="font-bold text-white">{dueInvoice.customer?.name || 'Walk-in Customer'}</span>
                                </div>
                                <div className="flex justify-between text-amber-400 font-bold border-t border-amber-500/30 pt-1">
                                    <span>Outstanding Due Balance:</span>
                                    <span>{formatCurrency(dueInvoice.due_amount)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Collection Amount (৳) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    max={dueInvoice.due_amount}
                                    value={dueForm.amount}
                                    onChange={(e) => setDueForm({ ...dueForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method *</label>
                                <select
                                    value={dueForm.payment_method}
                                    onChange={(e) => setDueForm({ ...dueForm, payment_method: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                                >
                                    <option value="cash">Cash Counter</option>
                                    <option value="bkash">bKash Merchant</option>
                                    <option value="nagad">Nagad Merchant</option>
                                    <option value="rocket">Rocket</option>
                                    <option value="card">Card / POS POS</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Ref / TrxID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. TRX-992144"
                                    value={dueForm.transaction_reference}
                                    onChange={(e) => setDueForm({ ...dueForm, transaction_reference: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDueInvoice(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-amber"
                                >
                                    {loading ? 'Recording...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: Return / Refund */}
            {returnInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-md p-6 border border-slate-700 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-rose-400" />
                                Process Invoice Return / Refund
                            </h3>
                            <button onClick={() => setReturnInvoice(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleProcessReturn} className="space-y-4">
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs space-y-1">
                                <div className="flex justify-between text-slate-300">
                                    <span>Target Invoice:</span>
                                    <span className="font-mono font-bold text-white">{returnInvoice.invoice_number}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Customer:</span>
                                    <span className="font-bold text-white">{returnInvoice.customer?.name || 'Walk-in Customer'}</span>
                                </div>
                                <div className="flex justify-between text-rose-400 font-bold border-t border-rose-500/30 pt-1">
                                    <span>Total Invoiced:</span>
                                    <span>{formatCurrency(returnInvoice.grand_total)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Return / Cancellation Reason *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={returnForm.reason}
                                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Refund Cash Amount (৳) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={returnForm.refund_amount}
                                    onChange={(e) => setReturnForm({ ...returnForm, refund_amount: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={returnForm.restock_items}
                                        onChange={(e) => setReturnForm({ ...returnForm, restock_items: e.target.checked })}
                                        className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span>Restock items back into FEFO active inventory batches</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setReturnInvoice(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-glow-rose"
                                >
                                    {loading ? 'Processing...' : 'Confirm Return & Restock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
