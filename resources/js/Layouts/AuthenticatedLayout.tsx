import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    BookOpen,
    Boxes,
    Check,
    ChevronDown,
    FileText,
    FlaskConical,
    History,
    LayoutDashboard,
    LogOut,
    Menu,
    Receipt,
    Search,
    Settings as SettingsIcon,
    Shield,
    ShoppingCart,
    Sparkles,
    Truck,
    UserCircle,
    Users,
    X,
} from 'lucide-react';
import { PageProps } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/notify';
import Notifications from '@/Components/Notifications';
import { ThemeSegmented, ThemeToggleButton } from '@/Components/ThemeToggle';

type ModuleKey =
    | 'dashboard' | 'inventory' | 'pos' | 'invoices' | 'reports' | 'clinical-reference'
    | 'prescriptions' | 'ai-insights' | 'suppliers' | 'audit-logs' | 'users' | 'settings';

interface Props {
    header?: ReactNode;
    children: ReactNode;
    activeTab?: ModuleKey | 'profile';
    /** Desktop: make the page body fill the remaining viewport height (e.g. the POS). */
    fullHeight?: boolean;
}

interface NavItem {
    key: ModuleKey;
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    hint?: string;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
    {
        title: 'Overview',
        items: [{ key: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
        title: 'Sell',
        items: [
            { key: 'pos', label: 'Point of Sale', href: '/pos', icon: ShoppingCart, hint: 'F2' },
            { key: 'invoices', label: 'Invoices & Returns', href: '/invoices', icon: Receipt },
            { key: 'prescriptions', label: 'Prescriptions', href: '/prescriptions', icon: FileText },
        ],
    },
    {
        title: 'Stock',
        items: [
            { key: 'inventory', label: 'Inventory', href: '/inventory', icon: Boxes },
            { key: 'suppliers', label: 'Suppliers & Purchases', href: '/suppliers', icon: Truck },
        ],
    },
    {
        title: 'Insights',
        items: [
            { key: 'reports', label: 'Reports', href: '/reports', icon: BarChart3 },
            { key: 'ai-insights', label: 'AI Insights', href: '/ai-insights', icon: Sparkles },
            { key: 'clinical-reference', label: 'Medicine Guide', href: '/clinical-reference', icon: BookOpen },
        ],
    },
    {
        title: 'Admin',
        items: [
            { key: 'users', label: 'Staff & Roles', href: '/users', icon: Users },
            { key: 'audit-logs', label: 'Activity Log', href: '/audit-logs', icon: History },
            { key: 'settings', label: 'Settings', href: '/settings', icon: SettingsIcon },
        ],
    },
];

const ROLE_STYLE: Record<string, { label: string; text: string; badge: string }> = {
    super_admin: { label: 'Super Admin', text: 'text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
    pharmacist: { label: 'Pharmacist', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    cashier: { label: 'Cashier', text: 'text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    inventory_manager: { label: 'Inventory Manager', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
};

const DEMO_ROLES = [
    { key: 'super_admin', desc: 'Everything, incl. staff & settings' },
    { key: 'pharmacist', desc: 'Prescriptions, POS & AI checks' },
    { key: 'cashier', desc: 'Checkout & receipts' },
    { key: 'inventory_manager', desc: 'Stock, batches & suppliers' },
];

function initials(name?: string): string {
    if (!name) return '?';
    return name
        .replace(/^(Dr|Prof|Mr|Mrs|Ms)\.?\s+/i, '')
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

export function Avatar({ name, src, className }: { name?: string; src?: string | null; className?: string }) {
    const [failed, setFailed] = useState(false);
    if (src && !failed) {
        return <img src={src} alt="" onError={() => setFailed(true)} className={cn('rounded-full object-cover border border-slate-700 shrink-0', className)} />;
    }
    return (
        <span aria-hidden className={cn('rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 text-paper font-bold flex items-center justify-center shrink-0 text-xs', className)}>
            {initials(name)}
        </span>
    );
}

export default function AuthenticatedLayout({ header, children, activeTab, fullHeight = false }: Props) {
    const page = usePage<PageProps>();
    const { auth, flash, app_info } = page.props;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [switchingRole, setSwitchingRole] = useState(false);
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const role = auth.user?.role ?? 'cashier';
    const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.cashier;
    const can = (key: ModuleKey) => Boolean(auth.can?.[key]);
    const demoMode = Boolean(app_info?.demo_mode);

    // Server flash messages → toasts (once per visit).
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.info) toast.info(flash.info);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page.props]);

    // Global shortcuts: Ctrl/⌘+K focuses search, F2 opens the POS.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            } else if (e.key === 'F2' && activeTab !== 'pos' && can('pos')) {
                e.preventDefault();
                router.visit('/pos');
            } else if (e.key === 'Escape') {
                setUserMenuOpen(false);
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, auth.can]);

    // Close the user menu when clicking outside it.
    useEffect(() => {
        if (!userMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [userMenuOpen]);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const term = search.trim();
        if (!term) return;
        const target = can('inventory') ? '/inventory' : can('pos') ? '/pos' : can('clinical-reference') ? '/clinical-reference' : null;
        if (!target) return toast.info('Your role cannot search the medicine catalogue.');
        router.get(target, { search: term });
        setMobileMenuOpen(false);
    };

    const switchRole = (key: string) => {
        if (key === role || switchingRole) return;
        setSwitchingRole(true);
        router.post('/switch-role', { role: key }, {
            onFinish: () => {
                setSwitchingRole(false);
                setUserMenuOpen(false);
                setMobileMenuOpen(false);
            },
        });
    };

    const renderNavigation = (isMobile: boolean) => (
        <>
            {/* Brand */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
                <Link href={auth.user ? '/' : '/login'} className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-glow-emerald shrink-0">
                        <Activity className="w-6 h-6 text-paper" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-base tracking-tight text-white truncate">{app_info?.name || 'PharmaCare'}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">Pharmacy Management</p>
                    </div>
                </Link>
                {isMobile && (
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Mobile search */}
            {isMobile && (
                <form onSubmit={submitSearch} className="px-3 pt-3" role="search">
                    <label htmlFor="mobile-search" className="sr-only">Search medicines</label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            id="mobile-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search medicines…"
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </form>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 overflow-y-auto" aria-label="Main">
                {NAV_GROUPS.map((group) => {
                    const items = group.items.filter((i) => can(i.key));
                    if (!items.length) return null;
                    return (
                        <div key={group.title} className="mb-3">
                            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.title}</p>
                            <div className="space-y-0.5">
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.key;
                                    return (
                                        <Link
                                            key={item.key}
                                            href={item.href}
                                            aria-current={isActive ? 'page' : undefined}
                                            onClick={() => isMobile && setMobileMenuOpen(false)}
                                            className={cn(
                                                'flex items-center justify-between gap-2 px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition-colors group',
                                                isActive
                                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                    : 'text-slate-300 border border-transparent hover:text-white hover:bg-slate-800/60',
                                            )}
                                        >
                                            <span className="flex items-center gap-3 min-w-0">
                                                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400')} />
                                                <span className="truncate">{item.label}</span>
                                            </span>
                                            {item.hint && (
                                                <kbd className="hidden lg:inline text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                                    {item.hint}
                                                </kbd>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {demoMode && (
                <div className="mx-3 mb-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                    <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5" /> Live demo
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">Data resets automatically. Switch roles from your profile menu.</p>
                </div>
            )}

            {/* User menu */}
            <div className="p-3 border-t border-slate-800/80 relative" ref={userMenuRef}>
                <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition text-left"
                >
                    <span className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={auth.user?.name} src={auth.user?.avatar} className="w-9 h-9" />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-white truncate">{auth.user?.name}</span>
                            <span className={cn('block text-xs font-semibold truncate', roleStyle.text)}>{roleStyle.label}</span>
                        </span>
                    </span>
                    <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                    <div role="menu" className="absolute bottom-[4.25rem] left-3 right-3 bg-panel border border-slate-700/80 rounded-2xl shadow-glass p-2 z-50 space-y-2 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-0.5 pb-2 border-b border-slate-800">
                            <Link
                                href="/profile"
                                role="menuitem"
                                onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); }}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                                <UserCircle className="w-4 h-4 text-emerald-400" /> My profile & password
                            </Link>
                        </div>

                        <div className="px-1 pb-2 border-b border-slate-800">
                            <p className="px-1.5 pb-1.5 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Appearance</p>
                            <ThemeSegmented />
                        </div>

                        {demoMode && (
                            <div className="pb-2 border-b border-slate-800">
                                <p className="px-2.5 pb-1 text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3 h-3 text-cyan-400" /> View demo as
                                </p>
                                {DEMO_ROLES.map((r) => {
                                    const selected = role === r.key;
                                    return (
                                        <button
                                            key={r.key}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={selected}
                                            disabled={switchingRole}
                                            onClick={() => switchRole(r.key)}
                                            className={cn(
                                                'w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between',
                                                selected ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                                            )}
                                        >
                                            <span>
                                                <span className="block text-sm font-semibold">{ROLE_STYLE[r.key].label}</span>
                                                <span className="block text-xs text-slate-400">{r.desc}</span>
                                            </span>
                                            {selected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => router.post('/logout')}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                        >
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="h-[100dvh] bg-deep text-slate-100 flex flex-col font-sans">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[300] focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-emerald-500 focus:text-ink">
                Skip to content
            </a>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop sidebar */}
                <aside className="hidden lg:flex w-64 bg-panel/90 border-r border-slate-800/80 flex-col shrink-0">
                    {renderNavigation(false)}
                </aside>

                {/* Mobile drawer */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation">
                        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
                        <div className="relative flex flex-col w-72 max-w-[85vw] bg-panel border-r border-slate-800 shadow-2xl z-50 h-full">
                            {renderNavigation(true)}
                        </div>
                    </div>
                )}

                {/* Main column */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="h-16 bg-panel/80 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between gap-2 z-10 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                                aria-label="Open menu"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <form onSubmit={submitSearch} role="search" className="relative w-full min-w-0 hidden sm:block">
                                <label htmlFor="global-search" className="sr-only">Search medicines</label>
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    id="global-search"
                                    ref={searchRef}
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search medicines by name, generic or barcode…"
                                    className="w-full pl-9 pr-16 py-2 text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                />
                                <kbd className="hidden md:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">Ctrl K</kbd>
                            </form>

                            <span className="sm:hidden font-bold text-white truncate">{app_info?.name || 'PharmaCare'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            <span className={cn('hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border', roleStyle.badge)}>
                                <Shield className="w-3.5 h-3.5 shrink-0" />
                                {roleStyle.label}
                            </span>

                            <ThemeToggleButton />

                            {can('pos') && activeTab !== 'pos' && (
                                <Link
                                    href="/pos"
                                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-ink font-bold text-sm rounded-xl shadow-glow-emerald transition"
                                >
                                    <ShoppingCart className="w-4 h-4 text-ink shrink-0" />
                                    <span className="hidden sm:inline">New sale</span>
                                    <span className="sm:hidden">POS</span>
                                </Link>
                            )}
                        </div>
                    </header>

                    {demoMode && (
                        <div className="lg:hidden bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
                            <FlaskConical className="w-3.5 h-3.5 shrink-0" /> Live demo — data resets automatically.
                        </div>
                    )}

                    <main
                        id="main"
                        tabIndex={-1}
                        className={cn('flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 focus:outline-none', fullHeight && 'lg:flex lg:flex-col')}
                    >
                        {header && <div className={cn('mb-4 sm:mb-6', fullHeight && 'shrink-0 lg:mb-4')}>{header}</div>}
                        {fullHeight ? <div className="lg:flex-1 lg:min-h-0">{children}</div> : children}
                    </main>
                </div>
            </div>

            <Notifications />
        </div>
    );
}
