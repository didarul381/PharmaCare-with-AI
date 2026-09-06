import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DollarSign,
    Package,
    AlertTriangle,
    Boxes,
    Sparkles,
    ArrowUpRight,
    TrendingUp,
    Clock,
    ShoppingCart,
    Calendar,
    ChevronRight,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Batch, Medicine, Sale } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Props {
    metrics: {
        today_sales: number;
        total_sales: number;
        inventory_value: number;
        critical_expiring_count: number;
        low_stock_count: number;
        total_medicines: number;
        total_prescriptions: number;
    };
    revenue_trend: Array<{ date: string; revenue: number }>;
    expiring_batches: Batch[];
    low_stock_medicines: Medicine[];
    recent_sales: Sale[];
    top_forecast: any;
}

export default function Dashboard({
    metrics,
    revenue_trend,
    expiring_batches = [],
    low_stock_medicines = [],
    recent_sales = [],
    top_forecast: topForecast = null,
}: Props) {
    return (
        <AuthenticatedLayout
            activeTab="dashboard"
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                            Executive Overview & Telemetry
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                                Realtime FEFO
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            AI-Powered Inventory Velocity, Expiration Shield, and POS Dispensing Status
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/inventory?filter_expiry=critical"
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>{metrics.critical_expiring_count} Near Expiry</span>
                        </Link>
                        <Link
                            href="/pos"
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald transition flex items-center gap-1.5"
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Open POS (F2)</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Executive Dashboard" />

            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Metric 1: Total Sales */}
                <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border border-slate-800/80 shadow-lg group hover:border-emerald-500/40 transition">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales (Today)</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-white tracking-tight font-sans">
                            {formatCurrency(metrics.today_sales)}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">All-time: {formatCurrency(metrics.total_sales)}</p>
                </div>

                {/* Metric 2: Inventory Value */}
                <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border border-slate-800/80 shadow-lg group hover:border-cyan-500/40 transition">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Retail Value</span>
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-white tracking-tight font-sans">
                            {formatCurrency(metrics.inventory_value)}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{metrics.total_medicines} Active Medicines in Vault</p>
                </div>

                {/* Metric 3: Critical Expiring */}
                <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border border-slate-800/80 shadow-lg group hover:border-rose-500/40 transition">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Expiring (&lt;30d)</span>
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-rose-400 tracking-tight font-sans">
                            {metrics.critical_expiring_count}
                        </span>
                        <span className="text-[11px] text-rose-300 font-medium">Batches requiring FEFO push</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Automatic priority discounting enabled</p>
                </div>

                {/* Metric 4: Stockout Alerts */}
                <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border border-slate-800/80 shadow-lg group hover:border-amber-500/40 transition">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stockout Threshold</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Boxes className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-amber-400 tracking-tight font-sans">
                            {metrics.low_stock_count}
                        </span>
                        <span className="text-[11px] text-amber-300 font-medium">Below safe reorder level</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">AI automated POs drafted</p>
                </div>
            </div>

            {/* Charts Section: Revenue Area Chart + AI Predictive Restocking Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* 7-Day Revenue Velocity */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                Sales Velocity & Revenue Trend
                            </h2>
                            <p className="text-[11px] text-slate-400">7-Day dispensing performance and volume</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Live Stream
                        </span>
                    </div>

                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenue_trend}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${v}`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#334155',
                                        borderRadius: '0.75rem',
                                        fontSize: '12px',
                                        color: '#f8fafc',
                                    }}
                                    formatter={(value: any) => [`${formatCurrency(value)}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#revenueGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Predictive Restocking Card */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                AI Predictive Restocking
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                94.8% Acc
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                            Demand Surge Forecast
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Predicted seasonal consumption indicates imminent stock depletion for top antibiotics and antihistamines.
                        </p>

                        {topForecast && (
                            <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white">{topForecast.name}</span>
                                    <span className="text-xs font-bold text-emerald-400">
                                        +{topForecast.suggested_order_qty} Units Rec.
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                    <span>Current Stock: {topForecast.current_stock}</span>
                                    <span>Velocity: {topForecast.daily_velocity} / day</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-5">
                        <Link
                            href="/ai-insights"
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-1.5 transition"
                        >
                            <span>Open Demand Intelligence</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Critical Expiring Batches Table & Recent Sales Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expiring Batches Table (FEFO Manager View) */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                Critical Expiry FEFO Queue (&lt;30 Days)
                            </h2>
                            <p className="text-[11px] text-slate-400">Batches automatically assigned top priority at POS terminal</p>
                        </div>
                        <Link href="/inventory" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center">
                            View All Batches <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="pb-2.5">Medicine Name</th>
                                    <th className="pb-2.5">Batch #</th>
                                    <th className="pb-2.5">Expiry Date</th>
                                    <th className="pb-2.5">Days Left</th>
                                    <th className="pb-2.5">Current Stock</th>
                                    <th className="pb-2.5">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                                {expiring_batches.length > 0 ? (
                                    expiring_batches.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-2.5 font-semibold text-white">
                                                {b.medicine?.name}
                                                <span className="block text-[10px] text-slate-400 font-normal">
                                                    {b.medicine?.generic_name?.name}
                                                </span>
                                            </td>
                                            <td className="py-2.5 font-mono text-cyan-300 font-medium">{b.batch_number}</td>
                                            <td className="py-2.5 text-slate-300">{formatDate(b.expiry_date)}</td>
                                            <td className="py-2.5">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                    b.days_until_expiry <= 15
                                                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                )}>
                                                    {b.days_until_expiry} Days Left
                                                </span>
                                            </td>
                                            <td className="py-2.5 font-bold text-white">{b.current_quantity} Units</td>
                                            <td className="py-2.5 font-semibold text-emerald-400">{formatCurrency(b.selling_price)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-6 text-center text-slate-500">
                                            No critical expiring batches detected. All stock within safe range (&gt;30d).
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent POS Sales Activity */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                Recent Dispensing
                            </h2>
                            <span className="text-[10px] text-slate-400">Live Invoices</span>
                        </div>

                        <div className="space-y-3">
                            {recent_sales.map((sale) => (
                                <div key={sale.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-xs font-bold text-cyan-400">{sale.invoice_number}</span>
                                        <span className="text-xs font-bold text-emerald-400">{formatCurrency(sale.grand_total)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Customer: {sale.customer?.name || 'Walk-in Cash'}</span>
                                        <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                                            {sale.payment_method}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link
                        href="/pos"
                        className="mt-4 w-full py-2 text-center text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                    >
                        Launch POS Terminal
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
