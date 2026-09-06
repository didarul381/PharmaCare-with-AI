import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    PackageCheck,
    AlertTriangle,
    ShieldAlert,
    Calendar,
    Download,
    Printer,
    Users,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    FileSpreadsheet,
    Percent,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    Clock,
    Zap,
    Filter,
    Stethoscope,
    Boxes,
    Building2,
    Eye
} from 'lucide-react';
import { StoreSetting, PageProps } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface TopMedicine {
    medicine_id: number;
    name: string;
    category: string;
    generic: string;
    units_sold: number;
    total_revenue: number;
    current_stock: number;
}

interface PaymentMethodStat {
    method: string;
    count: number;
    total: number;
}

interface SalesTrendPoint {
    sale_date: string;
    total_sales: number;
    revenue: number;
    collected: number;
}

interface ControlledItem {
    id: number;
    date: string;
    invoice_number: string;
    medicine_name: string;
    generic_name: string;
    batch_number: string;
    quantity: number;
    unit: string;
    patient_name: string;
    patient_phone: string;
    doctor_name: string;
    dispensed_by: string;
}

interface DueCustomer {
    id: number;
    name: string;
    phone: string;
    credit_balance: number;
    credit_limit: number;
    updated_at: string;
}

interface StaffPerf {
    id: number;
    name: string;
    role: string;
    sales_count: number;
    total_revenue: number;
}

interface Props {
    metrics: {
        total_sales_count: number;
        total_invoiced: number;
        total_collected: number;
        total_dues: number;
        total_discount: number;
        total_tax: number;
        total_returns_count: number;
        total_returns_amount: number;
        cogs: number;
        gross_profit: number;
        profit_margin: number;
    };
    payment_methods: PaymentMethodStat[];
    sales_trend: SalesTrendPoint[];
    top_medicines: TopMedicine[];
    inventory_valuation: {
        total_skus: number;
        total_active_batches: number;
        total_units_in_stock: number;
        valuation_cost: number;
        valuation_retail: number;
        unrealized_margin: number;
        low_stock_count: number;
        expiry_bins: {
            expired_count: number;
            expired_units: number;
            expired_valuation: number;
            expiring_30: number;
            expiring_30_units: number;
            expiring_60: number;
            expiring_90: number;
            safe_count: number;
        };
    };
    controlled_items: ControlledItem[];
    due_customers: DueCustomer[];
    total_receivables: number;
    staff_performance: StaffPerf[];
    filters: {
        preset: string;
        start_date: string;
        end_date: string;
        date_label: string;
        tab: string;
    };
    settings: StoreSetting;
}

export default function ReportsIndex({
    metrics,
    payment_methods,
    sales_trend,
    top_medicines,
    inventory_valuation,
    controlled_items,
    due_customers,
    total_receivables,
    staff_performance,
    filters,
    settings,
}: Props) {
    const [activeTab, setActiveTab] = useState<'executive' | 'sales' | 'inventory' | 'controlled' | 'dues'>(
        (filters.tab as any) || 'executive'
    );
    const [selectedPreset, setSelectedPreset] = useState(filters.preset || 'last_30_days');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [showCustomRange, setShowCustomRange] = useState(filters.preset === 'custom');
    const [exportType, setExportType] = useState<'sales' | 'inventory' | 'controlled_substances' | 'customer_dues' | 'p_and_l'>('p_and_l');

    const presets = [
        { key: 'today', label: 'Today' },
        { key: 'yesterday', label: 'Yesterday' },
        { key: 'last_7_days', label: 'Last 7 Days' },
        { key: 'last_30_days', label: 'Last 30 Days' },
        { key: 'this_month', label: 'This Month' },
        { key: 'last_month', label: 'Last Month' },
        { key: 'this_year', label: 'This Year' },
        { key: 'custom', label: 'Custom Range' },
    ];

    const handlePresetChange = (preset: string) => {
        setSelectedPreset(preset);
        if (preset === 'custom') {
            setShowCustomRange(true);
            return;
        }
        setShowCustomRange(false);
        router.get('/reports', {
            preset,
            tab: activeTab,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleCustomFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports', {
            preset: 'custom',
            start_date: startDate,
            end_date: endDate,
            tab: activeTab,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleTabSwitch = (tab: 'executive' | 'sales' | 'inventory' | 'controlled' | 'dues') => {
        setActiveTab(tab);
        router.get('/reports', {
            preset: selectedPreset,
            start_date: startDate,
            end_date: endDate,
            tab,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleDownloadCsv = () => {
        const queryParams = new URLSearchParams({
            type: exportType,
            preset: selectedPreset,
            start_date: startDate,
            end_date: endDate,
        });
        window.location.href = `/reports/export?${queryParams.toString()}`;
    };

    const handlePrintReport = () => {
        const reportContent = document.getElementById('report-printable-zone');
        if (!reportContent) {
            window.print();
            return;
        }

        let iframe = document.getElementById('pharma-report-print-frame') as HTMLIFrameElement;
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'pharma-report-print-frame';
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
                <title>PharmaCare Executive Report - ${filters.date_label}</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        padding: 10px;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        font-size: 11px;
                        line-height: 1.35;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th, td {
                        padding: 6px 8px;
                        border: 1px solid #cbd5e1;
                    }
                    th {
                        background-color: #f1f5f9;
                        color: #0f172a;
                        font-weight: bold;
                        text-align: left;
                    }
                    .flex { display: flex; }
                    .items-center { align-items: center; }
                    .justify-between { justify-content: space-between; }
                    .grid { display: grid; }
                    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                    .gap-4 { gap: 1rem; }
                    .p-4 { padding: 1rem; }
                    .border { border: 1px solid #cbd5e1; }
                    .rounded-xl { border-radius: 0.5rem; }
                    .bg-slate-50 { background-color: #f8fafc; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: 700; }
                    .font-black { font-weight: 900; }
                    .text-xs { font-size: 10px; }
                    .text-sm { font-size: 12px; }
                    .text-base { font-size: 14px; }
                    .text-xl { font-size: 18px; }
                    .text-emerald-700 { color: #047857; }
                    .text-cyan-700 { color: #0e7490; }
                    .text-rose-700 { color: #be123c; }
                    .uppercase { text-transform: uppercase; }
                    .border-b { border-bottom: 1px solid #cbd5e1; }
                    .pb-3 { padding-bottom: 0.75rem; }
                    .mb-4 { margin-bottom: 1rem; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body>
                <div class="border-b pb-3 mb-4 flex justify-between items-center">
                    <div>
                        <h1 style="margin:0; font-size: 18px; font-weight: 900; text-transform: uppercase;">${settings.store_name}</h1>
                        <p style="margin:2px 0 0; color: #64748b; font-size: 10px;">${settings.store_tagline || 'Institutional Pharmacy Intelligence'}</p>
                    </div>
                    <div class="text-right">
                        <div style="font-weight: bold; font-size: 12px;">EXECUTIVE AUDIT REPORT</div>
                        <div style="font-size: 10px; color: #64748b;">Period: ${filters.date_label}</div>
                    </div>
                </div>
                ${reportContent.innerHTML}
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }, 250);
    };

    return (
        <AuthenticatedLayout
            activeTab="reports"
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-emerald-400" />
                            <span>Executive Intelligence & Reports</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Period: <strong className="text-slate-200">{filters.date_label}</strong>
                        </p>
                    </div>

                    {/* Actions: CSV Export & Print */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                            <select
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value as any)}
                                className="text-xs bg-transparent border-0 text-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-0 cursor-pointer"
                            >
                                <option value="p_and_l">P&L Summary (CSV)</option>
                                <option value="sales">Sales Transactions (CSV)</option>
                                <option value="inventory">Inventory Asset Valuation (CSV)</option>
                                <option value="controlled_substances">DGDA Controlled Log (CSV)</option>
                                <option value="customer_dues">Customer Receivables (CSV)</option>
                            </select>
                            <button
                                onClick={handleDownloadCsv}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export</span>
                            </button>
                        </div>

                        <button
                            onClick={handlePrintReport}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                        >
                            <Printer className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Print Report</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Reports & Financial Intelligence" />

            {/* Date Range Filter Bar */}
            <div className="glass-panel rounded-2xl p-3 mb-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {presets.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => handlePresetChange(p.key)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition",
                                selectedPreset === p.key
                                    ? "bg-emerald-500 text-slate-950 font-bold shadow-glow-emerald"
                                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Custom Range Selector */}
                {showCustomRange && (
                    <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-500 text-xs">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                            type="submit"
                            className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                        >
                            Apply
                        </button>
                    </form>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 mb-6 overflow-x-auto">
                <button
                    onClick={() => handleTabSwitch('executive')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap",
                        activeTab === 'executive'
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    )}
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>Executive P&L Analytics</span>
                </button>

                <button
                    onClick={() => handleTabSwitch('sales')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap",
                        activeTab === 'sales'
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    )}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Sales & Staff Performance</span>
                </button>

                <button
                    onClick={() => handleTabSwitch('inventory')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap",
                        activeTab === 'inventory'
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    )}
                >
                    <PackageCheck className="w-4 h-4" />
                    <span>Inventory Asset Valuation</span>
                </button>

                <button
                    onClick={() => handleTabSwitch('controlled')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap",
                        activeTab === 'controlled'
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    )}
                >
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>DGDA Controlled Narcotics Log</span>
                </button>

                <button
                    onClick={() => handleTabSwitch('dues')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap",
                        activeTab === 'dues'
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    )}
                >
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Receivables & Customer Credit</span>
                </button>
            </div>

            {/* Main Printable Container */}
            <div id="report-printable-zone" className="space-y-6">
                {/* TAB 1: EXECUTIVE P&L ANALYTICS */}
                {activeTab === 'executive' && (
                    <div className="space-y-6">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Gross Revenue */}
                            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Gross Invoiced Revenue</span>
                                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-white">{formatCurrency(metrics.total_invoiced)}</span>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                                    <span>{metrics.total_sales_count} Transactions</span>
                                    <span className="text-emerald-400 font-bold">Collected: {formatCurrency(metrics.total_collected)}</span>
                                </div>
                            </div>

                            {/* Cost of Goods Sold (COGS) */}
                            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Cost of Goods Sold (COGS)</span>
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                                        <Boxes className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-amber-300">{formatCurrency(metrics.cogs)}</span>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-400">
                                    Purchase cost of all dispensed stock
                                </div>
                            </div>

                            {/* Estimated Gross Profit */}
                            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 shadow-glow-emerald bg-emerald-500/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-emerald-300 font-bold">Gross Profit (Net)</span>
                                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-emerald-400">{formatCurrency(metrics.gross_profit)}</span>
                                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                        {metrics.profit_margin}% Margin
                                    </span>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-400">
                                    Net Revenue - COGS
                                </div>
                            </div>

                            {/* Receivables & Returns */}
                            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Receivables & Concessions</span>
                                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-xl font-black text-rose-300">{formatCurrency(metrics.total_dues)}</span>
                                    <span className="text-xs text-slate-400">Due</span>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                                    <span>Discounts: {formatCurrency(metrics.total_discount)}</span>
                                    <span>VAT: {formatCurrency(metrics.total_tax)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Middle Grid: Payment Channel Mix & Top 10 Bestsellers */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Payment Channels (5 cols) */}
                            <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                                        <CreditCard className="w-4 h-4 text-cyan-400" />
                                        <span>Payment Channel Breakdown</span>
                                    </h3>

                                    <div className="space-y-3">
                                        {payment_methods.map((pm) => {
                                            const pct = metrics.total_invoiced > 0
                                                ? Math.round((pm.total / metrics.total_invoiced) * 100)
                                                : 0;
                                            return (
                                                <div key={pm.method} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-300 uppercase">{pm.method}</span>
                                                        <div className="space-x-2">
                                                            <span className="text-slate-400 font-mono">{pm.count} txns</span>
                                                            <span className="font-bold text-white font-mono">{formatCurrency(pm.total)}</span>
                                                            <span className="text-[10px] text-cyan-400 font-bold">({pct}%)</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                        <span className="text-slate-400 block text-[10px]">Sales Returns / Refunds</span>
                                        <span className="font-bold text-rose-400 text-sm">{metrics.total_returns_count} ({formatCurrency(metrics.total_returns_amount)})</span>
                                    </div>
                                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                        <span className="text-slate-400 block text-[10px]">Total Tax (Govt VAT)</span>
                                        <span className="font-bold text-emerald-400 text-sm">{formatCurrency(metrics.total_tax)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top 10 Bestselling Medicines (7 cols) */}
                            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-slate-800">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                    <span>Top 10 Bestselling Formulations</span>
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                                                <th className="py-2 px-2">#</th>
                                                <th className="py-2 px-3">Medicine & Category</th>
                                                <th className="py-2 px-3 text-center">Units Sold</th>
                                                <th className="py-2 px-3 text-right">Revenue</th>
                                                <th className="py-2 px-3 text-right">Remaining Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {top_medicines.map((med, idx) => (
                                                <tr key={med.medicine_id} className="hover:bg-slate-800/30">
                                                    <td className="py-2.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                                                    <td className="py-2.5 px-3">
                                                        <div className="font-bold text-white">{med.name}</div>
                                                        <div className="text-[10px] text-slate-400">{med.generic} • {med.category}</div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-300">
                                                        {med.units_sold}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                                        {formatCurrency(med.total_revenue)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right">
                                                        <span className={cn(
                                                            "font-mono text-xs font-bold px-2 py-0.5 rounded",
                                                            med.current_stock <= 10 ? "bg-rose-500/20 text-rose-300" : "text-slate-300"
                                                        )}>
                                                            {med.current_stock}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {top_medicines.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-6 text-slate-500">
                                                        No sales recorded for this timeframe.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: SALES & STAFF PERFORMANCE */}
                {activeTab === 'sales' && (
                    <div className="space-y-6">
                        {/* Staff Dispensation Leaderboard */}
                        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                                <Users className="w-4 h-4 text-cyan-400" />
                                <span>Dispensation Station Staff Performance</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {staff_performance.map((staff) => (
                                    <div key={staff.id} className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-white text-sm">{staff.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                                                {staff.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                                            <span className="text-slate-400">Invoices Dispensed:</span>
                                            <span className="font-bold text-cyan-400 font-mono">{staff.sales_count}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Revenue Realized:</span>
                                            <span className="font-bold text-emerald-400 font-mono">{formatCurrency(staff.total_revenue)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Daily Sales Trend Timeline Table */}
                        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                                <Calendar className="w-4 h-4 text-emerald-400" />
                                <span>Daily Sales Revenue Ledger</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                                            <th className="py-2 px-3">Date</th>
                                            <th className="py-2 px-3 text-center">Invoices Count</th>
                                            <th className="py-2 px-3 text-right">Invoiced Revenue</th>
                                            <th className="py-2 px-3 text-right">Amount Collected</th>
                                            <th className="py-2 px-3 text-right">Uncollected Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {sales_trend.map((trend) => (
                                            <tr key={trend.sale_date} className="hover:bg-slate-800/30">
                                                <td className="py-2.5 px-3 font-mono font-bold text-white">
                                                    {formatDate(trend.sale_date)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-mono text-cyan-300">
                                                    {trend.total_sales}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                                                    {formatCurrency(trend.revenue)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                                                    {formatCurrency(trend.collected)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                                                    {formatCurrency(Math.max(0, trend.revenue - trend.collected))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: INVENTORY ASSET VALUATION & EXPIRY RISK */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        {/* Valuation Summary Banner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                                <span className="text-xs text-slate-400 block font-medium">Inventory Cost Valuation</span>
                                <span className="text-2xl font-black text-amber-400 mt-1 block">
                                    {formatCurrency(inventory_valuation.valuation_cost)}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    {inventory_valuation.total_units_in_stock.toLocaleString()} units across {inventory_valuation.total_skus} SKUs
                                </span>
                            </div>

                            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                                <span className="text-xs text-slate-400 block font-medium">Expected Retail Valuation</span>
                                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                                    {formatCurrency(inventory_valuation.valuation_retail)}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Unrealized margin: +{formatCurrency(inventory_valuation.unrealized_margin)}
                                </span>
                            </div>

                            <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5">
                                <span className="text-xs text-rose-300 block font-bold">Expired Stock Loss</span>
                                <span className="text-2xl font-black text-rose-400 mt-1 block">
                                    {formatCurrency(inventory_valuation.expiry_bins.expired_valuation)}
                                </span>
                                <span className="text-[11px] text-rose-300 mt-1 block">
                                    {inventory_valuation.expiry_bins.expired_count} batches ({inventory_valuation.expiry_bins.expired_units} units)
                                </span>
                            </div>

                            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                                <span className="text-xs text-slate-400 block font-medium">Low Stock Alerts</span>
                                <span className="text-2xl font-black text-white mt-1 block">
                                    {inventory_valuation.low_stock_count} SKUs
                                </span>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Under minimum safety threshold
                                </span>
                            </div>
                        </div>

                        {/* Expiry Risk Distribution Bins */}
                        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <span>Batch Expiry Timeline Risk Distribution</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                                    <span className="text-xs font-bold text-rose-400 block uppercase">Critical (&lt; 30 Days)</span>
                                    <div className="text-xl font-black text-white">
                                        {inventory_valuation.expiry_bins.expiring_30} Batches
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        {inventory_valuation.expiry_bins.expiring_30_units} Units at urgent expiry risk
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                                    <span className="text-xs font-bold text-amber-400 block uppercase">30 - 60 Days Out</span>
                                    <div className="text-xl font-black text-white">
                                        {inventory_valuation.expiry_bins.expiring_60} Batches
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        FEFO priority clearance recommended
                                    </div>
                                </div>

                                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl space-y-1">
                                    <span className="text-xs font-bold text-cyan-400 block uppercase">60 - 90 Days Out</span>
                                    <div className="text-xl font-black text-white">
                                        {inventory_valuation.expiry_bins.expiring_90} Batches
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Standard rotation window
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                                    <span className="text-xs font-bold text-emerald-400 block uppercase">Safe (&gt; 90 Days)</span>
                                    <div className="text-xl font-black text-white">
                                        {inventory_valuation.expiry_bins.safe_count} Batches
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Healthy vault inventory
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: DGDA CONTROLLED SUBSTANCES COMPLIANCE */}
                {activeTab === 'controlled' && (
                    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-rose-400" />
                                    <span>DGDA Narcotics & Controlled Substance Dispensation Register</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Official regulatory compliance ledger for scheduled & controlled pharmaceutical compounds
                                </p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                {controlled_items.length} Controlled Logs
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                                        <th className="py-2.5 px-3">Date & Time</th>
                                        <th className="py-2.5 px-3">Invoice #</th>
                                        <th className="py-2.5 px-3">Controlled Medicine</th>
                                        <th className="py-2.5 px-3">Batch</th>
                                        <th className="py-2.5 px-3 text-center">Qty</th>
                                        <th className="py-2.5 px-3">Patient Name / Phone</th>
                                        <th className="py-2.5 px-3">Prescribing Doctor</th>
                                        <th className="py-2.5 px-3">Pharmacist</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {controlled_items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-800/30">
                                            <td className="py-2.5 px-3 font-mono text-slate-400">{item.date}</td>
                                            <td className="py-2.5 px-3 font-mono font-bold text-white">{item.invoice_number}</td>
                                            <td className="py-2.5 px-3">
                                                <div className="font-bold text-rose-300">{item.medicine_name}</div>
                                                <div className="text-[10px] text-slate-400">{item.generic_name}</div>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-300">{item.batch_number}</td>
                                            <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                                                {item.quantity} {item.unit}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="font-bold text-white">{item.patient_name}</div>
                                                <div className="text-[10px] text-slate-400">{item.patient_phone}</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-emerald-400 font-medium">
                                                {item.doctor_name}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-300">{item.dispensed_by}</td>
                                        </tr>
                                    ))}
                                    {controlled_items.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-slate-500">
                                                No controlled substance dispensations recorded in this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 5: RECEIVABLES & CUSTOMER CREDIT */}
                {activeTab === 'dues' && (
                    <div className="space-y-6">
                        {/* Receivables Banner */}
                        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-amber-300 uppercase">Total Outstanding Accounts Receivable</span>
                                <div className="text-3xl font-black text-amber-400 mt-1">
                                    {formatCurrency(total_receivables)}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Aggregated customer credit ledger awaiting collection
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block">Total Customers with Due:</span>
                                <span className="text-xl font-bold text-white">{due_customers.length} Patients</span>
                            </div>
                        </div>

                        {/* Due Customer Aging Table */}
                        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                                <Users className="w-4 h-4 text-amber-400" />
                                <span>Customer Credit & Receivables Aging Ledger</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                                            <th className="py-2 px-3">#</th>
                                            <th className="py-2 px-3">Customer Name</th>
                                            <th className="py-2 px-3">Phone Number</th>
                                            <th className="py-2 px-3 text-right">Credit Limit</th>
                                            <th className="py-2 px-3 text-right">Outstanding Due</th>
                                            <th className="py-2 px-3 text-right">Last Transaction</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {due_customers.map((cust, idx) => (
                                            <tr key={cust.id} className="hover:bg-slate-800/30">
                                                <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                                                <td className="py-2.5 px-3 font-bold text-white">{cust.name}</td>
                                                <td className="py-2.5 px-3 font-mono text-slate-400">{cust.phone}</td>
                                                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                                                    {formatCurrency(cust.credit_limit)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                                                    {formatCurrency(cust.credit_balance)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                                                    {cust.updated_at}
                                                </td>
                                            </tr>
                                        ))}
                                        {due_customers.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-6 text-slate-500">
                                                    No outstanding customer dues at this time.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
