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
    User,
    FileCode,
    Filter
} from 'lucide-react';
import { AuditLog, StockAdjustment } from '@/types';
import { formatDate, cn } from '@/lib/utils';

interface Props {
    logs: AuditLog[];
    adjustments: StockAdjustment[];
    filters: {
        action?: string;
        entity_type?: string;
    };
}

export default function AuditLogsIndex({ logs, adjustments, filters }: Props) {
    const [activeTab, setActiveTab] = useState<'audit' | 'adjustments'>('audit');
    const [selectedAction, setSelectedAction] = useState(filters.action || '');
    const [selectedEntity, setSelectedEntity] = useState(filters.entity_type || '');

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        router.get('/audit-logs', {
            action: selectedAction,
            entity_type: selectedEntity,
            ...newFilters,
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            activeTab="audit-logs"
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                            Regulatory Compliance & Audit Trails
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                Tamper-Evident
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Comprehensive regulatory logging of all clinical dispensations, stock adjustments, and narcotic tracking
                        </p>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                                activeTab === 'audit' ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                            )}
                        >
                            System Audit Logs ({logs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('adjustments')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                                activeTab === 'adjustments' ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                            )}
                        >
                            Stock Adjustments ({adjustments.length})
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Regulatory Audit Logs & Compliance" />

            {/* Audit Logs Table */}
            {activeTab === 'audit' && (
                <div className="glass-panel rounded-3xl p-5 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Security & Transaction Event Trail
                        </h2>
                        <span className="text-[11px] text-slate-400">Strictly immutable database ledger</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Operator / User</th>
                                    <th className="py-3 px-4">Action Event</th>
                                    <th className="py-3 px-4">Entity Type</th>
                                    <th className="py-3 px-4">Payload Snapshot</th>
                                    <th className="py-3 px-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-white block">{log.user?.name || 'System Operator'}</span>
                                            <span className="text-[10px] text-emerald-400">{log.user?.role || 'System'}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 font-semibold">
                                            {log.entity_type} #{log.entity_id || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                                            {JSON.stringify(log.new_values || log.old_values || {})}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 font-mono">
                                            {log.ip_address || '127.0.0.1'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Adjustments Table */}
            {activeTab === 'adjustments' && (
                <div className="glass-panel rounded-3xl p-5 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-amber-400" />
                            Inventory Stock Reconciliation Trail
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                    <th className="py-3 px-4">Adjustment #</th>
                                    <th className="py-3 px-4">Medicine Item</th>
                                    <th className="py-3 px-4">Batch Number</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Qty</th>
                                    <th className="py-3 px-4">Regulatory Reason</th>
                                    <th className="py-3 px-4">Operator</th>
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
                                            {adj.batch?.batch_number || 'General'}
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
                                        <td className="py-3 px-4 text-slate-400">
                                            {adj.user?.name || 'Staff'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
