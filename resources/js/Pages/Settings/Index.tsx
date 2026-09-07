import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Store,
    Receipt,
    MapPin,
    Phone,
    Mail,
    FileCheck2,
    Percent,
    DollarSign,
    Printer,
    Save,
    CheckCircle2,
    AlertCircle,
    SlidersHorizontal,
    Sparkles,
    ShieldCheck,
    Building2,
    QrCode
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface StoreSettingsData {
    id?: number;
    store_name: string;
    store_tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    drug_license_no?: string;
    vat_reg_no?: string;
    receipt_footer?: string;
    default_tax_rate: number;
    currency_symbol: string;
    thermal_printer_width: '80mm' | '58mm';
    show_tax_on_receipt: boolean;
    show_license_on_receipt: boolean;
}

interface Props {
    settings: StoreSettingsData;
    ai_config: {
        has_gemini: boolean;
        has_openai: boolean;
    };
}

export default function SettingsIndex({ settings, ai_config }: Props) {
    const [formData, setFormData] = useState<StoreSettingsData>({
        store_name: settings?.store_name || 'PharmaCare AI Rx',
        store_tagline: settings?.store_tagline || 'Enterprise Pharmacy & Healthcare',
        address: settings?.address || 'House #12, Road #4, Dhanmondi, Dhaka-1205',
        phone: settings?.phone || '+880 2 8833047 | +880 1711-000000',
        email: settings?.email || 'contact@pharmacare.com',
        drug_license_no: settings?.drug_license_no || 'FDA/DGDA Lic: 89410',
        vat_reg_no: settings?.vat_reg_no || 'BIN: 002948192-0101',
        receipt_footer: settings?.receipt_footer || 'Thank you for choosing PharmaCare AI! Quick healing.',
        default_tax_rate: Number(settings?.default_tax_rate) || 5.00,
        currency_symbol: settings?.currency_symbol || '৳',
        thermal_printer_width: settings?.thermal_printer_width || '80mm',
        show_tax_on_receipt: settings?.show_tax_on_receipt ?? true,
        show_license_on_receipt: settings?.show_license_on_receipt ?? true,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMsg({ type, text });
        setTimeout(() => setToastMsg(null), 3500);
    };

    const handleChange = (field: keyof StoreSettingsData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/settings/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                confetti({
                    particleCount: 70,
                    spread: 60,
                    origin: { y: 0.7 },
                });
                showToast(data.message || 'Store settings updated successfully!');
            } else {
                showToast(data.message || 'Failed to save settings.', 'error');
            }
        } catch (err: any) {
            showToast('Save failed: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const triggerTestPrint = () => {
        const printContent = document.getElementById('thermal-receipt-preview');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
            alert('Please allow popups to test print.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Thermal Receipt - ${formData.store_name}</title>
                <style>
                    @page { margin: 0; size: ${formData.thermal_printer_width === '58mm' ? '58mm' : '80mm'} auto; }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        color: #000;
                        background: #fff;
                        margin: 0;
                        padding: 10px;
                        width: ${formData.thermal_printer_width === '58mm' ? '54mm' : '72mm'};
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .border-b { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
                    .border-t { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
                    .flex { display: flex; justify-content: space-between; margin-bottom: 3px; }
                    .text-xs { font-size: 10px; }
                    .text-sm { font-size: 14px; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <AuthenticatedLayout
            activeTab="settings"
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                            <span>Pharmacy & POS Settings</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                Store Profile & Invoicing
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Customize your pharmacy name, address, contact numbers, drug license, VAT BIN, and thermal receipt layout
                        </p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center justify-center gap-2 transition transform hover:scale-[1.02] disabled:opacity-50 self-start sm:self-auto"
                    >
                        <Save className="w-4 h-4 text-slate-950" />
                        <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
                    </button>
                </div>
            }
        >
            <Head title="Store Settings & Thermal Receipt Setup" />

            {/* Toast alert */}
            {toastMsg && (
                <div className={cn(
                    "fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xl animate-in slide-in-from-top-3 border",
                    toastMsg.type === 'success'
                        ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-glow-emerald"
                        : "bg-red-950/90 text-red-300 border-red-500/40"
                )}>
                    {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                    <span>{toastMsg.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                {/* Left Form: Store Profile & Billing Configurations (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Store Profile Card */}
                    <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-[#0a0f1d] shadow-xl space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white">Pharmacy Identity & Contact Profile</h2>
                                <p className="text-[11px] text-slate-400">Displayed on thermal POS receipts, patient invoices, and regulatory logs</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Pharmacy Name */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    Pharmacy / Store Name <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.store_name}
                                    onChange={(e) => handleChange('store_name', e.target.value)}
                                    placeholder="e.g. PharmaCare AI Rx"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Tagline */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    Store Tagline / Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={formData.store_tagline || ''}
                                    onChange={(e) => handleChange('store_tagline', e.target.value)}
                                    placeholder="e.g. Enterprise Pharmacy & Healthcare"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Location / Address */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Store Address / Location</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.address || ''}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="e.g. House #12, Road #4, Dhanmondi, Dhaka-1205"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 resize-none"
                                />
                            </div>

                            {/* Telephone / Phone */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Telephone / Mobile Numbers</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone || ''}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="e.g. +880 2 8833047 | +880 1711-000000"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Contact Email</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="e.g. contact@pharmacare.com"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Drug License No */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                                    <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Drug License / DGDA Reg No</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.drug_license_no || ''}
                                    onChange={(e) => handleChange('drug_license_no', e.target.value)}
                                    placeholder="e.g. FDA/DGDA Lic: 89410"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* VAT Registration BIN */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>VAT Registration / BIN</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.vat_reg_no || ''}
                                    onChange={(e) => handleChange('vat_reg_no', e.target.value)}
                                    placeholder="e.g. BIN: 002948192-0101"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* POS & Receipt Printing Configuration */}
                    <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-[#0a0f1d] shadow-xl space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <Printer className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white">POS Thermal Invoicing & Tax Defaults</h2>
                                <p className="text-[11px] text-slate-400">Configure receipt layout, roll width, default tax rates, and footer greetings</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Default Govt VAT Rate */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    Default Govt VAT / Tax Rate (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formData.default_tax_rate}
                                        onChange={(e) => handleChange('default_tax_rate', parseFloat(e.target.value) || 0)}
                                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500 pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                                </div>
                            </div>

                            {/* Currency Symbol */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    Currency Symbol
                                </label>
                                <input
                                    type="text"
                                    value={formData.currency_symbol}
                                    onChange={(e) => handleChange('currency_symbol', e.target.value)}
                                    placeholder="e.g. ৳ or $"
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Thermal Printer Width */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    Thermal Printer Roll Width
                                </label>
                                <select
                                    value={formData.thermal_printer_width}
                                    onChange={(e) => handleChange('thermal_printer_width', e.target.value as any)}
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="80mm">80mm (Standard Desktop POS Printer)</option>
                                    <option value="58mm">58mm (Compact Mobile POS Printer)</option>
                                </select>
                            </div>

                            {/* Receipt Footer Message */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    Receipt Footer Greeting Note
                                </label>
                                <input
                                    type="text"
                                    value={formData.receipt_footer || ''}
                                    onChange={(e) => handleChange('receipt_footer', e.target.value)}
                                    placeholder="e.g. Thank you for choosing PharmaCare AI! Quick healing."
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Toggles */}
                            <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_tax_on_receipt}
                                        onChange={(e) => handleChange('show_tax_on_receipt', e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-emerald-500"
                                    />
                                    <span>Print VAT / Tax Breakdown Line on Receipts</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_license_on_receipt}
                                        onChange={(e) => handleChange('show_license_on_receipt', e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-emerald-500"
                                    />
                                    <span>Display Drug License & VAT BIN on Header</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Area: Live Thermal Receipt Simulator (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 bg-gradient-to-b from-[#0e1628] to-[#070b13] shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-cyan-400" />
                                    <h3 className="text-sm font-bold text-white">Live Thermal Receipt Simulator</h3>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                                    {formData.thermal_printer_width}
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mb-4">
                                This live preview reflects the exact layout printed on your physical receipt printer during POS checkout:
                            </p>

                            {/* White Thermal Receipt Slip */}
                            <div
                                id="thermal-receipt-preview"
                                className={cn(
                                    "mx-auto p-4 rounded-2xl bg-white text-slate-950 font-mono text-xs shadow-2xl space-y-2 border border-slate-300 transition-all",
                                    formData.thermal_printer_width === '58mm' ? 'max-w-[240px]' : 'max-w-[310px]'
                                )}
                            >
                                <div className="text-center border-b border-slate-300 pb-2">
                                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-950">
                                        {formData.store_name}
                                    </h4>
                                    {formData.store_tagline && (
                                        <p className="text-[10px] text-slate-700">{formData.store_tagline}</p>
                                    )}
                                    {formData.address && (
                                        <p className="text-[10px] text-slate-600 mt-0.5">{formData.address}</p>
                                    )}
                                    {formData.phone && (
                                        <p className="text-[10px] text-slate-600">Tel: {formData.phone}</p>
                                    )}
                                    {formData.show_license_on_receipt && (
                                        <div className="text-[9px] text-slate-600 mt-0.5 space-y-0.2">
                                            {formData.drug_license_no && <div>{formData.drug_license_no}</div>}
                                            {formData.vat_reg_no && <div>{formData.vat_reg_no}</div>}
                                        </div>
                                    )}
                                </div>

                                <div className="text-[10px] space-y-0.5 border-b border-slate-300 pb-2">
                                    <div>Invoice: <span className="font-bold">INV-20260906-89AF1</span></div>
                                    <div>Date: 06 Sept 2026, 02:25 PM</div>
                                    <div>Customer: Walk-in Retail Customer</div>
                                    <div>Cashier: Dr. Alexander Vance</div>
                                </div>

                                {/* Items List */}
                                <div className="border-b border-slate-300 pb-2 space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                        <div>
                                            <span className="font-bold">Tab. Natcoral Dx 500mg</span>
                                            <span className="text-[9px] block text-slate-600">Qty: 2 x {formData.currency_symbol}240.00 (FEFO: NC4410)</span>
                                        </div>
                                        <span className="font-bold">{formData.currency_symbol}480.00</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <div>
                                            <span className="font-bold">Cap. Progut 20mg</span>
                                            <span className="text-[9px] block text-slate-600">Qty: 1 x {formData.currency_symbol}7.00 (FEFO: PG8810)</span>
                                        </div>
                                        <span className="font-bold">{formData.currency_symbol}7.00</span>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="text-right space-y-0.5 pt-1 text-xs">
                                    <div className="flex justify-between text-[11px]">
                                        <span>Subtotal:</span>
                                        <span>{formData.currency_symbol}487.00</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-emerald-800 font-bold">
                                        <span>Discount (5.00%):</span>
                                        <span>-{formData.currency_symbol}24.35</span>
                                    </div>
                                    {formData.show_tax_on_receipt && (
                                        <div className="flex justify-between text-[11px]">
                                            <span>Govt VAT / Tax ({formData.default_tax_rate}%):</span>
                                            <span>{formData.currency_symbol}{((487 - 24.35) * (formData.default_tax_rate / 100)).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
                                        <span>Grand Total:</span>
                                        <span>
                                            {formData.currency_symbol}{((487 - 24.35) * (1 + formData.default_tax_rate / 100)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-600">
                                        <span>Paid (Cash):</span>
                                        <span>{formData.currency_symbol}{((487 - 24.35) * (1 + formData.default_tax_rate / 100)).toFixed(2)}</span>
                                    </div>
                                </div>

                                {formData.receipt_footer && (
                                    <div className="text-center pt-2 text-[9px] text-slate-500 border-t border-slate-200">
                                        {formData.receipt_footer}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Test Print Action */}
                        <div className="mt-5 pt-4 border-t border-slate-800 flex gap-2">
                            <button
                                type="button"
                                onClick={triggerTestPrint}
                                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center gap-2 transition"
                            >
                                <Printer className="w-4 h-4 text-cyan-400" />
                                <span>Test Print Slip to Printer</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
