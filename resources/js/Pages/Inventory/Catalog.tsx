import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, Database, Library, LoaderCircle, PackagePlus, RefreshCw, Search, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cn, formatDate } from '@/lib/utils';
import { confirmDialog, toast } from '@/lib/notify';

interface CatalogItem {
    code: string;
    dar_number: string | null;
    name: string;
    trade_name: string;
    generic: string | null;
    strength: string | null;
    dosage_form: string | null;
    company: string | null;
    in_inventory: boolean;
}

interface Pagination {
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_url: string | null;
    next_url: string | null;
}

interface Filters {
    search: string | null;
    company: string | null;
    form: string | null;
    status: 'all' | 'new' | 'added';
}

interface Props {
    items: CatalogItem[];
    pagination: Pagination;
    filters: Filters;
    options: { companies: string[]; forms: string[] };
    stats: { total: number; in_inventory: number; last_synced_at: string | null };
    max_bulk_add: number;
}

const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

export default function Catalog({ items, pagination, filters, options, stats, max_bulk_add }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);
    const [sync, setSync] = useState<{ page: number; pages: number } | null>(null);

    const selectable = useMemo(() => items.filter((i) => !i.in_inventory), [items]);
    const allOnPageSelected = selectable.length > 0 && selectable.every((i) => selected.has(i.code));
    const hasFilters = Boolean(filters.search || filters.company || filters.form || filters.status !== 'all');

    const applyFilters = (patch: Partial<Filters>) => {
        router.get('/inventory/catalog', { ...filters, search: search || null, ...patch }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const toggle = (code: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(code) ? next.delete(code) : next.add(code);
            return next;
        });

    const togglePage = () =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) selectable.forEach((i) => next.delete(i.code));
            else selectable.forEach((i) => next.add(i.code));
            return next;
        });

    const addSelected = (codes: string[]) => {
        if (!codes.length) return;
        setAdding(true);
        router.post('/inventory/catalog/add', { codes }, {
            preserveScroll: true,
            onSuccess: () => setSelected(new Set()),
            onFinish: () => setAdding(false),
        });
    };

    const addAllMatching = async () => {
        const count = Math.min(pagination.total, max_bulk_add);
        const ok = await confirmDialog({
            title: `Add ${count.toLocaleString()} medicines?`,
            message:
                (pagination.total > max_bulk_add ? `Only the first ${max_bulk_add.toLocaleString()} matches are added per click. ` : '') +
                'Medicines already in your inventory are skipped. They start with no stock — add batches to sell them.',
            confirmLabel: 'Add to inventory',
        });
        if (!ok) return;
        setAdding(true);
        router.post('/inventory/catalog/add', { all_matching: true, ...filters, search: search || null }, {
            preserveScroll: true,
            onSuccess: () => setSelected(new Set()),
            onFinish: () => setAdding(false),
        });
    };

    const runSync = async () => {
        if (sync) return;
        let page = 1;
        let pages = 1;
        setSync({ page: 0, pages: 1 });
        try {
            while (page <= pages) {
                const res = await fetch('/inventory/catalog/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
                    body: JSON.stringify({ page }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.success) throw new Error(data.message || `Server error (${res.status})`);
                pages = data.pages;
                setSync({ page, pages });
                page++;
            }
            toast.success('The medicine catalogue is up to date.');
        } catch (e: any) {
            toast.error(`${e.message} Downloaded pages are kept — try again to continue.`, 'Catalogue download stopped');
        } finally {
            setSync(null);
            router.reload();
        }
    };

    const syncPercent = sync && sync.pages ? Math.round((sync.page / sync.pages) * 100) : 0;

    return (
        <AuthenticatedLayout
            activeTab="inventory"
            header={
                <div className="flex flex-col lg:flex-row lg:items-end justify-between w-full gap-3">
                    <div>
                        <Link href="/inventory" className="text-sm text-slate-400 hover:text-emerald-300 inline-flex items-center gap-1 mb-1">
                            <ArrowLeft className="w-4 h-4" /> Inventory
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Medicine catalogue</h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {stats.total > 0
                                ? `${stats.total.toLocaleString()} medicines registered with DGDA, Bangladesh. Pick the ones you sell and add them in one go.`
                                : 'Every medicine registered with DGDA, Bangladesh — add the ones you sell instead of typing them.'}
                        </p>
                    </div>
                    {stats.total > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">
                                In your inventory: <strong className="text-emerald-400">{stats.in_inventory.toLocaleString()}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={runSync}
                                disabled={!!sync}
                                className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold flex items-center gap-1.5 disabled:opacity-60"
                                title={stats.last_synced_at ? `Last updated ${formatDate(stats.last_synced_at)}` : undefined}
                            >
                                <RefreshCw className={cn('w-4 h-4', sync && 'animate-spin')} /> Update list
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Medicine catalogue" />

            {sync && (
                <div className="glass-panel rounded-2xl border border-emerald-500/30 p-4 mb-4" role="status" aria-live="polite">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-white flex items-center gap-2">
                            <LoaderCircle className="w-4 h-4 animate-spin text-emerald-400" /> Downloading the DGDA medicine list…
                        </span>
                        <span className="text-slate-400 tabular-nums">{syncPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${syncPercent}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">About 5 minutes. Keep this page open — you can keep using other tabs.</p>
                </div>
            )}

            {stats.total === 0 ? (
                <section className="glass-panel rounded-2xl border border-slate-800/80 p-8 sm:p-12 text-center max-w-2xl mx-auto">
                    <Database className="w-12 h-12 mx-auto text-emerald-400" />
                    <h2 className="mt-4 text-xl font-bold text-white">Download the national medicine list</h2>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                        About 39,000 medicines registered with the Directorate General of Drug Administration — brand, generic, strength,
                        dosage form and company. It's downloaded once from the government's public server and refreshed monthly.
                    </p>
                    <button
                        type="button"
                        onClick={runSync}
                        disabled={!!sync}
                        className="mt-6 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-ink inline-flex items-center gap-2 disabled:opacity-60"
                    >
                        {sync ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Library className="w-4 h-4" />}
                        {sync ? 'Downloading…' : 'Download now'}
                    </button>
                    <p className="mt-3 text-xs text-slate-500">
                        Server admins can also run <code className="font-mono text-slate-400">php artisan pharmacare:sync-dgda</code>.
                    </p>
                </section>
            ) : (
                <>
                    {/* Filters */}
                    <div className="glass-panel rounded-2xl p-3 sm:p-4 mb-4 border border-slate-800/80 flex flex-col lg:flex-row gap-2">
                        <form
                            className="relative flex-1 min-w-0"
                            role="search"
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilters({ search: search || null });
                            }}
                        >
                            <label htmlFor="catalog-search" className="sr-only">Search the catalogue</label>
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                id="catalog-search"
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Brand, generic or DAR number — e.g. Napa, Omeprazole…"
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </form>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:w-[620px]">
                            <select
                                aria-label="Company"
                                value={filters.company ?? ''}
                                onChange={(e) => applyFilters({ company: e.target.value || null })}
                                className="text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">All companies</option>
                                {options.companies.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select
                                aria-label="Dosage form"
                                value={filters.form ?? ''}
                                onChange={(e) => applyFilters({ form: e.target.value || null })}
                                className="text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">All forms</option>
                                {options.forms.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <select
                                aria-label="Status"
                                value={filters.status}
                                onChange={(e) => applyFilters({ status: e.target.value as Filters['status'] })}
                                className="text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="all">All medicines</option>
                                <option value="new">Not in my inventory</option>
                                <option value="added">Already in my inventory</option>
                            </select>
                        </div>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    router.get('/inventory/catalog', {}, { preserveState: true });
                                }}
                                className="px-3 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1"
                            >
                                <X className="w-4 h-4" /> Clear
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <section className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden" aria-label="Catalogue results">
                        <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allOnPageSelected}
                                    disabled={selectable.length === 0}
                                    onChange={togglePage}
                                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                Select page
                            </label>
                            <span className="text-sm text-slate-400">
                                {pagination.total > 0
                                    ? `${pagination.from?.toLocaleString()}–${pagination.to?.toLocaleString()} of ${pagination.total.toLocaleString()}`
                                    : 'No matches'}
                            </span>
                            {hasFilters && pagination.total > 0 && filters.status !== 'added' && (
                                <button
                                    type="button"
                                    onClick={addAllMatching}
                                    disabled={adding}
                                    className="px-3 py-1.5 rounded-xl text-sm font-semibold text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/10 disabled:opacity-60"
                                >
                                    Add all {Math.min(pagination.total, max_bulk_add).toLocaleString()} matches
                                </button>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <p className="p-10 text-center text-sm text-slate-400">No medicines match. Try another spelling or remove a filter.</p>
                        ) : (
                            <ul className="divide-y divide-slate-800/60">
                                {items.map((item) => {
                                    const checked = selected.has(item.code);
                                    return (
                                        <li
                                            key={item.code}
                                            className={cn('px-4 py-3 flex items-start sm:items-center gap-3', checked && 'bg-emerald-500/5')}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked || item.in_inventory}
                                                disabled={item.in_inventory}
                                                onChange={() => toggle(item.code)}
                                                aria-label={`Select ${item.name}`}
                                                className="mt-1 sm:mt-0 w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 disabled:opacity-40"
                                            />
                                            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-0.5">
                                                <div className="sm:col-span-4 min-w-0">
                                                    <p className="font-semibold text-white truncate" title={item.name}>{item.name}</p>
                                                    <p className="text-sm text-slate-400 truncate" title={item.generic ?? ''}>
                                                        {item.generic || '—'}
                                                        {item.strength && !item.name.includes(item.strength) ? ` · ${item.strength}` : ''}
                                                    </p>
                                                </div>
                                                <p className="sm:col-span-2 text-sm text-slate-300 truncate">{item.dosage_form}</p>
                                                <p className="sm:col-span-4 text-sm text-slate-400 truncate" title={item.company ?? ''}>{item.company}</p>
                                                <p className="sm:col-span-2 text-xs font-mono text-slate-500 truncate sm:text-right" title="DAR number">{item.dar_number}</p>
                                            </div>
                                            <div className="shrink-0 w-[92px] flex justify-end">
                                                {item.in_inventory ? (
                                                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                                        <Check className="w-4 h-4" /> Added
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => addSelected([item.code])}
                                                        disabled={adding}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-emerald-500 hover:text-ink text-emerald-300 border border-slate-700 transition disabled:opacity-50"
                                                    >
                                                        + Add
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {pagination.last_page > 1 && (
                            <nav className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-3" aria-label="Catalogue pages">
                                <button
                                    type="button"
                                    disabled={!pagination.prev_url}
                                    onClick={() => pagination.prev_url && router.visit(pagination.prev_url, { preserveState: true })}
                                    className="min-h-[40px] px-4 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    ← Previous
                                </button>
                                <span className="text-sm text-slate-400">Page {pagination.current_page} of {pagination.last_page.toLocaleString()}</span>
                                <button
                                    type="button"
                                    disabled={!pagination.next_url}
                                    onClick={() => pagination.next_url && router.visit(pagination.next_url, { preserveState: true })}
                                    className="min-h-[40px] px-4 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    Next →
                                </button>
                            </nav>
                        )}
                    </section>

                    <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                        Source: Directorate General of Drug Administration (DGDA), Government of Bangladesh — published on the DGHS national
                        terminology server. Prices are not part of the registry; you set them when you add stock.
                        {stats.last_synced_at && ` Last updated ${formatDate(stats.last_synced_at)}.`}
                    </p>

                    {/* Selection bar */}
                    {selected.size > 0 && (
                        <div className="sticky bottom-3 mt-4 z-20">
                            <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/40 bg-panel shadow-glass px-4 py-3 flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-white">{selected.size} selected</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelected(new Set())}
                                        className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addSelected([...selected])}
                                        disabled={adding}
                                        className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-ink flex items-center gap-1.5 disabled:opacity-60"
                                    >
                                        {adding ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
                                        Add to inventory
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AuthenticatedLayout>
    );
}
