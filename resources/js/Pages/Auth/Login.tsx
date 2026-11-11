import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Activity, AlertCircle, ArrowRight, BarChart3, Boxes, Eye, EyeOff, Lock, Mail, ShieldCheck, ShoppingCart, Sparkles } from 'lucide-react';
import { PageProps } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/notify';
import Notifications from '@/Components/Notifications';
import { ThemeToggleButton } from '@/Components/ThemeToggle';

interface DemoUser {
    role: string;
    title: string;
    email: string;
    password: string;
    desc: string;
}

interface Props {
    demoUsers: DemoUser[];
}

const ROLE_ACCENT: Record<string, string> = {
    super_admin: 'text-purple-400',
    pharmacist: 'text-emerald-400',
    cashier: 'text-cyan-400',
    inventory_manager: 'text-amber-400',
};

const FEATURES = [
    { icon: ShoppingCart, title: 'Fast checkout', text: 'Barcode POS with cash, card, bKash, Nagad & credit.' },
    { icon: Boxes, title: 'Expiry-safe stock', text: 'Oldest-expiring batch is always sold first (FEFO).' },
    { icon: Sparkles, title: 'AI assistance', text: 'Prescription scanning & drug-interaction alerts.' },
    { icon: BarChart3, title: 'Clear reports', text: 'Daily sales, profit, dues and best sellers.' },
];

export default function Login({ demoUsers }: Props) {
    const { flash, errors, app_info } = usePage<PageProps & { errors: Record<string, string> }>().props;
    const isDemo = demoUsers.length > 0;

    const [form, setForm] = useState({ email: '', password: '', remember: true });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (flash?.info) toast.info(flash.info);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
    }, [flash]);

    const submit = (credentials = form) => {
        setLoading(true);
        router.post('/login', credentials, { onFinish: () => setLoading(false) });
    };

    return (
        <div className="min-h-[100dvh] bg-deep text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans">
            <Head title="Sign in" />
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="absolute top-4 right-4 z-20">
                <ThemeToggleButton />
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10">
                {/* Brand & context */}
                <div className="lg:col-span-6 space-y-7 order-2 lg:order-1">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-glow-emerald">
                            <Activity className="w-7 h-7 text-paper" />
                        </div>
                        <div>
                            <p className="font-black text-2xl tracking-tight text-white">{app_info?.name || 'PharmaCare'}</p>
                            <p className="text-sm text-slate-400 font-medium">Pharmacy management system</p>
                        </div>
                    </div>

                    {isDemo ? (
                        <section aria-labelledby="demo-heading" className="space-y-3">
                            <div>
                                <h2 id="demo-heading" className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" /> Try the live demo
                                </h2>
                                <p className="text-sm text-slate-400">Pick a role to sign in instantly. Every role sees a different set of screens.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {demoUsers.map((demo) => (
                                    <button
                                        key={demo.role}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => submit({ email: demo.email, password: demo.password, remember: true })}
                                        className="p-3.5 min-h-[72px] rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left transition group disabled:opacity-60"
                                    >
                                        <span className="flex items-center justify-between">
                                            <span className={cn('text-sm font-bold', ROLE_ACCENT[demo.role] ?? 'text-white')}>{demo.title}</span>
                                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                                        </span>
                                        <span className="block text-xs text-slate-400 mt-1">{demo.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {FEATURES.map(({ icon: Icon, title, text }) => (
                                <li key={title} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                                    <Icon className="w-5 h-5 text-emerald-400" />
                                    <p className="mt-2 text-sm font-bold text-white">{title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{text}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Sign-in form */}
                <div className="lg:col-span-6 order-1 lg:order-2">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-glass">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Lock className="w-5 h-5 text-emerald-400" /> Sign in
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Use the email and password given by your administrator.</p>

                        {errors?.email && (
                            <div role="alert" className="mt-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {errors.email}
                            </div>
                        )}

                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit();
                            }}
                        >
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="username"
                                        autoFocus
                                        required
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="you@pharmacy.com"
                                        aria-invalid={Boolean(errors?.email)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-slate-200"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.remember}
                                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                />
                                Keep me signed in on this device
                            </label>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-ink font-bold text-sm rounded-xl shadow-glow-emerald transition flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? 'Signing in…' : 'Sign in'}
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>

                        <p className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Forgot your password? Ask your pharmacy administrator to reset it.
                        </p>
                    </div>
                </div>
            </div>

            <Notifications />
        </div>
    );
}
