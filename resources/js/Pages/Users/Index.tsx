import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Users,
    UserPlus,
    Shield,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    X,
    Lock,
    Mail,
    Phone,
    Plus,
    UserCheck,
    AlertTriangle,
    Key
} from 'lucide-react';
import { User, PageProps } from '@/types';
import { formatDate, cn } from '@/lib/utils';

interface Props {
    users: (User & { sales_count?: number; stock_adjustments_count?: number; audit_logs_count?: number })[];
    roles: Record<string, string>;
    metrics: {
        total_users: number;
        super_admins: number;
        pharmacists: number;
        cashiers: number;
        inventory_managers: number;
    };
    filters: {
        role?: string;
        search?: string;
    };
}

export default function UsersIndex({ users, roles, metrics, filters }: Props) {
    const { errors, flash } = usePage<PageProps & { errors: Record<string, string> }>().props;

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Create Form
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: 'password',
        role: 'pharmacist',
        phone: '',
        avatar: '',
    });

    // Edit Form
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        role: 'pharmacist',
        phone: '',
        password: '',
        is_active: true,
    });

    const [loading, setLoading] = useState(false);

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        router.get('/users', {
            search: searchTerm,
            role: selectedRole,
            ...newFilters,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post('/users', createForm, {
            onSuccess: () => {
                setShowCreateModal(false);
                setCreateForm({
                    name: '',
                    email: '',
                    password: 'password',
                    role: 'pharmacist',
                    phone: '',
                    avatar: '',
                });
            },
            onFinish: () => setLoading(false),
        });
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            password: '',
            is_active: user.is_active ?? true,
        });
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setLoading(true);
        router.put(`/users/${editingUser.id}`, editForm, {
            onSuccess: () => setEditingUser(null),
            onFinish: () => setLoading(false),
        });
    };

    const handleDeactivateUser = (user: User) => {
        if (confirm(`Are you sure you want to deactivate account '${user.name}'?\n\nThis will restrict their station access and log an audit trail.`)) {
            router.delete(`/users/${user.id}`);
        }
    };

    const getRoleBadge = (role: string) => {
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
            activeTab="settings"
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                            <span>Staff & Role Access Control</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                                Super Admin Only
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Create new staff accounts, assign pharmaceutical permissions, and audit operator activity
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center gap-2 transition self-start sm:self-auto"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Staff Member</span>
                    </button>
                </div>
            }
        >
            <Head title="Staff Directory & Role Management" />

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4 sm:mb-6">
                <div className="glass-panel p-3.5 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-400 block">Total Staff</span>
                    <span className="text-xl font-black text-white">{metrics.total_users}</span>
                </div>
                <div className="glass-panel p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5">
                    <span className="text-[11px] font-semibold text-purple-300 block">Super Admins</span>
                    <span className="text-xl font-black text-purple-400">{metrics.super_admins}</span>
                </div>
                <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                    <span className="text-[11px] font-semibold text-emerald-300 block">Lead Pharmacists</span>
                    <span className="text-xl font-black text-emerald-400">{metrics.pharmacists}</span>
                </div>
                <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5">
                    <span className="text-[11px] font-semibold text-cyan-300 block">Senior Cashiers</span>
                    <span className="text-xl font-black text-cyan-400">{metrics.cashiers}</span>
                </div>
                <div className="glass-panel p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                    <span className="text-[11px] font-semibold text-amber-300 block">Inventory Managers</span>
                    <span className="text-xl font-black text-amber-400">{metrics.inventory_managers}</span>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="glass-panel rounded-2xl p-4 mb-6 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search staff by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                </form>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedRole}
                        onChange={(e) => {
                            setSelectedRole(e.target.value);
                            applyFilters({ role: e.target.value });
                        }}
                        className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">All Roles</option>
                        {Object.entries(roles).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {(searchTerm || selectedRole) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedRole('');
                                router.get('/users');
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 font-semibold"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Staff Directory Table */}
            <div className="glass-panel rounded-3xl p-5 border border-slate-800/80">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                <th className="py-3 px-4">Staff Member</th>
                                <th className="py-3 px-4">Assigned Role</th>
                                <th className="py-3 px-4">Contact Info</th>
                                <th className="py-3 px-4">Activity Logged</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                                alt={u.name}
                                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                                            />
                                            <div>
                                                <span className="font-bold text-white block">{u.name}</span>
                                                <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1",
                                            getRoleBadge(u.role)
                                        )}>
                                            <Shield className="w-3 h-3" />
                                            {roles[u.role] || u.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-300">
                                        <div>{u.phone || 'No phone set'}</div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                                        <span className="text-white font-bold">{u.audit_logs_count || 0}</span> audits • <span className="text-emerald-400 font-bold">{u.sales_count || 0}</span> sales
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-md text-[10px] font-bold",
                                            u.is_active !== false
                                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                        )}>
                                            {u.is_active !== false ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                                            >
                                                <Edit2 className="w-3 h-3 text-cyan-400" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeactivateUser(u)}
                                                title="Deactivate staff account"
                                                className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Create Staff Member */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-lg p-6 border border-slate-700 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-emerald-400" />
                                Register New Staff Member
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dr. Sarah Jenkins"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                />
                                {errors?.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="s.jenkins@pharmacare.ai"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                    {errors?.email && <p className="text-[10px] text-rose-400 mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Min 6 characters"
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned RBAC Role *</label>
                                <select
                                    required
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="super_admin">Super Admin (Unrestricted)</option>
                                    <option value="pharmacist">Lead Pharmacist (Rx & Controlled Dispense)</option>
                                    <option value="cashier">Senior Cashier (POS & Receipts)</option>
                                    <option value="inventory_manager">Inventory Manager (Stock & FEFO)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone / Extension</label>
                                    <input
                                        type="text"
                                        placeholder="+1 (555) 012-3456"
                                        value={createForm.phone}
                                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar Image URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://images.unsplash.com/..."
                                        value={createForm.avatar}
                                        onChange={(e) => setCreateForm({ ...createForm, avatar: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald"
                                >
                                    {loading ? 'Creating...' : 'Create Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Staff Member */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-lg p-6 border border-slate-700 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-cyan-400" />
                                Edit Staff Member: {editingUser.name}
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role *</label>
                                    <select
                                        required
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="super_admin">Super Admin</option>
                                        <option value="pharmacist">Lead Pharmacist</option>
                                        <option value="cashier">Senior Cashier</option>
                                        <option value="inventory_manager">Inventory Manager</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reset Password (Optional)</label>
                                    <input
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.is_active}
                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span>Account is Active & Allowed to Sign In</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan"
                                >
                                    {loading ? 'Saving...' : 'Update Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
