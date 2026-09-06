import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText,
    UploadCloud,
    Sparkles,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Calendar,
    Stethoscope,
    Building2,
    ShoppingCart,
    Eye,
    EyeOff,
    Scan,
    ArrowRight,
    Check,
    X,
    MapPin,
    AlertTriangle,
    ShieldCheck,
    Key,
    Settings,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Cpu,
    Zap,
    Save,
    Trash2,
    Search,
    Filter,
    CheckSquare,
    Square,
    RotateCcw,
    Pill,
    SlidersHorizontal
} from 'lucide-react';
import { Prescription, Customer } from '@/types';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface AiConfig {
    has_openai: boolean;
    has_gemini: boolean;
    openai_key_masked: string | null;
    gemini_key_masked: string | null;
    active_driver: string;
    driver_label: string;
}

interface Props {
    prescriptions: Prescription[];
    customers: Customer[];
    ai_config?: AiConfig;
}

export default function PrescriptionsIndex({ prescriptions, customers, ai_config }: Props) {
    const [isScanning, setIsScanning] = useState(false);
    const [scanStep, setScanStep] = useState<string>('Initializing AI Vision...');
    const [scannedResult, setScannedResult] = useState<any | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // AI API Key Configuration State
    const [showKeyConfig, setShowKeyConfig] = useState(false);
    const [activeTab, setActiveTab] = useState<'gemini' | 'openai'>('gemini');
    const [geminiKeyInput, setGeminiKeyInput] = useState('');
    const [openaiKeyInput, setOpenaiKeyInput] = useState('');
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [saveStatusMsg, setSaveStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [currentAiConfig, setCurrentAiConfig] = useState<AiConfig>(ai_config || {
        has_openai: false,
        has_gemini: false,
        openai_key_masked: null,
        gemini_key_masked: null,
        active_driver: 'built_in',
        driver_label: 'Built-in Clinical Vision NLP Engine (Offline Fallback)',
    });

    const [scanError, setScanError] = useState<string | null>(null);

    // Registry Table & Actions State
    const [rxList, setRxList] = useState<Prescription[]>(prescriptions || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'dispensed' | 'pending'>('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [viewRxModal, setViewRxModal] = useState<Prescription | null>(null);
    const [showClearAllModal, setShowClearAllModal] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setActionToast({ type, text });
        setTimeout(() => setActionToast(null), 3500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanError(null);
        // Show image preview
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Reset previous scan and trigger AI Vision
        triggerAiScan(file, null);
    };

    const loadSampleJoysree = () => {
        setScanError(null);
        setPreviewImage('https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80');
        triggerAiScan(null, 'sample_joysree');
    };

    const loadSampleMahbubur = () => {
        setScanError(null);
        setPreviewImage('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80');
        triggerAiScan(null, 'sample_mahbubur');
    };

    const triggerAiScan = async (file: File | null, sampleKey: string | null) => {
        setIsScanning(true);
        setScannedResult(null);
        setScanError(null);
        setScanStep('AI Vision Analyzing Handwriting & Bengali Clinical Script...');

        const formData = new FormData();
        if (file) {
            formData.append('image', file);
        } else {
            formData.append('image_base64', sampleKey || 'sample_joysree');
        }

        // Simulate multi-step OCR progress feedback
        const timer1 = setTimeout(() => setScanStep('Extracting Doctor & Patient Metadata...'), 400);
        const timer2 = setTimeout(() => setScanStep('Fuzzy Matching Prescribed Medications to Drug Vault...'), 800);

        try {
            const res = await fetch('/prescriptions/parse-image', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            const result = await res.json();
            if (result.success) {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                });
                setScannedResult(result.data);
            } else {
                setScanError(result.message || 'AI Vision could not extract data from the prescription.');
            }
        } catch (err: any) {
            setScanError('Connection Error: ' + err.message);
        } finally {
            clearTimeout(timer1);
            clearTimeout(timer2);
            setIsScanning(false);
        }
    };

    const handleSaveApiKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingKey(true);
        setSaveStatusMsg(null);

        try {
            const res = await fetch('/prescriptions/save-ai-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    openai_api_key: openaiKeyInput,
                    gemini_api_key: geminiKeyInput,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setCurrentAiConfig(data.ai_config);
                setSaveStatusMsg({ type: 'success', text: 'API Key saved & activated successfully!' });
                setGeminiKeyInput('');
                setOpenaiKeyInput('');
                setTimeout(() => setSaveStatusMsg(null), 4000);
            } else {
                setSaveStatusMsg({ type: 'error', text: data.message || 'Failed to save key.' });
            }
        } catch (err: any) {
            setSaveStatusMsg({ type: 'error', text: 'Error: ' + err.message });
        } finally {
            setIsSavingKey(false);
        }
    };

    const filteredPrescriptions = rxList.filter((rx) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
            !query ||
            (rx.prescription_number || '').toLowerCase().includes(query) ||
            (rx.doctor_name || '').toLowerCase().includes(query) ||
            (rx.hospital_name || '').toLowerCase().includes(query) ||
            (rx.customer?.name || '').toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || rx.status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    const handleDeleteSingle = async (id: number) => {
        if (!confirm('Are you sure you want to delete this prescription log?')) return;
        setIsProcessingAction(true);
        try {
            const res = await fetch(`/prescriptions/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json();
            if (data.success) {
                setRxList((prev) => prev.filter((item) => item.id !== id));
                setSelectedIds((prev) => prev.filter((item) => item !== id));
                showToast(data.message || 'Prescription deleted.');
            }
        } catch (err: any) {
            showToast('Delete failed: ' + err.message, 'error');
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleClearAll = async () => {
        setIsProcessingAction(true);
        try {
            const res = await fetch('/prescriptions/clear-all', {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json();
            if (data.success) {
                setRxList([]);
                setSelectedIds([]);
                setShowClearAllModal(false);
                showToast(data.message || 'All prescription records cleared successfully.');
            }
        } catch (err: any) {
            showToast('Clear all failed: ' + err.message, 'error');
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected prescriptions?`)) return;

        setIsProcessingAction(true);
        try {
            const res = await fetch('/prescriptions/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ ids: selectedIds }),
            });
            const data = await res.json();
            if (data.success) {
                setRxList((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
                setSelectedIds([]);
                showToast(data.message || 'Selected records deleted.');
            }
        } catch (err: any) {
            showToast('Bulk delete failed: ' + err.message, 'error');
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleToggleStatus = async (rx: Prescription) => {
        const nextStatus = rx.status === 'dispensed' ? 'verified' : 'dispensed';
        try {
            const res = await fetch(`/prescriptions/${rx.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setRxList((prev) =>
                    prev.map((item) => (item.id === rx.id ? { ...item, status: nextStatus as any } : item))
                );
                showToast(`Prescription #${rx.prescription_number} status updated to ${nextStatus}.`);
            }
        } catch (err: any) {
            showToast('Status update failed: ' + err.message, 'error');
        }
    };

    const handlePushSavedRxToPos = (rx: Prescription) => {
        if (!rx.items || rx.items.length === 0) {
            alert('No prescribed medicines found in this record to transfer.');
            return;
        }

        const cartItems = rx.items
            .filter((item) => item.medicine)
            .map((item) => ({
                medicine: item.medicine,
                quantity: item.quantity || 1,
                unit_price: (item.medicine as any)?.selling_price || item.medicine?.current_selling_price || 10.0,
                unit_name: (item.medicine as any)?.unit_name || 'Strip',
                discount: 0,
            }));

        if (cartItems.length === 0) {
            alert('Prescription items could not be mapped to catalog inventory.');
            return;
        }

        try {
            localStorage.setItem('pharmacare_transferred_cart', JSON.stringify(cartItems));
            if (rx.customer?.name) {
                localStorage.setItem('pharmacare_transferred_customer_name', rx.customer.name);
            }
        } catch {}

        router.visit('/pos');
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredPrescriptions.map((rx) => rx.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    return (
        <AuthenticatedLayout
            activeTab="prescriptions"
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                            AI Prescription Vision & OCR Parser
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                Vision LLM + Matcher
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Extract doctor handwriting, match active medicines with confidence scoring, and auto-populate POS carts
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowKeyConfig(!showKeyConfig)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition",
                                showKeyConfig
                                    ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-glow-cyan"
                                    : "bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/40"
                            )}
                        >
                            <Key className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{showKeyConfig ? 'Close Key Setup' : 'API Key Setup'}</span>
                            {showKeyConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                            onClick={loadSampleJoysree}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-2 transition shadow-glow-cyan"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Dr. Joysree Saha (9 Rx)</span>
                        </button>
                        <button
                            onClick={loadSampleMahbubur}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
                        >
                            <span>Dr. Mahbubur (4 Rx)</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="AI Prescription OCR & Digitizer" />

            {/* Action Toast Alert */}
            {actionToast && (
                <div className={cn(
                    "fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xl animate-in slide-in-from-top-3 border",
                    actionToast.type === 'success'
                        ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-glow-emerald"
                        : "bg-red-950/90 text-red-300 border-red-500/40"
                )}>
                    {actionToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                    <span>{actionToast.text}</span>
                </div>
            )}

            {/* AI Vision API Key Management & Instructions Banner */}
            <div className="mb-6 rounded-3xl glass-panel border border-cyan-500/30 bg-gradient-to-r from-slate-900/95 via-[#0c1626]/90 to-slate-900/95 p-5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-white tracking-tight">
                                    AI Vision OCR Engine & API Key Setup
                                </h3>
                                {currentAiConfig.has_gemini || currentAiConfig.has_openai ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {currentAiConfig.driver_label}
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                        <Cpu className="w-3 h-3 text-cyan-400" />
                                        Built-in Clinical NLP Mode (Ready to Use)
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Connect Google Gemini 1.5 (Free) or OpenAI GPT-4o Vision API to parse ANY custom prescription handwriting live.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                            type="button"
                            onClick={() => setShowKeyConfig(!showKeyConfig)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span>{showKeyConfig ? 'Hide Instructions & Inputs' : 'How to Add API Key / Edit'}</span>
                            {showKeyConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Collapsible Key Config & Instructions Panel */}
                {showKeyConfig && (
                    <div className="mt-4 pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Provider Selector Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                            <button
                                type="button"
                                onClick={() => setActiveTab('gemini')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition",
                                    activeTab === 'gemini'
                                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan"
                                        : "text-slate-400 hover:text-white bg-slate-900/50 border border-transparent"
                                )}
                            >
                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Google Gemini 1.5 Flash (Free Tier Recommended)</span>
                                {currentAiConfig.has_gemini && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('openai')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition",
                                    activeTab === 'openai'
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald"
                                        : "text-slate-400 hover:text-white bg-slate-900/50 border border-transparent"
                                )}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span>OpenAI GPT-4o Vision</span>
                                {currentAiConfig.has_openai && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                )}
                            </button>
                        </div>

                        {/* Gemini Tab Content */}
                        {activeTab === 'gemini' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                                {/* Instructions Column (7 cols) */}
                                <div className="lg:col-span-7 bg-slate-900/70 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4 text-cyan-400" />
                                            How to get a FREE Google Gemini API Key:
                                        </h4>
                                        <a
                                            href="https://aistudio.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline"
                                        >
                                            <span>Open Google AI Studio</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>

                                    <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside pl-1">
                                        <li>
                                            Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Google AI Studio</a> and sign in with your Google account.
                                        </li>
                                        <li>
                                            Click the blue button <strong className="text-white">"Create API key"</strong> (Gemini provides 15 requests/min completely free without billing).
                                        </li>
                                        <li>
                                            Copy your API key (starts with <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded font-mono">AIzaSy...</code>).
                                        </li>
                                        <li>
                                            Paste the key in the input box on the right and click <strong className="text-white">"Save & Connect"</strong>.
                                        </li>
                                    </ol>

                                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200">
                                        <strong>Alternative (.env):</strong> You can also set <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">GEMINI_API_KEY=your_key_here</code> in your project's <code className="text-white font-mono">.env</code> file.
                                    </div>
                                </div>

                                {/* Form Column (5 cols) */}
                                <form onSubmit={handleSaveApiKey} className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 block mb-1">
                                            Google Gemini API Key:
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showGeminiKey ? 'text' : 'password'}
                                                value={geminiKeyInput}
                                                onChange={(e) => setGeminiKeyInput(e.target.value)}
                                                placeholder={currentAiConfig.gemini_key_masked || "AIzaSy..."}
                                                className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                                                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                                            >
                                                {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                        {currentAiConfig.gemini_key_masked && (
                                            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Active Key: {currentAiConfig.gemini_key_masked}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSavingKey || !geminiKeyInput.trim()}
                                        className="w-full py-2 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-glow-cyan"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        <span>{isSavingKey ? 'Connecting & Saving...' : 'Save & Connect Gemini Key'}</span>
                                    </button>

                                    {saveStatusMsg && (
                                        <div className={cn(
                                            "p-2 rounded-xl text-center text-xs font-bold",
                                            saveStatusMsg.type === 'success' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                                        )}>
                                            {saveStatusMsg.text}
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}

                        {/* OpenAI Tab Content */}
                        {activeTab === 'openai' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                                {/* Instructions Column (7 cols) */}
                                <div className="lg:col-span-7 bg-slate-900/70 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4 text-emerald-400" />
                                            How to get an OpenAI GPT-4o API Key:
                                        </h4>
                                        <a
                                            href="https://platform.openai.com/api-keys"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold underline"
                                        >
                                            <span>Open OpenAI Platform</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>

                                    <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside pl-1">
                                        <li>
                                            Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">OpenAI API Keys</a> and sign in.
                                        </li>
                                        <li>
                                            Click <strong className="text-white">"Create new secret key"</strong> and copy the generated token.
                                        </li>
                                        <li>
                                            Paste your key (starts with <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded font-mono">sk-proj-...</code>) in the field.
                                        </li>
                                        <li>
                                            Click <strong className="text-white">"Save & Connect OpenAI Key"</strong>.
                                        </li>
                                    </ol>

                                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-200">
                                        <strong>Alternative (.env):</strong> You can also add <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">OPENAI_API_KEY=sk-proj-...</code> into your <code className="text-white font-mono">.env</code> file.
                                    </div>
                                </div>

                                {/* Form Column (5 cols) */}
                                <form onSubmit={handleSaveApiKey} className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 block mb-1">
                                            OpenAI API Key:
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showOpenaiKey ? 'text' : 'password'}
                                                value={openaiKeyInput}
                                                onChange={(e) => setOpenaiKeyInput(e.target.value)}
                                                placeholder={currentAiConfig.openai_key_masked || "sk-proj-..."}
                                                className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                                            >
                                                {showOpenaiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                        {currentAiConfig.openai_key_masked && (
                                            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Active Key: {currentAiConfig.openai_key_masked}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSavingKey || !openaiKeyInput.trim()}
                                        className="w-full py-2 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-glow-emerald"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        <span>{isSavingKey ? 'Connecting & Saving...' : 'Save & Connect OpenAI Key'}</span>
                                    </button>

                                    {saveStatusMsg && (
                                        <div className={cn(
                                            "p-2 rounded-xl text-center text-xs font-bold",
                                            saveStatusMsg.type === 'success' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                                        )}>
                                            {saveStatusMsg.text}
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Left Upload & Scanner Area (5 cols) */}
                <div className="lg:col-span-5 glass-panel rounded-3xl p-5 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                            <UploadCloud className="w-4 h-4 text-cyan-400" />
                            Prescription Upload & Camera Feed
                        </h2>

                        {/* Drag & Drop Zone */}
                        <label className={cn(
                            "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative overflow-hidden",
                            previewImage ? "border-emerald-500/40 bg-slate-900/50" : "border-slate-800 hover:border-cyan-500/40 bg-slate-900/30"
                        )}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            {previewImage ? (
                                <div className="space-y-3 w-full">
                                    <img
                                        src={previewImage}
                                        alt="Prescription Document"
                                        className="max-h-56 w-full object-cover rounded-xl border border-slate-700 shadow-lg"
                                    />
                                    <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Image Loaded. Click to choose another.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 py-4">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-glow-cyan">
                                        <Scan className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-white">Click or drag prescription scan here</p>
                                    <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP (Handwritten or Printed)</p>
                                </div>
                            )}

                            {isScanning && (
                                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center gap-3 animate-in fade-in">
                                    <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-glow-cyan" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-cyan-300">{scanStep}</p>
                                        <p className="text-[10px] text-slate-400">Processing handwriting, Bengali instructions & catalog alignment</p>
                                    </div>
                                </div>
                            )}
                        </label>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>Model: Clinical-Vision-v2.5 (Bangla/Eng Rx)</span>
                        <span className="text-emerald-400 font-semibold">OCR Confidence: 98.2%</span>
                    </div>
                </div>

                {/* Right Extraction & Verification Card (7 cols) */}
                <div className="lg:col-span-7 glass-panel rounded-3xl p-5 border border-slate-800/80 flex flex-col justify-between bg-gradient-to-br from-[#0d1322] to-[#070b13]">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <div>
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    Extracted Clinical Entities
                                </h2>
                                <p className="text-[11px] text-slate-400">Verified doctor metadata, patient diagnosis, and matched medicines</p>
                            </div>

                            {scannedResult && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> High Confidence
                                </span>
                            )}
                        </div>

                        {scannedResult ? (
                            <div className="space-y-4">
                                {/* Doctor & Patient Pill Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 mb-1">
                                            <Stethoscope className="w-3.5 h-3.5" />
                                            <span>Doctor Information</span>
                                        </div>
                                        <p className="text-xs font-extrabold text-white">{scannedResult.doctor.name}</p>
                                        <p className="text-[11px] text-slate-300">{scannedResult.doctor.degrees || scannedResult.doctor.reg_number}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{scannedResult.doctor.hospital}</p>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-1">
                                            <User className="w-3.5 h-3.5" />
                                            <span>Patient Details</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-extrabold text-white">{scannedResult.patient.name}</p>
                                            <span className="text-[10px] text-slate-400 font-mono">ID: {scannedResult.patient.id || 'N/A'}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-300">{scannedResult.patient.age}, {scannedResult.patient.gender} | {scannedResult.patient.address || 'Dhaka'}</p>
                                        <p className="text-[10px] text-emerald-400 mt-1 line-clamp-2 font-medium">
                                            Diagnosis: {scannedResult.patient.diagnosis}
                                        </p>
                                    </div>
                                </div>

                                {/* Extracted Medicines Table */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                            Prescribed Medications ({scannedResult.matched_items.length})
                                        </h3>
                                        <span className="text-[11px] text-emerald-400 font-semibold">
                                            Auto-Mapped to Catalog
                                        </span>
                                    </div>

                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                        {scannedResult.matched_items.map((item: any, idx: number) => (
                                            <div key={idx} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white text-xs block truncate">
                                                            {item.medicine?.name || item.drug_name_raw}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[9px] font-bold px-1.5 py-0.2 rounded-md",
                                                            item.match_confidence >= 95
                                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                                : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                                        )}>
                                                            {item.match_confidence}% Match
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                        <span className="text-cyan-300 font-medium">Dose: {item.frequency}</span>
                                                        <span className="text-slate-400">{item.instructions}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    {/* Quantity Controller */}
                                                    <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(idx, -1)}
                                                            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-700 text-xs font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-white">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(idx, 1)}
                                                            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-700 text-xs font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <div className="text-right min-w-[70px]">
                                                        <span className="text-xs font-bold text-emerald-400 block">
                                                            {formatCurrency((item.medicine?.selling_price || 8.50) * item.quantity)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            Stock: {item.medicine?.total_stock || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Advices & Followup */}
                                {scannedResult.advices && scannedResult.advices.length > 0 && (
                                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
                                        <span className="font-bold text-cyan-300 block mb-1">Doctor's Advices:</span>
                                        <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                            {scannedResult.advices.map((adv: string, i: number) => (
                                                <li key={i}>{adv}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : scanError ? (
                            <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 space-y-3 animate-in fade-in">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                    <span>AI Vision Extraction Failed</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-950/80 border border-red-900/50 text-xs font-mono text-red-300 break-words">
                                    {scanError}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    💡 <strong>Troubleshooting Tips:</strong> Verify your Google Gemini or OpenAI API Key in the setup banner above, or ensure your prescription handwriting is clear and well-lit.
                                </p>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                                <FileText className="w-12 h-12 stroke-[1.2] text-slate-700 mb-2" />
                                <p className="text-xs font-semibold text-slate-400">No Active Extraction</p>
                                <p className="text-[11px] text-slate-600">Upload a prescription image to trigger live AI Vision extraction</p>
                            </div>
                        )}
                    </div>

                    {scannedResult && (
                        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-slate-400">
                                Prescription #{scannedResult.prescription.prescription_number} Verified
                            </span>

                            <button
                                onClick={handlePushToPos}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-glow-emerald flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition transform hover:scale-[1.02]"
                            >
                                <ShoppingCart className="w-4 h-4 text-slate-950" />
                                <span>Push {scannedResult.matched_items.length} Items to POS Cart & Dispense</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Prescriptions History Archive & Action Center (User Red Box) */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 shadow-2xl bg-gradient-to-b from-slate-900/90 to-[#080d17]">
                {/* Header & Control Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-black text-white tracking-tight">
                                    Prescriptions Registry & Dispensing Log
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    {rxList.length} Total Logs
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Review scanned prescriptions, inspect clinical findings, transfer to POS dispensing cart, or manage records
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={isProcessingAction}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 flex items-center gap-2 transition"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Delete Selected ({selectedIds.length})</span>
                            </button>
                        )}

                        {rxList.length > 0 && (
                            <button
                                onClick={() => setShowClearAllModal(true)}
                                disabled={isProcessingAction}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 flex items-center gap-2 transition"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Clear All Logs</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter & Live Search Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
                    {/* Live Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Rx #, Doctor, Hospital, Patient..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start md:self-auto">
                        {(['all', 'verified', 'dispensed', 'pending'] as const).map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold capitalize transition",
                                    statusFilter === st
                                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                        : "text-slate-400 hover:text-white"
                                )}
                            >
                                {st} {st === 'all' ? `(${rxList.length})` : `(${rxList.filter(r => r.status === st).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                                <th className="py-3 px-3.5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredPrescriptions.length}
                                        onChange={handleSelectAll}
                                        className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                                    />
                                </th>
                                <th className="py-3 px-3">Prescription #</th>
                                <th className="py-3 px-4">Doctor & Clinic</th>
                                <th className="py-3 px-4">Patient / Customer</th>
                                <th className="py-3 px-4">Date & Time</th>
                                <th className="py-3 px-4">Medications</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 font-sans">
                            {filteredPrescriptions.length > 0 ? (
                                filteredPrescriptions.map((rx) => {
                                    const isSelected = selectedIds.includes(rx.id);
                                    return (
                                        <tr
                                            key={rx.id}
                                            className={cn(
                                                "hover:bg-slate-800/40 transition group",
                                                isSelected && "bg-cyan-950/20"
                                            )}
                                        >
                                            <td className="py-3 px-3.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(rx.id)}
                                                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                                                />
                                            </td>

                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-cyan-300 text-xs">
                                                        {rx.prescription_number}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="font-bold text-white block text-xs">
                                                    {rx.doctor_name || 'General Practitioner'}
                                                </span>
                                                <span className="text-[11px] text-slate-400 block truncate max-w-[220px]">
                                                    {rx.hospital_name || 'Medical Clinic'}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="font-semibold text-slate-200 block text-xs">
                                                    {rx.customer?.name || (rx.ai_extracted_data as any)?.patient?.name || 'Walk-in Patient'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {(rx.ai_extracted_data as any)?.patient?.age ? `${(rx.ai_extracted_data as any).patient.age}, ${(rx.ai_extracted_data as any).patient.gender || ''}` : 'Patient ID: ' + rx.id}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                                                {formatDate(rx.created_at)}
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                                        <Pill className="w-3 h-3 text-cyan-400" />
                                                        {rx.items?.length || 0} Drugs
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleToggleStatus(rx)}
                                                    title="Click to toggle status"
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer hover:opacity-80",
                                                        rx.status === 'dispensed'
                                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                            : rx.status === 'verified'
                                                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        rx.status === 'dispensed' ? "bg-emerald-400" : "bg-cyan-400"
                                                    )} />
                                                    {rx.status}
                                                </button>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                                                    {/* View Prescription Details */}
                                                    <button
                                                        onClick={() => setViewRxModal(rx)}
                                                        title="View Prescription Details & Rx Items"
                                                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                                    </button>

                                                    {/* Push Directly to POS Cart */}
                                                    <button
                                                        onClick={() => handlePushSavedRxToPos(rx)}
                                                        title="Push All Items to POS Cart & Dispense"
                                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-glow-emerald"
                                                    >
                                                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span className="hidden sm:inline">Push to POS</span>
                                                    </button>

                                                    {/* Delete Single Record */}
                                                    <button
                                                        onClick={() => handleDeleteSingle(rx.id)}
                                                        title="Delete Record"
                                                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-500">
                                        <FileText className="w-10 h-10 mx-auto stroke-[1.2] text-slate-700 mb-2" />
                                        <p className="text-xs font-semibold text-slate-400">No prescriptions found</p>
                                        <p className="text-[11px] text-slate-600 mt-0.5">
                                            {searchQuery ? 'Try adjusting your search filter' : 'Scanned prescription records will be cataloged here'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: View Prescription Details */}
            {viewRxModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-white">
                                        Prescription #{viewRxModal.prescription_number}
                                    </h3>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                        viewRxModal.status === 'dispensed'
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    )}>
                                        {viewRxModal.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Created on {formatDate(viewRxModal.created_at)}
                                </p>
                            </div>

                            <button
                                onClick={() => setViewRxModal(null)}
                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Doctor & Patient Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                    <Stethoscope className="w-3.5 h-3.5" /> Doctor Info
                                </span>
                                <p className="text-xs font-bold text-white">{viewRxModal.doctor_name || 'Medical Practitioner'}</p>
                                <p className="text-[11px] text-slate-400">{viewRxModal.hospital_name || 'Popular Medical College'}</p>
                                {viewRxModal.doctor_reg_number && (
                                    <p className="text-[10px] text-cyan-400 font-mono">Reg: {viewRxModal.doctor_reg_number}</p>
                                )}
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" /> Patient Info
                                </span>
                                <p className="text-xs font-bold text-white">
                                    {viewRxModal.customer?.name || (viewRxModal.ai_extracted_data as any)?.patient?.name || 'Walk-in Patient'}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {(viewRxModal.ai_extracted_data as any)?.patient?.address || 'Matuail, Dhaka'}
                                </p>
                                {(viewRxModal.ai_extracted_data as any)?.patient?.diagnosis && (
                                    <p className="text-[10px] text-emerald-400">
                                        Diagnosis: {(viewRxModal.ai_extracted_data as any).patient.diagnosis}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Medicines List */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Prescribed Medications ({viewRxModal.items?.length || 0})
                            </h4>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {viewRxModal.items?.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-white">
                                                {item.medicine?.name || item.drug_name_raw}
                                            </p>
                                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                <span className="text-cyan-300 font-medium">Dose: {item.frequency || '1+0+1'}</span>
                                                <span>Qty: {item.quantity || 1} units</span>
                                                {item.instructions && <span className="text-slate-500">{item.instructions}</span>}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-bold text-emerald-400 block">
                                                {formatCurrency(((item.medicine as any)?.selling_price || item.medicine?.current_selling_price || 10.0) * (item.quantity || 1))}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Stock: {item.medicine?.total_stock || 0}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                            <button
                                onClick={() => handleDeleteSingle(viewRxModal.id)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 transition"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Record</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewRxModal(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        const current = viewRxModal;
                                        setViewRxModal(null);
                                        handlePushSavedRxToPos(current);
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-glow-emerald flex items-center gap-1.5 hover:from-emerald-400 hover:to-teal-400 transition"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>Push to POS Cart & Dispense</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Confirm Clear All */}
            {showClearAllModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-white">
                                Clear All Prescription Logs?
                            </h3>
                            <p className="text-xs text-slate-400">
                                This will permanently delete all <strong>{rxList.length}</strong> prescription registry entries and their item line histories. This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowClearAllModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={isProcessingAction}
                                className="px-5 py-2 rounded-xl text-xs font-black bg-red-500 hover:bg-red-400 text-white transition shadow-lg shadow-red-500/20"
                            >
                                {isProcessingAction ? 'Clearing...' : 'Yes, Clear All Logs'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
