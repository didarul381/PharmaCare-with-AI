import React, { useState, ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Boxes,
    ShoppingCart,
    FileText,
    Sparkles,
    Truck,
    History,
    Bell,
    Search,
    ShieldCheck,
    Cpu,
    ChevronDown,
    LogOut,
    UserCircle,
    Activity,
    AlertTriangle,
    CheckCircle2,
    Settings as SettingsIcon
} from 'lucide-react';
import { PageProps } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
    header?: ReactNode;
    children: ReactNode;
    activeTab?: 'dashboard' | 'inventory' | 'pos' | 'prescriptions' | 'ai-insights' | 'suppliers' | 'audit-logs' | 'settings';
}

export default function AuthenticatedLayout({ header, children, activeTab }: Props) {
    const { auth, flash, app_info } = usePage<PageProps>().props;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [alertDismissed, setAlertDismissed] = useState(false);

    const navItems = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            href: '/',
            icon: LayoutDashboard,
        },
        {
            key: 'inventory',
            label: 'Inventory',
            href: '/inventory',
            icon: Boxes,
        },
        {
            key: 'pos',
            label: 'POS Terminal',
            href: '/pos',
            icon: ShoppingCart,
            badge: 'FEFO',
        },
        {
            key: 'prescriptions',
            label: 'Prescriptions',
            href: '/prescriptions',
            icon: FileText,
            badge: 'AI Scan',
        },
        {
            key: 'ai-insights',
            label: 'AI Intelligence',
            href: '/ai-insights',
            icon: Sparkles,
            highlight: true,
        },
        {
            key: 'suppliers',
            label: 'Suppliers & PO',
            href: '/suppliers',
            icon: Truck,
        },
        {
            key: 'audit-logs',
            label: 'Audit & Compliance',
            href: '/audit-logs',
            icon: History,
        },
        {
            key: 'settings',
            label: 'Settings',
            href: '/settings',
            icon: SettingsIcon,
        },
    ];

    return (
        <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            {/* Flash Notifications */}
            {flash?.success && !alertDismissed && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between text-emerald-400 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                    <button onClick={() => setAlertDismissed(true)} className="text-xs hover:text-emerald-200">Dismiss</button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Modern Sidebar */}
                <aside className="w-64 bg-[#0d1322]/90 border-r border-slate-800/80 flex flex-col shrink-0">
                    {/* Brand Header */}
                    <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-glow-emerald">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-base tracking-tight text-white font-sans">PharmaCare</span>
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">AI</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">Enterprise Rx Engine</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Core Modules
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.key;
                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                                        isActive
                                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm"
                                            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={cn(
                                            "w-4 h-4 transition-colors",
                                            isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-400"
                                        )} />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                            isActive ? "bg-emerald-500/30 text-emerald-300" : "bg-slate-800 text-slate-400"
                                        )}>
                                            {item.badge}
                                        </span>
                                    )}
                                    {item.highlight && (
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* AI Engine Status Card */}
                    <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 shadow-inner">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                AI Clinical Shield
                            </span>
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 pulse-emerald" />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            FEFO Auto-Allocation & DDI Safety Active.
                        </p>
                    </div>

                    {/* User Profile Footer */}
                    <div className="p-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition">
                            <img
                                src={auth.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                alt={auth.user?.name || "Staff"}
                                className="w-9 h-9 rounded-full object-cover border border-emerald-500/30"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{auth.user?.name || "Staff User"}</p>
                                <p className="text-[10px] text-emerald-400 font-medium capitalize truncate">
                                    {auth.user?.role?.replace('_', ' ') || "Pharmacist"}
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#070b13]">
                    {/* Top Header Bar */}
                    <header className="h-16 bg-[#0d1322]/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-10 shrink-0">
                        <div className="flex items-center gap-4 flex-1 max-w-xl">
                            <div className="relative w-full">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search medicine (SKU, Generic, Barcode, Brand)... (Ctrl + K)"
                                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                />
                            </div>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-full text-[11px] font-medium text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>FDA/DGDA Compliant</span>
                            </div>

                            <Link
                                href="/pos"
                                className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-glow-emerald transition-all transform hover:scale-[1.02]"
                            >
                                <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
                                <span>Quick POS (F2)</span>
                            </Link>
                        </div>
                    </header>

                    {/* Dynamic View Body */}
                    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#070b13] via-[#090e1a] to-[#070b13]">
                        {header && (
                            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                {header}
                            </div>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
