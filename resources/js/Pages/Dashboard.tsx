import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    AlertTriangle,
    Banknote,
    Boxes,
    ChevronRight,
    Clock,
    Package,
    ShieldAlert,
    Sparkles,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Batch, Medicine, PageProps, Sale } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface Props {
    metrics: {
        today_sales: number;
        today_count: number;
        yesterday_sales: number;
        change_vs_yesterday: number | null;
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
    top_forecast: {
        name: string;
        current_stock: number;
        daily_velocity: number;
        suggested_order_qty: number;
        days_of_supply?: number;
    } | null;
}

const PAYMENT_LABEL: Record<string, string> = {
    cash: 'Cash', card: 'Card', bkash: 'bKash', nagad: 'Nagad', digital_wallet: 'Mobile wallet', credit: 'Credit', split: 'Split',
};

function greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function firstName(name?: string): string {
    return (name ?? '').replace(/^(Dr|Prof|Mr|Mrs|Ms)\.?\s+/i, '').split(/\s+/)[0] ?? '';
}

function StatCard({
    label, icon: Icon, tone, children, footer, href,
}: {
    label: string;
    icon: typeof Package;
    tone: 'emerald' | 'cyan' | 'rose' | 'amber';
    children: React.ReactNode;
    footer: React.ReactNode;
    href?: string;
}) {
    const tones = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    const body = (
        <>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-400">{label}</span>
                <span className={cn('p-2 rounded-xl border', tones[tone])}>
                    <Icon className="w-4 h-4" />
                </span>
            </div>
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">{children}</div>
            <p className="text-xs text-slate-400 mt-1.5">{footer}</p>
        </>
    );
    const cls = 'glass-panel rounded-2xl p-4 border border-slate-800/80 block transition';
    return href ? (
        <Link href={href} className={cn(cls, 'hover:border-slate-700')}>{body}</Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

export default function Dashboard({
    metrics,
    revenue_trend,
    expiring_batches = [],
    recent_sales = [],
    top_forecast: topForecast = null,
}: Props) {
    const { auth, app_info } = usePage<PageProps>().props;
    const can = (key: keyof NonNullable<PageProps['auth']['can']>) => Boolean(auth.can?.[key]);
    const currency = app_info?.currency_symbol || '৳';
    const money = (v: number | string) => formatCurrency(v, currency);
    const change = metrics.change_vs_yesterday;
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <AuthenticatedLayout
            activeTab="dashboard"
            header={
                <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-3 sm:gap-4">
                    <div>
                        <p className="text-sm text-slate-400">{today}</p>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            {greeting()}{firstName(auth.user?.name) ? `, ${firstName(auth.user?.name)}` : ''}
                        </h1>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                        {can('inventory') && metrics.critical_expiring_count > 0 && (
                            <Link
                                href="/inventory?filter_expiry=critical"
                                className="px-3 py-2 rounded-xl text-sm font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5"
                            >
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                {metrics.critical_expiring_count} expiring soon
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Today’s sales"
                    icon={Banknote}
                    tone="emerald"
                    href={can('invoices') ? '/invoices' : undefined}
                    footer={`${metrics.today_count} invoice${metrics.today_count === 1 ? '' : 's'} today · Yesterday ${money(metrics.yesterday_sales)}`}
                >
                    <span className="text-2xl font-extrabold text-white tracking-tight">{money(metrics.today_sales)}</span>
                    {change !== null && (
                        <span
                            className={cn('text-xs font-semibold flex items-center gap-0.5', change >= 0 ? 'text-emerald-400' : 'text-rose-400')}
                            title="Compared with yesterday"
                        >
                            {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {change >= 0 ? '+' : ''}{change}%
                        </span>
                    )}
                </StatCard>

                <StatCard
                    label="Stock value (retail)"
                    icon={Package}
                    tone="cyan"
                    href={can('inventory') ? '/inventory' : undefined}
                    footer={`${metrics.total_medicines} medicines in stock`}
                >
                    <span className="text-2xl font-extrabold text-white tracking-tight">{money(metrics.inventory_value)}</span>
                </StatCard>

                <StatCard
                    label="Expiring within 30 days"
                    icon={AlertTriangle}
                    tone="rose"
                    href={can('inventory') ? '/inventory?filter_expiry=critical' : undefined}
                    footer="Sold first automatically at the POS"
                >
                    <span className={cn('text-2xl font-extrabold tracking-tight', metrics.critical_expiring_count > 0 ? 'text-rose-400' : 'text-white')}>
                        {metrics.critical_expiring_count}
                    </span>
                    <span className="text-sm text-slate-400">batch{metrics.critical_expiring_count === 1 ? '' : 'es'}</span>
                </StatCard>

                <StatCard
                    label="Low stock"
                    icon={Boxes}
                    tone="amber"
                    href={can('inventory') ? '/inventory' : undefined}
                    footer="Below their reorder level"
                >
                    <span className={cn('text-2xl font-extrabold tracking-tight', metrics.low_stock_count > 0 ? 'text-amber-400' : 'text-white')}>
                        {metrics.low_stock_count}
                    </span>
                    <span className="text-sm text-slate-400">medicine{metrics.low_stock_count === 1 ? '' : 's'}</span>
                </StatCard>
            </div>

            {/* Chart + restock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <section className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800/80" aria-labelledby="sales-chart-title">
                    <div className="mb-4">
                        <h2 id="sales-chart-title" className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" /> Sales — last 7 days
                        </h2>
                        <p className="text-sm text-slate-400">Daily revenue, returns excluded</p>
                    </div>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenue_trend} margin={{ left: 4, right: 8, top: 4 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--slate-800))" vertical={false} />
                                <XAxis dataKey="date" stroke="rgb(var(--slate-500))" tick={{ fontSize: 12 }} tickLine={false} />
                                <YAxis
                                    stroke="rgb(var(--slate-500))"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    width={64}
                                    tickFormatter={(v) => `${currency}${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgb(var(--slate-900))',
                                        borderColor: 'rgb(var(--slate-700))',
                                        borderRadius: '0.75rem',
                                        fontSize: '13px',
                                        color: 'rgb(var(--slate-50))',
                                    }}
                                    formatter={(value: any) => [money(value), 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revenueGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between" aria-labelledby="restock-title">
                    <div>
                        <h2 id="restock-title" className="flex items-center gap-2 text-base font-bold text-white">
                            <Sparkles className="w-4 h-4 text-cyan-400" /> Restock suggestion
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Based on how fast each medicine has been selling recently.</p>

                        {topForecast ? (
                            <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                                <p className="text-sm font-bold text-white">{topForecast.name}</p>
                                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <dt className="text-xs text-slate-400">In stock</dt>
                                        <dd className="font-semibold text-white">{topForecast.current_stock}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-slate-400">Sells per day</dt>
                                        <dd className="font-semibold text-white">{topForecast.daily_velocity}</dd>
                                    </div>
                                    <div className="col-span-2">
                                        <dt className="text-xs text-slate-400">Suggested order</dt>
                                        <dd className="font-bold text-emerald-400">{topForecast.suggested_order_qty} units</dd>
                                    </div>
                                </dl>
                            </div>
                        ) : (
                            <p className="mt-4 p-4 rounded-xl bg-slate-800/40 text-sm text-slate-400">Nothing needs restocking right now.</p>
                        )}
                    </div>

                    {can('ai-insights') && (
                        <Link
                            href="/ai-insights"
                            className="mt-5 w-full py-2.5 px-3 rounded-xl text-sm font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-1.5 transition"
                        >
                            See all suggestions <ChevronRight className="w-4 h-4" />
                        </Link>
                    )}
                </section>
            </div>

            {/* Expiring + recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800/80" aria-labelledby="expiry-title">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <h2 id="expiry-title" className="text-base font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-400" /> Expiring soon
                            </h2>
                            <p className="text-sm text-slate-400">Next 30 days — the POS sells these batches first (FEFO).</p>
                        </div>
                        {can('inventory') && (
                            <Link href="/inventory" className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold flex items-center shrink-0">
                                Inventory <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>

                    {expiring_batches.length > 0 ? (
                        <div className="overflow-x-auto -mx-5 px-5">
                            <table className="w-full text-left text-sm min-w-[560px]">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                                        <th scope="col" className="pb-2.5">Medicine</th>
                                        <th scope="col" className="pb-2.5">Batch</th>
                                        <th scope="col" className="pb-2.5">Expires</th>
                                        <th scope="col" className="pb-2.5">Left</th>
                                        <th scope="col" className="pb-2.5 text-right">Stock</th>
                                        <th scope="col" className="pb-2.5 text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {expiring_batches.map((b) => (
                                        <tr key={b.id}>
                                            <td className="py-2.5 font-semibold text-white">
                                                {b.medicine?.name}
                                                <span className="block text-xs text-slate-400 font-normal">{b.medicine?.generic_name?.name}</span>
                                            </td>
                                            <td className="py-2.5 font-mono text-xs text-cyan-300">{b.batch_number}</td>
                                            <td className="py-2.5 text-slate-300">{formatDate(b.expiry_date)}</td>
                                            <td className="py-2.5">
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap',
                                                    b.days_until_expiry <= 15
                                                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                                                )}>
                                                    {b.days_until_expiry} days
                                                </span>
                                            </td>
                                            <td className="py-2.5 font-semibold text-white text-right">{b.current_quantity}</td>
                                            <td className="py-2.5 font-semibold text-emerald-400 text-right">{money(b.selling_price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="py-8 text-center text-sm text-slate-400">Nothing expires in the next 30 days. 🎉</p>
                    )}
                </section>

                <section className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col" aria-labelledby="recent-title">
                    <h2 id="recent-title" className="text-base font-bold text-white flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-emerald-400" /> Recent sales
                    </h2>

                    {recent_sales.length > 0 ? (
                        <ul className="space-y-2.5 flex-1">
                            {recent_sales.map((sale) => (
                                <li key={sale.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs font-semibold text-cyan-400 truncate">{sale.invoice_number}</span>
                                        <span className="text-sm font-bold text-emerald-400 shrink-0">{money(sale.grand_total)}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                                        <span className="truncate">{sale.customer?.name || 'Walk-in customer'}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium shrink-0">
                                            {PAYMENT_LABEL[sale.payment_method?.toLowerCase()] ?? sale.payment_method}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="flex-1 py-8 text-center text-sm text-slate-400">No sales yet. Your latest invoices will show here.</p>
                    )}

                    {can('invoices') && (
                        <Link href="/invoices" className="mt-4 w-full py-2.5 text-center text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition">
                            All invoices
                        </Link>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
