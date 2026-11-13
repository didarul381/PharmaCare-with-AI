import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MedicineOption {
    id: number | string;
    name: string;
    sku?: string | null;
}

interface Props {
    options: MedicineOption[];
    value: string;
    onChange: (id: string) => void;
    required?: boolean;
    placeholder?: string;
    id?: string;
    'aria-label'?: string;
    className?: string;
}

const MAX_RESULTS = 50;

/**
 * Searchable medicine picker (combobox). Type part of a name or SKU, pick with
 * the mouse or ↑ ↓ Enter. Handles thousands of medicines without a giant <select>.
 * The list is rendered in a portal so modals with scrolling bodies never clip it.
 */
export default function MedicinePicker({
    options,
    value,
    onChange,
    required,
    placeholder = 'Type to search medicines…',
    id,
    className,
    ...rest
}: Props) {
    const autoId = useId();
    const inputId = id ?? `medicine-picker-${autoId}`;
    const listId = `${inputId}-list`;

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const selected = useMemo(() => options.find((o) => String(o.id) === String(value)) ?? null, [options, value]);

    // Every typed word must appear in the name or SKU; names starting with the query come first.
    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options.slice(0, MAX_RESULTS);
        const words = q.split(/\s+/);
        const hits = options.filter((o) => {
            const hay = `${o.name} ${o.sku ?? ''}`.toLowerCase();
            return words.every((w) => hay.includes(w));
        });
        hits.sort((a, b) => Number(!a.name.toLowerCase().startsWith(q)) - Number(!b.name.toLowerCase().startsWith(q)));
        return hits;
    }, [options, query]);
    const shown = matches.slice(0, MAX_RESULTS);

    // Block form submit until a medicine is actually chosen (typed text alone doesn't count).
    useEffect(() => {
        inputRef.current?.setCustomValidity(required && !selected ? 'Choose a medicine from the list.' : '');
    }, [required, selected]);

    // Keep the floating list attached to the input while the page or modal scrolls.
    useLayoutEffect(() => {
        if (!open) return;
        const place = () => inputRef.current && setRect(inputRef.current.getBoundingClientRect());
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => {
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
    }, [open]);

    useEffect(() => {
        listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const choose = (opt: MedicineOption) => {
        onChange(String(opt.id));
        setQuery('');
        setOpen(false);
    };

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) setOpen(true);
            setActive((i) => Math.min(i + 1, Math.max(shown.length - 1, 0)));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            if (open && shown[active]) {
                e.preventDefault(); // pick, don't submit the form
                choose(shown[active]);
            }
        } else if (e.key === 'Escape') {
            if (open) {
                e.preventDefault();
                e.stopPropagation(); // don't close the surrounding modal
                close();
            }
        } else if (e.key === 'Tab') {
            close();
        }
    };

    // Show the chosen name when idle; the typed text while searching.
    const display = open ? query : selected?.name ?? '';
    const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
    const dropUp = rect !== null && spaceBelow < 260 && rect.top > spaceBelow;

    return (
        <div className={cn('relative', className)}>
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
                ref={inputRef}
                id={inputId}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
                aria-label={rest['aria-label']}
                autoComplete="off"
                value={display}
                placeholder={selected ? selected.name : placeholder}
                onFocus={() => {
                    setOpen(true);
                    setActive(0);
                }}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                    if (!open) setOpen(true);
                }}
                onBlur={close}
                onKeyDown={onKeyDown}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-14 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {selected && !open && (
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onChange('')}
                        aria-label="Clear medicine"
                        className="p-1 rounded-md text-slate-500 hover:text-slate-200"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
                <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', open && 'rotate-180')} aria-hidden />
            </div>

            {open && rect &&
                createPortal(
                    <ul
                        ref={listRef}
                        id={listId}
                        role="listbox"
                        style={{
                            position: 'fixed',
                            left: rect.left,
                            width: Math.min(Math.max(rect.width, 340), window.innerWidth - rect.left - 16),
                            ...(dropUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
                        }}
                        className="z-[220] max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-panel shadow-glass py-1 text-xs"
                        onMouseDown={(e) => e.preventDefault()} // keep focus in the input while clicking
                    >
                        {shown.length === 0 ? (
                            <li className="px-3 py-2.5 text-slate-400">No medicine matches “{query}”.</li>
                        ) : (
                            shown.map((opt, i) => (
                                <li
                                    key={opt.id}
                                    id={`${listId}-${i}`}
                                    data-index={i}
                                    role="option"
                                    aria-selected={String(opt.id) === String(value)}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => choose(opt)}
                                    className={cn(
                                        'px-3 py-2 cursor-pointer flex items-center justify-between gap-3',
                                        i === active ? 'bg-emerald-500/15 text-white' : 'text-slate-200',
                                        String(opt.id) === String(value) && 'font-semibold',
                                    )}
                                >
                                    <span className="truncate">{opt.name}</span>
                                    {opt.sku && <span className="shrink-0 font-mono text-[11px] text-slate-500">{opt.sku}</span>}
                                </li>
                            ))
                        )}
                        {matches.length > MAX_RESULTS && (
                            <li className="px-3 py-2 text-[11px] text-slate-500 border-t border-slate-800">
                                {matches.length - MAX_RESULTS} more — keep typing to narrow down
                            </li>
                        )}
                    </ul>,
                    document.body,
                )}
        </div>
    );
}
