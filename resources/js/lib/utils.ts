import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, symbol = '৳'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${symbol}0.00`;
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateString;
    }
}

/** Time of day in the viewer's local time, e.g. "2:35 PM". */
export function formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Date and time, e.g. "13 Nov 2026, 2:35 PM". */
export function formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    const time = formatTime(dateString);
    return time ? `${formatDate(dateString)}, ${time}` : formatDate(dateString);
}
