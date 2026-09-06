import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    User as UserIcon,
    Mail,
    Phone,
    Key,
    Shield,
    CheckCircle2,
    Save,
    History,
    AlertCircle,
    Camera
} from 'lucide-react';
import { User, AuditLog, PageProps } from '@/types';
import { formatDate, cn } from '@/lib/utils';

interface Props {
    user: User;
    roles: Record<string, string>;
    recentLogs: AuditLog[];
}

export default function ProfileEdit({ user, roles, recentLogs }: Props) {
    const { errors } = usePage<PageProps & { errors: Record<string, string> }>().props;

    const [form, setForm] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const [saving, setSaving] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        router.post('/profile', form, {
            onFinish: () => {
                setSaving(false);
                setForm((prev) => ({
                    ...prev,
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                }));
            },
        });
    };

    const roleBadge = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'pharmacist':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'cashier':
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'inventory_manager':
                return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            default:
                return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                            Staff Profile & Security Credentials
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage institutional staff profile, contact coordinates, and secure access passwords
                        </p>
                    </div>

                    <div className={cn(
                        "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold self-start md:self-auto",
                        roleBadge(user.role)
                    )}>
                        <Shield className="w-3.5 h-3.5" />
                        <span>Role: {roles[user.role] || user.role}</span>
                    </div>
                </div>
            }
        >
            <Head title="Staff Profile & Security" />

            <div className="max-w-5xl space-y-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Avatar & Role Summary Card */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 text-center relative">
                            <div className="relative inline-block mx-auto mb-4">
                                <img
                                    src={form.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/40 shadow-glow-emerald mx-auto"
                                />
                                <div className="absolute bottom-0 right-0 p-1.5 bg-slate-900 border border-slate-700 rounded-full text-emerald-400">
                                    <Camera className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            <h2 className="text-base font-bold text-white">{user.name}</h2>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>

                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5",
                                    roleBadge(user.role)
                                )}>
                                    <Shield className="w-3 h-3" />
                                    {roles[user.role] || user.role}
                                </span>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Card */}
                        <div className="glass-panel p-4 rounded-3xl border border-slate-800/80">
                            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3">
                                <History className="w-3.5 h-3.5 text-cyan-400" />
                                Recent Activity Audit Trail
                            </h3>
                            <div className="space-y-2">
                                {recentLogs.length === 0 ? (
                                    <p className="text-[11px] text-slate-500 italic">No recent logged actions.</p>
                                ) : (
                                    recentLogs.map((log) => (
                                        <div key={log.id} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px]">
                                            <div className="flex items-center justify-between text-slate-300 font-medium">
                                                <span className="font-mono text-cyan-400 text-[10px]">{log.action}</span>
                                                <span className="text-[10px] text-slate-500">{formatDate(log.created_at)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Editable Profile Fields & Password Form */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Section 1: Basic Profile Details */}
                        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                                <UserIcon className="w-4 h-4 text-emerald-400" />
                                Institutional Contact Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                    {errors?.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Institutional Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                    {errors?.email && <p className="text-[10px] text-rose-400 mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Contact Phone / Extension
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="+1 (555) 019-2834"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Avatar Image URL
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={form.avatar}
                                        onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Security & Password Update */}
                        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                                <Key className="w-4 h-4 text-cyan-400" />
                                Change Access Password (Optional)
                            </h3>
                            <p className="text-xs text-slate-400">
                                Leave blank if you do not wish to update your login password.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter current password to verify..."
                                        value={form.current_password}
                                        onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                    {errors?.current_password && <p className="text-[10px] text-rose-400 mt-1">{errors.current_password}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Minimum 6 characters"
                                            value={form.new_password}
                                            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                        {errors?.new_password && <p className="text-[10px] text-rose-400 mt-1">{errors.new_password}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Re-enter new password"
                                            value={form.new_password_confirmation}
                                            onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
                                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Action */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center gap-2 transition disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'Saving Changes...' : 'Save Profile & Credentials'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
