/**
 * Tiny app-wide notification bus — replaces window.alert()/confirm() with
 * themed toasts and a confirmation dialog (rendered by <Notifications/> in the layout).
 */

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: number;
    tone: ToastTone;
    title?: string;
    message: string;
}

export interface ConfirmOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'default';
}

export interface ConfirmRequest extends ConfirmOptions {
    id: number;
    resolve: (ok: boolean) => void;
}

const TOAST_EVENT = 'pharmacare:toast';
const CONFIRM_EVENT = 'pharmacare:confirm';
let seq = 0;

function emit<T>(name: string, detail: T) {
    window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

export function toast(message: string, tone: ToastTone = 'info', title?: string): void {
    emit<ToastMessage>(TOAST_EVENT, { id: ++seq, tone, message, title });
}

toast.success = (message: string, title?: string) => toast(message, 'success', title);
toast.error = (message: string, title?: string) => toast(message, 'error', title);
toast.warning = (message: string, title?: string) => toast(message, 'warning', title);
toast.info = (message: string, title?: string) => toast(message, 'info', title);

/** Promise-based replacement for window.confirm(). */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
        emit<ConfirmRequest>(CONFIRM_EVENT, { id: ++seq, ...options, resolve });
    });
}

export const NOTIFY_EVENTS = { TOAST_EVENT, CONFIRM_EVENT };
