import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    Lock,
    Mail,
    Shield,
    ShieldCheck,
    ArrowRight,
    Key,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    UserCheck
} from 'lucide-react';
import { PageProps } from '@/types';
import { cn } from '@/lib/utils';

interface DemoUser {
    role: string;
    title: string;
    email: string;
    password: string;
    desc: string;
    color: string;
}

interface Props {
    roles: Record<string, string>;
    demoUsers: DemoUser[];
}

export default function Login({ roles, demoUsers }: Props) {
    const { flash, errors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    const [form, setForm] = useState({
        email: 'admin@pharmacare.ai',
        password: 'password',
        remember: true,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post('/login', form, {
            onFinish: () => setLoading(false),
        });
    };

    const handleQuickLogin = (demo: DemoUser) => {
        setForm({
            email: demo.email,
            password: demo.password,
            remember: true,
        });
        setLoading(true);
        router.post('/login', {
            email: demo.email,
            password: demo.password,
            remember: true,
        }, {
            onFinish: () => setLoading(false),
        });
    };

    return (
        <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
            {/* Background Glow Accents */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <Head title="Staff Authentication & Portal Login" />

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
                {/* Left Column: Brand & Quick Demo Cards */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Brand Banner */}
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-glow-emerald">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-2xl tracking-tight text-white">PharmaCare</span>
                                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">AI</span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Enterprise Pharmacy Management System</p>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            Clinical Staff Portal
                        </h1>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            Role-Based Access Control (RBAC) with real-time audit trail, FEFO inventory allocation, and DGDA regulatory compliance.
                        </p>
                    </div>

                    {/* Quick 1-Click Role Login Selector */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                1-Click Quick Demo Sign-In
                            </span>
                            <span className="text-[10px] text-slate-500">Auto-authenticates</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {demoUsers.map((demo) => (
                                <button
                                    key={demo.role}
                                    type="button"
                                    onClick={() => handleQuickLogin(demo)}
                                    disabled={loading}
                                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-left transition group relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                                            {demo.title}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 line-clamp-1">{demo.desc}</p>
                                    <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">{demo.email}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compliance Indicator */}
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>FDA / DGDA Schedule-II Ready</span>
                        </div>
                        <span>•</span>
                        <span>Immutable Audit Logging</span>
                    </div>
                </div>

                {/* Right Column: Interactive Login Form */}
                <div className="lg:col-span-6">
                    <div className="glass-panel-elevated rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Lock className="w-4 h-4 text-emerald-400" />
                                Sign In to Your Station
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Enter your assigned institutional credentials
                            </p>
                        </div>

                        {/* Flash notifications */}
                        {flash?.info && (
                            <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{flash.info}</span>
                            </div>
                        )}
                        {errors?.email && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errors.email}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Work Email Address *
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="e.g. admin@pharmacare.ai"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Account Password *
                                </label>
                                <div className="relative">
                                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.remember}
                                        onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                                        className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span>Remember station session</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Authenticating Station...</span>
                                ) : (
                                    <>
                                        <UserCheck className="w-4 h-4" />
                                        <span>Sign In & Open Station</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Security Notice */}
                        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Default password: <strong className="text-slate-400 font-mono">password</strong></span>
                            <span className="flex items-center gap-1 text-slate-400">
                                <Shield className="w-3 h-3 text-emerald-400" /> 256-Bit Encrypted
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
