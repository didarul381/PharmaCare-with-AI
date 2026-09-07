import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    History,
    ShieldCheck,
    Search,
    RotateCcw,
    AlertTriangle,
    CheckCircle2,
    Clock,
    User as UserIcon,
    FileCode,
    Filter,
    ShieldAlert,
    Boxes,
    ShoppingCart,
    Shield,
    Settings as SettingsIcon,
    Eye,
    Printer,
    X,
    ArrowRight,
    Lock
} from 'lucide-react';
import { AuditLog, StockAdjustment, User } from '@/types';
import { formatDate, cn } from '@/lib/utils';

interface Props {
    logs: AuditLog[];
    adjustments: StockAdjustment[];
    users: User[];
    metrics: {
        total_logs: number;
        controlled_events_count: number;
        stock_adjustments_count: number;
        medicine_changes_count: number;
    };
    filters: {
        search?: string;
        category?: string;
        user_id?: string;
    };
}

export default function AuditLogsIndex({ logs, adjustments, users, metrics, filters }: Props) {
    const [activeTab, setActiveTab] = useState<'audit' | 'adjustments'>('audit');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedUserId, setSelectedUserId] = useState(filters.user_id || '');
    const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        router.get('/audit-logs', {
            search: searchTerm,
            category: selectedCategory === 'all' ? '' : selectedCategory,
            user_id: selectedUserId,
            ...newFilters,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const handleCategoryClick = (cat: string) => {
        setSelectedCategory(cat);
        applyFilters({ category: cat === 'all' ? '' : cat });
    };

    const handlePrint = () => {
        window.print();
    };

    // Role badge color helper
    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'super_admin':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'pharmacist':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'cashier':
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'inventory_manager':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            default:
                return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    // Action format helper
    const getActionBadge = (action: string) => {
        if (action === 'controlled_substance_dispensed') {
            return {
                label: 'CONTROLLED DISPENSE',
                className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose',
                icon: ShieldAlert,
            };
        }
        if (action.startsWith('stock_adjustment')) {
            return {
                label: action.replace('stock_adjustment_', 'STOCK ').toUpperCase(),
                className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                icon: RotateCcw,
            };
        }
        if (action === 'medicine_deleted') {
            return {
                label: 'MEDICINE DELETED',
                className: 'bg-red-500/20 text-red-300 border-red-500/40',
                icon: AlertTriangle,
            };
        }
        if (action === 'medicine_created') {
            return {
                label: 'MEDICINE CREATED',
                className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                icon: Boxes,
            };
        }
        if (action === 'role_switched') {
            return {
                label: 'ROLE SWITCHED',
                className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                icon: Shield,
            };
        }
        if (action === 'pos_sale_dispense') {
            return {
                label: 'POS DISPENSE',
                className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                icon: ShoppingCart,
            };
        }
        return {
            label: action.replace(/_/g, ' ').toUpperCase(),
            className: 'bg-slate-800 text-slate-300 border-slate-700',
            icon: History,
        };
    };

    return (
        <AuthenticatedLayout
            activeTab="audit-logs"
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                            <span>Regulatory Compliance & Audit</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Tamper-Evident RBAC
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Immutable audit trail tracking controlled substances, medicine deletions, stock adjustments, and staff role actions
                        </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                        </button>

                        {/* View Switcher */}
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={cn(
                                    "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                                    activeTab === 'audit' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                                )}
                            >
                                Audit Ledger ({logs.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('adjustments')}
                                className={cn(
                                    "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                                    activeTab === 'adjustments' ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                                )}
                            >
                                Adjustments ({adjustments.length})
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Regulatory Audit Logs & Compliance" />

            {/* Stat Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Total Audit Logs</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <History className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{metrics.total_logs}</div>
                    <p className="text-[10px] text-slate-500 mt-1">Immutable ledger transactions</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-rose-300">Controlled Substances</span>
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-rose-400">{metrics.controlled_events_count}</div>
                    <p className="text-[10px] text-rose-400/70 mt-1">DGDA/Schedule-II dispensations</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-300">Stock Adjustments & Waste</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-amber-400">{metrics.stock_adjustments_count}</div>
                    <p className="text-[10px] text-amber-400/70 mt-1">Discards, reconciliations & damages</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-300">Medicine Master Audits</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Boxes className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-purple-400">{metrics.medicine_changes_count}</div>
                    <p className="text-[10px] text-purple-400/70 mt-1">Entities created, deleted, or archived</p>
                </div>
            </div>

            {/* Filter Pills & Live Search Bar */}
            <div className="glass-panel rounded-2xl p-4 mb-6 border border-slate-800/80 flex flex-col gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                        { key: 'all', label: 'All Records', icon: History },
                        { key: 'controlled', label: 'Controlled Substances', icon: ShieldAlert, alert: true },
                        { key: 'medicine', label: 'Medicine Changes / Deletion', icon: Boxes },
                        { key: 'stock', label: 'Stock Adjustments & Discards', icon: RotateCcw },
                        { key: 'sales', label: 'POS Dispensations', icon: ShoppingCart },
                        { key: 'security', label: 'Security & Roles', icon: Shield },
                    ].map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => handleCategoryClick(cat.key)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition",
                                    isSelected
                                        ? cat.alert
                                            ? "bg-rose-500 text-slate-950 font-bold shadow-glow-rose"
                                            : "bg-emerald-500 text-slate-950 font-bold shadow-glow-emerald"
                                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search and User Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                    <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by action, operator, IP, or entity details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                    </form>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedUserId}
                            onChange={(e) => {
                                setSelectedUserId(e.target.value);
                                applyFilters({ user_id: e.target.value });
                            }}
                            className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">All Staff Operators</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>

                        {(searchTerm || selectedCategory !== 'all' || selectedUserId) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    setSelectedUserId('');
                                    router.get('/audit-logs');
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 flex items-center gap-1 font-semibold"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* View 1: System Audit Logs Table */}
            {activeTab === 'audit' && (
                <div className="glass-panel rounded-3xl p-5 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Immutable Regulatory Event Trail
                        </h2>
                        <span className="text-[11px] text-slate-400">Showing {logs.length} logged events</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Operator (RBAC)</th>
                                    <th className="py-3 px-4">Action Event</th>
                                    <th className="py-3 px-4">Entity Type</th>
                                    <th className="py-3 px-4">Snapshot Preview</th>
                                    <th className="py-3 px-4">IP / Terminal</th>
                                    <th className="py-3 px-4 text-right">Inspect</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-500">
                                            No audit logs found matching the selected filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        const badge = getActionBadge(log.action);
                                        const ActionIcon = badge.icon;
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-800/30 transition group">
                                                <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                                    {formatDate(log.created_at)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-white flex items-center gap-1.5">
                                                        <span>{log.user?.name || 'System Operator'}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] font-semibold px-2 py-0.2 rounded border inline-block mt-0.5",
                                                        getRoleBadge(log.user?.role)
                                                    )}>
                                                        {log.user?.role?.replace('_', ' ') || 'System'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border inline-flex items-center gap-1",
                                                        badge.className
                                                    )}>
                                                        <ActionIcon className="w-3 h-3" />
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">
                                                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                                                    {JSON.stringify(log.new_values || log.old_values || {})}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                                    {log.ip_address || '127.0.0.1'}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => setInspectLog(log)}
                                                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 text-xs font-semibold inline-flex items-center gap-1 transition"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Diff</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View 2: Adjustments Table */}
            {activeTab === 'adjustments' && (
                <div className="glass-panel rounded-3xl p-5 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-amber-400" />
                            Inventory Stock Reconciliation & Damage Logs
                        </h2>
                        <span className="text-[11px] text-slate-400">Total adjustments logged: {adjustments.length}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="py-3 px-4">Adjustment #</th>
                                    <th className="py-3 px-4">Medicine Item</th>
                                    <th className="py-3 px-4">Batch Number</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Quantity Changed</th>
                                    <th className="py-3 px-4">Regulatory Reason</th>
                                    <th className="py-3 px-4">Operator</th>
                                    <th className="py-3 px-4">Logged Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                                {adjustments.map((adj) => (
                                    <tr key={adj.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                                            {adj.adjustment_number}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-white">
                                            {adj.medicine?.name}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-cyan-300">
                                            {adj.batch?.batch_number || 'General Stock'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                {adj.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-white">
                                            {adj.quantity} Units
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            {adj.reason}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-semibold text-white block">{adj.user?.name || 'Staff'}</span>
                                            <span className="text-[10px] text-amber-400 capitalize">{adj.user?.role?.replace('_', ' ') || 'Staff'}</span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                            {formatDate(adj.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Inspect Log Diff Modal */}
            {inspectLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-2xl p-6 border border-slate-700 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    Audit Event #{inspectLog.id} — {inspectLog.action}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                    Logged at {formatDate(inspectLog.created_at)} | IP: {inspectLog.ip_address || '127.0.0.1'}
                                </p>
                            </div>
                            <button onClick={() => setInspectLog(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Operator Details */}
                            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] text-slate-400 block font-medium">Authorizing Operator</span>
                                    <span className="text-sm font-bold text-white">{inspectLog.user?.name || 'System'}</span>
                                </div>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-bold border",
                                    getRoleBadge(inspectLog.user?.role)
                                )}>
                                    {inspectLog.user?.role?.replace('_', ' ').toUpperCase() || 'SYSTEM'}
                                </span>
                            </div>

                            {/* Diff View */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                    <span className="text-xs font-bold text-rose-400 mb-2 block flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Previous / Old State
                                    </span>
                                    <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-60 border border-slate-800/80">
                                        {inspectLog.old_values ? JSON.stringify(inspectLog.old_values, null, 2) : 'None (Initial Creation)'}
                                    </pre>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                    <span className="text-xs font-bold text-emerald-400 mb-2 block flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Updated / New State
                                    </span>
                                    <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-60 border border-slate-800/80">
                                        {inspectLog.new_values ? JSON.stringify(inspectLog.new_values, null, 2) : 'None (Deletion Event)'}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-800">
                                <button
                                    onClick={() => setInspectLog(null)}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Close Inspector
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
