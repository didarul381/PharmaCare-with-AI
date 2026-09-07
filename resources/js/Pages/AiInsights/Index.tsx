import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Sparkles,
    TrendingUp,
    ShieldAlert,
    AlertTriangle,
    Boxes,
    ShoppingCart,
    Calendar,
    CheckCircle2,
    FlaskConical,
    Search,
    ChevronRight,
    ArrowUpRight,
    DollarSign,
    Zap
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { GenericName, DrugInteraction } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

interface Props {
    forecast: {
        items: any[];
        summary: {
            critical_items_count: number;
            reorder_items_count: number;
            total_estimated_restock_cost: number;
            forecast_confidence: number;
        };
    };
    generics: GenericName[];
    interactions: DrugInteraction[];
}

export default function AiInsightsIndex({ forecast, generics, interactions }: Props) {
    const [selectedItem, setSelectedItem] = useState<any>(forecast.items[0] || null);

    // Interactive DDI Tester State
    const [genericA, setGenericA] = useState<string>(generics[5]?.id.toString() || ''); // Ciprofloxacin
    const [genericB, setGenericB] = useState<string>(generics[11]?.id.toString() || ''); // Antacid
    const [testResult, setTestResult] = useState<any | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const runDdiTest = async () => {
        if (!genericA || !genericB) return;
        setIsTesting(true);

        try {
            const res = await fetch('/ai-insights/test-ddi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    generic_a_id: genericA,
                    generic_b_id: genericB,
                }),
            });

            const data = await res.json();
            setTestResult(data);
        } catch (err: any) {
            alert('Failed to run DDI test: ' + err.message);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <AuthenticatedLayout
            activeTab="ai-insights"
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                            <span>AI Clinical Intelligence & Forecasting</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 text-cyan-300 border border-cyan-500/40 font-bold">
                                LLM + Machine Learning Suite
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Predictive consumption forecasting, seasonal restocking models, and clinical interaction simulator
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Confidence: {forecast.summary.forecast_confidence}%</span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="AI Intelligence & Demand Forecasting" />

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Critical Stockout Risks (&le;7d)
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-400 font-sans">
                            {forecast.summary.critical_items_count} Medicines
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Imminent depletion detected</p>
                </div>

                <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Recommended PO Reorders
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-400 font-sans">
                            {forecast.summary.reorder_items_count} Medicines
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Lead time threshold buffer reached</p>
                </div>

                <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Estimated Restock Budget
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-400 font-sans">
                            {formatCurrency(forecast.summary.total_estimated_restock_cost)}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">30-Day optimal supply</p>
                </div>

                <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        DDI Clinical Rules
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-cyan-400 font-sans">
                            {interactions.length} Intersections
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Active contraindication shield</p>
                </div>
            </div>

            {/* Demand Forecast Trajectory Chart & Item Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* 12-Month Demand Curve (8 cols) */}
                <div className="lg:col-span-8 glass-panel rounded-3xl p-5 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                                    12-Month Seasonal Demand Trajectory & Projection
                                </h2>
                                <p className="text-[11px] text-slate-400">
                                    Predictive consumption modeling for: <span className="text-white font-bold">{selectedItem?.name}</span> ({selectedItem?.sku})
                                </p>
                            </div>

                            <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                                selectedItem?.urgency === 'critical_stockout'
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            )}>
                                {selectedItem?.days_of_supply} Days Supply
                            </span>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={selectedItem?.monthly_forecast || []}>
                                    <defs>
                                        <linearGradient id="aiForecastGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}u`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderColor: '#334155',
                                            borderRadius: '0.75rem',
                                            fontSize: '12px',
                                            color: '#f8fafc',
                                        }}
                                        formatter={(value: any, name: any) => [
                                            `${value} Units`,
                                            name === 'demand' ? 'AI Predicted Demand' : 'Actual Dispensed',
                                        ]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Area
                                        name="demand"
                                        type="monotone"
                                        dataKey="demand"
                                        stroke="#06b6d4"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#aiForecastGrad)"
                                    />
                                    <Area
                                        name="actual"
                                        type="monotone"
                                        dataKey="actual"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        fillOpacity={0}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Daily Consumption</span>
                            <span className="text-xs font-bold text-white">{selectedItem?.daily_velocity} Units / Day</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Predicted 30d Need</span>
                            <span className="text-xs font-bold text-cyan-300">{selectedItem?.predicted_30d_demand} Units</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Recommended PO</span>
                            <span className="text-xs font-bold text-emerald-400">+{selectedItem?.suggested_order_qty} Units</span>
                        </div>
                    </div>
                </div>

                {/* Medicine Selector List (4 cols) */}
                <div className="lg:col-span-4 glass-panel rounded-3xl p-5 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Ranked by Restock Urgency
                        </h3>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {forecast.items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={cn(
                                        "p-3 rounded-2xl border cursor-pointer transition select-none",
                                        selectedItem?.id === item.id
                                            ? "bg-cyan-500/15 border-cyan-500/50 shadow-sm"
                                            : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-white text-xs block truncate">{item.name}</span>
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.2 rounded",
                                            item.urgency === 'critical_stockout'
                                                ? "bg-rose-500/20 text-rose-400"
                                                : "bg-slate-800 text-slate-400"
                                        )}>
                                            {item.days_of_supply}d supply
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Stock: {item.current_stock}</span>
                                        <span className="text-emerald-400 font-bold">
                                            Rec: +{item.suggested_order_qty}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive DDI Clinical Simulator */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 bg-gradient-to-br from-[#0d1322] to-[#070b13]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-emerald-400" />
                            Interactive Drug-Drug Interaction (DDI) Safety Sandbox
                        </h2>
                        <p className="text-[11px] text-slate-400">Cross-reference active generic compounds before prescribing or dispensing</p>
                    </div>

                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clinical Knowledge Base v2026.9
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Drug Generic (A)</label>
                        <select
                            value={genericA}
                            onChange={(e) => setGenericA(e.target.value)}
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        >
                            {generics.map((g) => (
                                <option key={g.id} value={g.id}>{g.name} ({g.therapeutic_class})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Secondary Drug Generic (B)</label>
                        <select
                            value={genericB}
                            onChange={(e) => setGenericB(e.target.value)}
                            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                        >
                            {generics.map((g) => (
                                <option key={g.id} value={g.id}>{g.name} ({g.therapeutic_class})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <button
                            onClick={runDdiTest}
                            disabled={isTesting}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-glow-emerald flex items-center justify-center gap-1.5 transition"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isTesting ? 'Analyzing Interactions...' : 'Simulate DDI Safety'}</span>
                        </button>
                    </div>
                </div>

                {/* Test Result Display */}
                {testResult && (
                    <div className="mt-5 p-4 rounded-2xl bg-slate-900 border border-slate-800 animate-in fade-in">
                        {testResult.has_interaction ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldAlert className="w-4 h-4" />
                                        {testResult.interaction.severity} Interaction Detected
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                                        Hazard Level: {testResult.interaction.severity}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                    {testResult.interaction.description}
                                </p>
                                {testResult.interaction.clinical_management && (
                                    <div className="mt-2 text-xs font-medium text-emerald-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                        💡 Clinical Protocol: {testResult.interaction.clinical_management}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{testResult.message}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
