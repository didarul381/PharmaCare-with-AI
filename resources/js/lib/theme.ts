import { useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'pharmacare-theme';
const EVENT = 'pharmacare:theme';

export function getThemePreference(): ThemePreference {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {
        /* storage blocked */
    }
    return 'system';
}

function systemPrefersDark(): boolean {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
    return pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref;
}

export function applyTheme(pref: ThemePreference): void {
    const resolved = resolveTheme(pref);
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0b0f19' : '#f4f6fa');
}

export function setThemePreference(pref: ThemePreference): void {
    try {
        localStorage.setItem(STORAGE_KEY, pref);
    } catch {
        /* storage blocked — still apply for this page view */
    }
    applyTheme(pref);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: pref }));
}

/** React hook: current preference + resolved theme, kept in sync across components and OS changes. */
export function useTheme() {
    const [preference, setPreference] = useState<ThemePreference>(() => getThemePreference());
    const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveTheme(getThemePreference()));

    useEffect(() => {
        const sync = () => {
            const pref = getThemePreference();
            setPreference(pref);
            setResolved(resolveTheme(pref));
        };
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onSystemChange = () => {
            if (getThemePreference() === 'system') {
                applyTheme('system');
                sync();
            }
        };
        window.addEventListener(EVENT, sync);
        media.addEventListener('change', onSystemChange);
        return () => {
            window.removeEventListener(EVENT, sync);
            media.removeEventListener('change', onSystemChange);
        };
    }, []);

    return { preference, resolved, setTheme: setThemePreference };
}
