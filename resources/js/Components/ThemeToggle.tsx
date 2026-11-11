import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type ThemePreference } from '@/lib/theme';

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

/** Compact icon button that cycles Light → Dark → System. */
export function ThemeToggleButton({ className }: { className?: string }) {
    const { preference, setTheme } = useTheme();
    const current = options.find((o) => o.value === preference) ?? options[2];
    const next = options[(options.indexOf(current) + 1) % options.length];
    const Icon = current.icon;

    return (
        <button
            type="button"
            onClick={() => setTheme(next.value)}
            className={cn(
                'inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition',
                className,
            )}
            title={`Theme: ${current.label} (click for ${next.label})`}
            aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}

/** Segmented Light / Dark / System control for menus and settings. */
export function ThemeSegmented({ className }: { className?: string }) {
    const { preference, setTheme } = useTheme();

    return (
        <div role="radiogroup" aria-label="Colour theme" className={cn('grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800', className)}>
            {options.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={preference === value}
                    onClick={() => setTheme(value)}
                    className={cn(
                        'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition',
                        preference === value ? 'bg-slate-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200',
                    )}
                >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                </button>
            ))}
        </div>
    );
}
