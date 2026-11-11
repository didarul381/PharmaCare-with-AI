import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NOTIFY_EVENTS, type ConfirmRequest, type ToastMessage, type ToastTone } from '@/lib/notify';

const toneStyles: Record<ToastTone, { icon: typeof Info; ring: string; iconColor: string }> = {
    success: { icon: CheckCircle2, ring: 'border-emerald-500/40', iconColor: 'text-emerald-400' },
    error: { icon: XCircle, ring: 'border-rose-500/40', iconColor: 'text-rose-400' },
    warning: { icon: AlertTriangle, ring: 'border-amber-500/40', iconColor: 'text-amber-400' },
    info: { icon: Info, ring: 'border-cyan-500/40', iconColor: 'text-cyan-400' },
};

/**
 * Renders toasts (bottom-right) and the confirmation dialog.
 * Mount once per page tree (the layouts do this).
 */
export default function Notifications() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
    const confirmBtn = useRef<HTMLButtonElement>(null);

    const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    useEffect(() => {
        const onToast = (e: Event) => {
            const msg = (e as CustomEvent<ToastMessage>).detail;
            setToasts((t) => [...t.slice(-3), msg]);
            window.setTimeout(() => dismiss(msg.id), msg.tone === 'error' ? 7000 : 4500);
        };
        const onConfirm = (e: Event) => setConfirmReq((e as CustomEvent<ConfirmRequest>).detail);

        window.addEventListener(NOTIFY_EVENTS.TOAST_EVENT, onToast);
        window.addEventListener(NOTIFY_EVENTS.CONFIRM_EVENT, onConfirm);
        return () => {
            window.removeEventListener(NOTIFY_EVENTS.TOAST_EVENT, onToast);
            window.removeEventListener(NOTIFY_EVENTS.CONFIRM_EVENT, onConfirm);
        };
    }, [dismiss]);

    const answer = useCallback(
        (ok: boolean) => {
            confirmReq?.resolve(ok);
            setConfirmReq(null);
        },
        [confirmReq],
    );

    useEffect(() => {
        if (!confirmReq) return;
        confirmBtn.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') answer(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [confirmReq, answer]);

    return (
        <>
            <div
                className="fixed bottom-4 right-4 left-4 sm:left-auto z-[200] flex flex-col gap-2 sm:w-96 pointer-events-none"
                role="region"
                aria-live="polite"
                aria-label="Notifications"
            >
                {toasts.map((t) => {
                    const style = toneStyles[t.tone];
                    const Icon = style.icon;
                    return (
                        <div
                            key={t.id}
                            role={t.tone === 'error' ? 'alert' : 'status'}
                            className={cn(
                                'pointer-events-auto flex items-start gap-3 rounded-xl border bg-panel/95 backdrop-blur px-4 py-3 shadow-glass animate-toast-in',
                                style.ring,
                            )}
                        >
                            <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', style.iconColor)} aria-hidden />
                            <div className="flex-1 min-w-0">
                                {t.title && <p className="text-sm font-bold text-slate-100">{t.title}</p>}
                                <p className="text-sm text-slate-300 break-words">{t.message}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => dismiss(t.id)}
                                className="p-1 -m-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                                aria-label="Dismiss notification"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {confirmReq && (
                <div
                    className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onMouseDown={(e) => e.target === e.currentTarget && answer(false)}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-title"
                        aria-describedby={confirmReq.message ? 'confirm-message' : undefined}
                        className="w-full max-w-md rounded-2xl border border-slate-800 bg-panel p-6 shadow-glass animate-toast-in"
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                    confirmReq.tone === 'danger' ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400',
                                )}
                            >
                                <AlertTriangle className="w-5 h-5" aria-hidden />
                            </div>
                            <div className="min-w-0">
                                <h2 id="confirm-title" className="text-base font-bold text-slate-100">
                                    {confirmReq.title}
                                </h2>
                                {confirmReq.message && (
                                    <p id="confirm-message" className="mt-1 text-sm text-slate-400 whitespace-pre-line">
                                        {confirmReq.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => answer(false)}
                                className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                            >
                                {confirmReq.cancelLabel ?? 'Cancel'}
                            </button>
                            <button
                                ref={confirmBtn}
                                type="button"
                                onClick={() => answer(true)}
                                className={cn(
                                    'min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl text-sm font-bold',
                                    confirmReq.tone === 'danger' ? 'bg-rose-600 text-paper hover:bg-rose-500' : 'bg-emerald-500 text-ink hover:bg-emerald-400',
                                )}
                            >
                                {confirmReq.confirmLabel ?? 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
