import React, { useState, ReactNode } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Boxes,
    ShoppingCart,
    Receipt,
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
    Settings as SettingsIcon,
    Shield,
    Users,
    Check,
    BarChart3,
    BookOpen,
    Menu,
    X
} from 'lucide-react';
import { PageProps } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
    header?: ReactNode;
    children: ReactNode;
    activeTab?: 'dashboard' | 'inventory' | 'pos' | 'invoices' | 'reports' | 'clinical-reference' | 'prescriptions' | 'ai-insights' | 'suppliers' | 'audit-logs' | 'settings';
}

export default function AuthenticatedLayout({ header, children, activeTab }: Props) {
    const { auth, flash, app_info } = usePage<PageProps>().props;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [switchingRole, setSwitchingRole] = useState(false);

    const currentUserRole = auth.user?.role || 'pharmacist';

    // Role display configurations
    const roleConfig: Record<string, { label: string; color: string; badgeBg: string; border: string }> = {
        super_admin: {
            label: 'Super Admin',
            color: 'text-purple-400',
            badgeBg: 'bg-purple-500/20 text-purple-300',
            border: 'border-purple-500/30',
        },
        pharmacist: {
            label: 'Lead Pharmacist',
            color: 'text-emerald-400',
            badgeBg: 'bg-emerald-500/20 text-emerald-300',
            border: 'border-emerald-500/30',
        },
        cashier: {
            label: 'Senior Cashier',
            color: 'text-cyan-400',
            badgeBg: 'bg-cyan-500/20 text-cyan-300',
            border: 'border-cyan-500/30',
        },
        inventory_manager: {
            label: 'Inventory Manager',
            color: 'text-amber-400',
            badgeBg: 'bg-amber-500/20 text-amber-300',
            border: 'border-amber-500/30',
        },
    };

    const handleSwitchRole = (role: string) => {
        if (role === currentUserRole || switchingRole) return;
        setSwitchingRole(true);
        router.post('/switch-role', { role }, {
            preserveScroll: true,
            onFinish: () => {
                setSwitchingRole(false);
                setUserMenuOpen(false);
                setMobileMenuOpen(false);
            }
        });
    };

    // RBAC module access check
    const canAccess = (key: string): boolean => {
        if (currentUserRole === 'super_admin') return true;

        switch (key) {
            case 'dashboard':
                return true;
            case 'pos':
            case 'invoices':
            case 'clinical-reference':
                return ['pharmacist', 'cashier'].includes(currentUserRole);
            case 'reports':
                return ['pharmacist', 'inventory_manager'].includes(currentUserRole);
            case 'prescriptions':
            case 'ai-insights':
                return ['pharmacist'].includes(currentUserRole);
            case 'inventory':
            case 'suppliers':
                return ['inventory_manager', 'pharmacist'].includes(currentUserRole);
            case 'audit-logs':
                return ['pharmacist', 'inventory_manager'].includes(currentUserRole);
            case 'users':
            case 'settings':
                return false;
            default:
                return false;
        }
    };

    const allNavItems = [
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
            key: 'invoices',
            label: 'Invoices',
            href: '/invoices',
            icon: Receipt,
        },
        {
            key: 'reports',
            label: 'Reports',
            href: '/reports',
            icon: BarChart3,
        },
        {
            key: 'clinical-reference',
            label: 'Clinical Reference',
            href: '/clinical-reference',
            icon: BookOpen,
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
            key: 'users',
            label: 'Staff & Roles',
            href: '/users',
            icon: Users,
        },
        {
            key: 'settings',
            label: 'Settings',
            href: '/settings',
            icon: SettingsIcon,
        },
    ];

    const visibleNavItems = allNavItems.filter(item => canAccess(item.key));

    const renderNavigationContent = (isMobile = false) => (
        <>
            {/* Brand Header */}
            <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
                <div className="flex items-center gap-3">
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
                {isMobile && (
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                <div className="px-3 pb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Core Modules
                    </span>
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        roleConfig[currentUserRole]?.badgeBg || "bg-slate-800 text-slate-400",
                        roleConfig[currentUserRole]?.border || "border-slate-700"
                    )}>
                        {roleConfig[currentUserRole]?.label || currentUserRole}
                    </span>
                </div>

                {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => isMobile && setMobileMenuOpen(false)}
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
                    RBAC & FEFO Auto-Audit Active.
                </p>
            </div>

            {/* Role Switcher & User Profile Footer */}
            <div className="p-3 border-t border-slate-800/80 relative">
                <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition text-left group"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <img
                            src={auth.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                            alt={auth.user?.name || "Staff"}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{auth.user?.name || "Staff User"}</p>
                            <p className={cn("text-[10px] font-semibold truncate", roleConfig[currentUserRole]?.color || "text-emerald-400")}>
                                {roleConfig[currentUserRole]?.label || currentUserRole}
                            </p>
                        </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", userMenuOpen && "rotate-180")} />
                </button>

                {/* Role Switcher & User Actions Popover */}
                {userMenuOpen && (
                    <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 space-y-2">
                        {/* Navigation Shortcut Links */}
                        <div className="space-y-1 pb-1.5 border-b border-slate-800">
                            <Link
                                href="/profile"
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    if (isMobile) setMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                            >
                                <UserCircle className="w-4 h-4 text-emerald-400" />
                                <span>Edit My Profile & Security</span>
                            </Link>

                            {currentUserRole === 'super_admin' && (
                                <Link
                                    href="/users"
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        if (isMobile) setMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                                >
                                    <Users className="w-4 h-4 text-purple-400" />
                                    <span>Manage Staff & Roles</span>
                                </Link>
                            )}
                        </div>

                        {/* Active Role Switcher */}
                        <div>
                            <div className="px-2 py-1 mb-1 flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3 h-3 text-cyan-400" />
                                    Active Role (RBAC Demo)
                                </span>
                            </div>
                            <div className="space-y-1">
                                {[
                                    { key: 'super_admin', label: 'Super Admin', desc: 'Unrestricted Full Control' },
                                    { key: 'pharmacist', label: 'Lead Pharmacist', desc: 'Rx, DDI & Controlled' },
                                    { key: 'cashier', label: 'Senior Cashier', desc: 'POS Checkout & Receipts' },
                                    { key: 'inventory_manager', label: 'Inventory Manager', desc: 'FEFO & Stock Reconciliation' },
                                ].map((r) => {
                                    const isSelected = currentUserRole === r.key;
                                    return (
                                        <button
                                            key={r.key}
                                            disabled={switchingRole}
                                            onClick={() => handleSwitchRole(r.key)}
                                            className={cn(
                                                "w-full text-left px-2.5 py-1.5 rounded-xl transition flex items-center justify-between text-xs",
                                                isSelected
                                                    ? "bg-slate-800 text-white font-bold border border-slate-700"
                                                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                                            )}
                                        >
                                            <div>
                                                <p className="font-semibold">{r.label}</p>
                                                <p className="text-[10px] text-slate-400">{r.desc}</p>
                                            </div>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Logout Action */}
                        <div className="pt-1.5 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => router.post('/logout')}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out of Station</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
            {/* Flash Notifications */}
            {flash?.success && !alertDismissed && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 sm:px-6 py-2.5 flex items-center justify-between text-emerald-400 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{flash.success}</span>
                    </div>
                    <button onClick={() => setAlertDismissed(true)} className="text-xs hover:text-emerald-200 shrink-0 ml-2">Dismiss</button>
                </div>
            )}
            {flash?.error && (
                <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 sm:px-6 py-2.5 flex items-center justify-between text-rose-400 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="truncate">{flash.error}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar (visible on lg+) */}
                <aside className="hidden lg:flex w-64 bg-[#0d1322]/90 border-r border-slate-800/80 flex-col shrink-0">
                    {renderNavigationContent(false)}
                </aside>

                {/* Mobile Drawer (visible on < lg when mobileMenuOpen is true) */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                        {/* Drawer Panel */}
                        <div className="relative flex flex-col w-72 max-w-[85vw] bg-[#0d1322] border-r border-slate-800 shadow-2xl z-50 h-full">
                            {renderNavigationContent(true)}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070b13]">
                    {/* Top Header Bar */}
                    <header className="h-16 bg-[#0d1322]/80 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between gap-2 z-10 shrink-0">
                        {/* Left Section: Mobile Menu Toggle & Search Bar */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
                            {/* Mobile Hamburger Button */}
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                                aria-label="Open navigation menu"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <div className="relative w-full min-w-0">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search medicine (SKU, Generic, Brand)..."
                                    className="w-full pl-8 sm:pl-9 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition truncate"
                                />
                            </div>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            {/* Active Role Pill */}
                            <div className={cn(
                                "hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border",
                                roleConfig[currentUserRole]?.badgeBg || "bg-slate-800 text-slate-300",
                                roleConfig[currentUserRole]?.border || "border-slate-700"
                            )}>
                                <Shield className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden md:inline">{roleConfig[currentUserRole]?.label || currentUserRole}</span>
                                <span className="md:hidden capitalize">{currentUserRole.replace('_', ' ')}</span>
                            </div>

                            {/* Compliance Badge */}
                            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-full text-[11px] font-medium text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                <span>FDA/DGDA Compliant</span>
                            </div>

                            {canAccess('pos') && (
                                <Link
                                    href="/pos"
                                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-glow-emerald transition-all transform hover:scale-[1.02]"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                                    <span className="hidden sm:inline">Quick POS (F2)</span>
                                    <span className="sm:hidden">POS</span>
                                </Link>
                            )}
                        </div>
                    </header>

                    {/* Dynamic View Body */}
                    <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-b from-[#070b13] via-[#090e1a] to-[#070b13]">
                        {header && (
                            <div className="mb-4 sm:mb-6">
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
