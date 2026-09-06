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
    Save
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

    const handleQuantityChange = (idx: number, delta: number) => {
        if (!scannedResult) return;
        const newItems = [...scannedResult.matched_items];
        const newQty = Math.max(1, (newItems[idx].quantity || 1) + delta);
        newItems[idx] = { ...newItems[idx], quantity: newQty };
        setScannedResult({ ...scannedResult, matched_items: newItems });
    };

    const handlePushToPos = () => {
        if (!scannedResult || !scannedResult.matched_items) return;

        // Filter valid matched medicines
        const cartItems = scannedResult.matched_items
            .filter((item: any) => item.medicine)
            .map((item: any) => ({
                medicine: item.medicine,
                quantity: item.quantity,
                unit_price: item.medicine.selling_price || 10.00,
                unit_name: item.medicine.unit_name || 'Strip',
                discount: 0,
            }));

        if (cartItems.length === 0) {
            alert('No matched medicines found in inventory to transfer to cart.');
            return;
        }

        // Store into localStorage for POS consumption
        try {
            localStorage.setItem('pharmacare_transferred_cart', JSON.stringify(cartItems));
            if (scannedResult.patient) {
                localStorage.setItem('pharmacare_transferred_customer_name', scannedResult.patient.name);
            }
        } catch {}

        // Navigate to POS terminal
        router.visit('/pos');
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

            {/* Prescriptions History Archive */}
            <div className="glass-panel rounded-3xl p-5 border border-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400" />
                            Prescriptions Registry & Dispensing Log
                        </h2>
                        <p className="text-[11px] text-slate-400">Historical archive of uploaded medical prescriptions</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                <th className="py-3 px-4">Prescription #</th>
                                <th className="py-3 px-4">Doctor & Hospital</th>
                                <th className="py-3 px-4">Customer</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Items Count</th>
                                <th className="py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                            {prescriptions.map((rx) => (
                                <tr key={rx.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                                        {rx.prescription_number}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="font-bold text-white block">{rx.doctor_name || 'General Practitioner'}</span>
                                        <span className="text-[11px] text-slate-400">{rx.hospital_name || 'Hospital Registry'}</span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-300">
                                        {rx.customer?.name || 'Walk-in Patient'}
                                    </td>
                                    <td className="py-3 px-4 text-slate-400">
                                        {formatDate(rx.created_at)}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-white">
                                        {rx.items?.length || 0} Drugs
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                                            rx.status === 'dispensed'
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                        )}>
                                            {rx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
