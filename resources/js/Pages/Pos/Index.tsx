import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    DollarSign,
    QrCode,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Printer,
    UserPlus,
    Tag,
    Clock,
    X,
    Sparkles,
    Check,
    Receipt,
    Zap,
    PauseCircle,
    PlayCircle,
    Bookmark,
    FolderDown,
    Percent,
    BadgePercent,
    SlidersHorizontal
} from 'lucide-react';
import { Medicine, Customer, Category, Sale } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { confirmDialog, toast } from '@/lib/notify';

interface PosMedicine {
    id: number;
    name: string;
    brand_name?: string;
    sku: string;
    barcode?: string;
    category?: string;
    generic_name?: string;
    dosage_form?: string;
    strength?: string;
    unit_name: string;
    primary_unit: string;
    unit_conversion_rate: number;
    total_stock: number;
    selling_price: number;
    cost_price: number;
    earliest_batch?: {
        id: number;
        batch_number: string;
        expiry_date: string;
        days_remaining: number;
        expiry_status: 'critical' | 'warning' | 'good' | 'expired';
    };
    is_rx_required: boolean;
    is_controlled: boolean;
}

interface CartItem {
    medicine: PosMedicine;
    quantity: number;
    unit_price: number;
    unit_name: string;
    discount: number;
}

interface HeldOrder {
    id: string;
    held_at: string;
    customer: Customer | null;
    cart: CartItem[];
    subtotal: number;
    grand_total: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    tax_percentage: number;
    payment_method: 'cash' | 'card' | 'digital_wallet' | 'credit';
    notes: string;
    note_label?: string;
}

interface Props {
    medicines: PosMedicine[];
    customers: Customer[];
    categories: Category[];
    store_settings?: any;
}

export default function PosIndex({ medicines, customers, categories, store_settings }: Props) {
    const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('search') ?? '');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

    // Payment & checkout
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital_wallet' | 'credit'>('cash');
    const [paidAmount, setPaidAmount] = useState<string>('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [taxPercentage, setTaxPercentage] = useState<number>(store_settings?.default_tax_rate != null ? Number(store_settings.default_tax_rate) : 5.0);
    const [showDiscountDrawer, setShowDiscountDrawer] = useState<boolean>(false);
    const [showTaxDrawer, setShowTaxDrawer] = useState<boolean>(false);
    const [notes, setNotes] = useState('');

    // Held Orders State
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
        try {
            const saved = localStorage.getItem('pharmacare_held_orders');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [showHeldModal, setShowHeldModal] = useState(false);
    const [showHoldPromptModal, setShowHoldPromptModal] = useState(false);
    const [holdNoteInput, setHoldNoteInput] = useState('');

    // DDI Safety Warning State
    const [safetyWarning, setSafetyWarning] = useState<any | null>(null);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [safetyOverrideAcknowledged, setSafetyOverrideAcknowledged] = useState(false);

    // Receipt Modal State
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Cart UX: scroll to & briefly highlight the line that was just added/changed.
    const cartListRef = useRef<HTMLDivElement>(null);
    const [touched, setTouched] = useState<{ id: number; tick: number } | null>(null);
    const markTouched = (id: number) => setTouched((t) => ({ id, tick: (t?.tick ?? 0) + 1 }));

    useEffect(() => {
        if (!touched) return;
        const row = cartListRef.current?.querySelector<HTMLElement>(`[data-cart-id="${touched.id}"]`);
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        const t = window.setTimeout(() => setTouched((cur) => (cur?.tick === touched.tick ? null : cur)), 1200);
        return () => window.clearTimeout(t);
    }, [touched]);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-load items transferred from AI Prescription Scanner
    useEffect(() => {
        try {
            const transferred = localStorage.getItem('pharmacare_transferred_cart');
            if (transferred) {
                const parsed = JSON.parse(transferred);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCart(parsed);
                    localStorage.removeItem('pharmacare_transferred_cart');
                }
            }

            const transferredCustomer = localStorage.getItem('pharmacare_transferred_customer_name');
            if (transferredCustomer) {
                const found = customers.find(c => c.name.toLowerCase().includes(transferredCustomer.toLowerCase()));
                if (found) {
                    setSelectedCustomer(found);
                }
                localStorage.removeItem('pharmacare_transferred_customer_name');
            }
        } catch {}
    }, []);

    // Sync held orders to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('pharmacare_held_orders', JSON.stringify(heldOrders));
        } catch {}
    }, [heldOrders]);

    // Keyboard shortcuts (F2 Search, F8 Checkout, F9 Hold Cart)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F8' && cart.length > 0) {
                e.preventDefault();
                handleCheckout();
            } else if (e.key === 'F9' && cart.length > 0) {
                e.preventDefault();
                setShowHoldPromptModal(true);
            } else if (e.key === 'Escape') {
                setShowSafetyModal(false);
                setShowReceiptModal(false);
                setShowHeldModal(false);
                setShowHoldPromptModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, heldOrders]);

    // Check DDI Safety whenever cart medicine IDs change
    useEffect(() => {
        if (cart.length >= 2) {
            const medicineIds = cart.map(item => item.medicine.id);
            fetch('/pos/check-safety', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ medicine_ids: medicineIds }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.has_interactions && (data.max_severity === 'severe' || data.max_severity === 'fatal')) {
                    setSafetyWarning(data);
                    if (!safetyOverrideAcknowledged) {
                        setShowSafetyModal(true);
                    }
                } else {
                    setSafetyWarning(data.has_interactions ? data : null);
                }
            })
            .catch(() => {});
        } else {
            setSafetyWarning(null);
            setSafetyOverrideAcknowledged(false);
        }
    }, [cart]);

    // Cart calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price - item.discount), 0);
    const discountAmount = discountType === 'percentage' ? (subtotal * (discountValue / 100)) : discountValue;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxableAmount * (taxPercentage / 100);
    const grandTotal = taxableAmount + taxAmount;

    // Set default paid amount when grandTotal changes
    useEffect(() => {
        setPaidAmount(grandTotal.toFixed(2));
    }, [grandTotal]);

    const changeAmount = Math.max(0, (parseFloat(paidAmount) || 0) - grandTotal);
    const dueAmount = Math.max(0, grandTotal - (parseFloat(paidAmount) || 0));

    const addToCart = (med: PosMedicine) => {
        if (med.total_stock <= 0) {
            toast.warning(`${med.name} is out of stock.`);
            return;
        }
        const inCart = cart.find((item) => item.medicine.id === med.id);
        if (inCart && inCart.quantity + 1 > med.total_stock) {
            toast.warning(`Only ${med.total_stock} ${med.unit_name || 'units'} of ${med.name} in stock.`);
            return;
        }

        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.medicine.id === med.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                const newQty = updated[existingIndex].quantity + 1;
                if (newQty > med.total_stock) return prev;
                updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
                return updated;
            } else {
                return [...prev, {
                    medicine: med,
                    quantity: 1,
                    unit_price: med.selling_price,
                    unit_name: med.unit_name,
                    discount: 0,
                }];
            }
        });
        markTouched(med.id);
    };

    const updateQuantity = (medicineId: number, delta: number) => {
        const target = cart.find((item) => item.medicine.id === medicineId);
        if (target && delta > 0 && target.quantity + delta > target.medicine.total_stock) {
            toast.warning(`Only ${target.medicine.total_stock} in stock.`);
            return;
        }
        setCart(prev => {
            return prev.map(item => {
                if (item.medicine.id === medicineId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    if (newQty > item.medicine.total_stock) return item;
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(Boolean) as CartItem[];
        });
        if (delta > 0) markTouched(medicineId);
    };

    // Typed quantity (e.g. 30 tablets) — clamped to available stock.
    const setQuantity = (medicineId: number, value: string) => {
        const qty = parseInt(value, 10);
        if (!Number.isFinite(qty) || qty < 1) return;
        const target = cart.find((item) => item.medicine.id === medicineId);
        if (!target) return;
        const max = target.medicine.total_stock;
        if (qty > max) toast.warning(`Only ${max} of ${target.medicine.name} in stock.`);
        const next = Math.min(qty, max);
        setCart((prev) => prev.map((item) => (item.medicine.id === medicineId ? { ...item, quantity: next } : item)));
    };

    const removeFromCart = (medicineId: number) => {
        setCart(prev => prev.filter(item => item.medicine.id !== medicineId));
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setDiscountValue(0);
        setNotes('');
        setSafetyOverrideAcknowledged(false);
    };

    // Hold Order Logic
    const confirmHoldOrder = () => {
        if (cart.length === 0) return;

        const newHeldOrder: HeldOrder = {
            id: 'HOLD-' + Date.now().toString().slice(-6),
            held_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            customer: selectedCustomer,
            cart: [...cart],
            subtotal,
            grand_total: grandTotal,
            discount_type: discountType,
            discount_value: discountValue,
            tax_percentage: taxPercentage,
            payment_method: paymentMethod,
            notes,
            note_label: holdNoteInput.trim() || (selectedCustomer ? `Held for ${selectedCustomer.name}` : `Walk-in Order (${cart.length} items)`),
        };

        setHeldOrders(prev => [newHeldOrder, ...prev]);
        clearCart();
        setShowHoldPromptModal(false);
        setHoldNoteInput('');
    };

    const resumeHeldOrder = async (order: HeldOrder) => {
        if (cart.length > 0) {
            const confirmSwap = await confirmDialog({
                title: 'Replace the current cart?',
                message: 'The items in your cart will be replaced by this held order.',
                confirmLabel: 'Replace cart',
            });
            if (!confirmSwap) return;
        }

        setCart(order.cart);
        setSelectedCustomer(order.customer);
        setDiscountType(order.discount_type);
        setDiscountValue(order.discount_value);
        setTaxPercentage(order.tax_percentage);
        setPaymentMethod(order.payment_method);
        setNotes(order.notes);

        // Remove from held orders
        setHeldOrders(prev => prev.filter(o => o.id !== order.id));
        setShowHeldModal(false);
    };

    const deleteHeldOrder = (orderId: string) => {
        setHeldOrders(prev => prev.filter(o => o.id !== orderId));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (safetyWarning && (safetyWarning.max_severity === 'severe' || safetyWarning.max_severity === 'fatal') && !safetyOverrideAcknowledged) {
            setShowSafetyModal(true);
            return;
        }

        setIsProcessing(true);

        try {
            const payload = {
                cart: cart.map(item => ({
                    medicine_id: item.medicine.id,
                    quantity: item.quantity,
                    unit_name: item.unit_name,
                    unit_price: item.unit_price,
                    discount: item.discount,
                })),
                payment: {
                    method: paymentMethod,
                    paid_amount: parseFloat(paidAmount) || grandTotal,
                    customer_id: selectedCustomer?.id || null,
                    discount_type: discountType,
                    discount_value: discountValue,
                    tax_percentage: taxPercentage,
                    notes: notes,
                },
            };

            const res = await fetch('/pos/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (result.success) {
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.8 },
                });
                setCompletedSale(result.sale);
                setShowReceiptModal(true);
                clearCart();
            } else {
                toast.error(result.message || 'Please check the cart and try again.', 'Checkout failed');
            }
        } catch (err: any) {
            toast.error(err.message, 'Checkout failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Filtered medicine items
    const filteredMedicines = medicines.filter(med => {
        const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            med.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (med.barcode && med.barcode.includes(searchTerm));
        const matchesCategory = !selectedCategory || med.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <AuthenticatedLayout
            activeTab="pos"
            fullHeight
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                            <span>Point of Sale</span>
                        </h1>
                        <p className="text-sm text-slate-400 mt-1 [@media(max-height:860px)]:lg:hidden">
                            Search or scan medicines, then take payment. The batch closest to expiry is used automatically.
                        </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                        {/* Held Orders Button with Badge */}
                        <button
                            onClick={() => setShowHeldModal(true)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition relative",
                                heldOrders.length > 0
                                    ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm"
                                    : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                            )}
                        >
                            <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Held Orders ({heldOrders.length})</span>
                            {heldOrders.length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
                            )}
                        </button>

                        {safetyWarning && (
                            <button
                                onClick={() => setShowSafetyModal(true)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition animate-pulse",
                                    safetyWarning.max_severity === 'fatal' || safetyWarning.max_severity === 'severe'
                                        ? "bg-rose-500 text-paper shadow-glow-rose"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                )}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                <span>{safetyWarning.interactions.length} DDI Alerts</span>
                            </button>
                        )}

                        <div className="hidden md:block px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
                            Shortcuts: <kbd className="text-cyan-400">F2</kbd> Search | <kbd className="text-amber-400">F9</kbd> Hold | <kbd className="text-emerald-400">F8</kbd> Pay
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Point of Sale" />

            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden items-center bg-slate-900 border border-slate-800 rounded-xl p-1 mb-4">
                <button
                    type="button"
                    onClick={() => setMobileTab('catalog')}
                    className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5",
                        mobileTab === 'catalog' ? "bg-emerald-500 text-ink shadow" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Search className="w-3.5 h-3.5" />
                    <span>Catalog ({filteredMedicines.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('cart')}
                    className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 relative",
                        mobileTab === 'cart' ? "bg-emerald-500 text-ink shadow" : "text-slate-400 hover:text-white"
                    )}
                >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Cart ({cart.length}) - {formatCurrency(grandTotal)}</span>
                    {cart.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5 right-2" />
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[calc(100dvh-170px)] lg:min-h-[520px] lg:h-full">
                {/* Left Area: Medicine Grid & Catalog (8 cols) */}
                <div className={cn("lg:col-span-7 2xl:col-span-8 flex flex-col h-full overflow-hidden", mobileTab !== 'catalog' && "hidden lg:flex")}>
                    {/* Search & Category Pills */}
                    <div className="glass-panel rounded-2xl p-3 mb-4 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Scan Barcode or Type Medicine Name / Generic (F2)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Medicines Grid (FEFO Display) */}
                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 content-start gap-3">
                        {filteredMedicines.map((med) => (
                            <div
                                key={med.id}
                                onClick={() => addToCart(med)}
                                className={cn(
                                    "glass-card-interactive rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer border relative group select-none",
                                    med.total_stock <= 0
                                        ? "opacity-50 pointer-events-none border-slate-800"
                                        : "border-slate-800/90 hover:border-emerald-500/50"
                                )}
                            >
                                <div>
                                    {/* Top badges: FEFO Earliest Batch Pill */}
                                    <div className="flex items-center justify-between gap-1 mb-2">
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                            <Zap className="w-2.5 h-2.5" />
                                            FEFO {med.earliest_batch?.batch_number || 'AUTO'}
                                        </span>
                                        <span className={cn(
                                            "text-[11px] font-bold px-1.5 py-0.5 rounded",
                                            med.earliest_batch && med.earliest_batch.days_remaining <= 30
                                                ? "bg-rose-500/20 text-rose-300"
                                                : "bg-slate-800 text-slate-400"
                                        )}>
                                            {med.earliest_batch ? `${med.earliest_batch.days_remaining}d left` : 'Fresh'}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-white text-sm leading-snug group-hover:text-emerald-300 transition">
                                        {med.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 line-clamp-1">
                                        {med.generic_name} ({med.strength || 'Standard'})
                                    </p>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] text-slate-500 block">Retail Price</span>
                                        <span className="text-base font-extrabold text-emerald-400">
                                            {formatCurrency(med.selling_price)}
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[11px] text-slate-500 block">In Vault</span>
                                        <span className={cn(
                                            "text-xs font-bold",
                                            med.total_stock <= 10 ? "text-amber-400" : "text-white"
                                        )}>
                                            {med.total_stock} {med.unit_name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Floating Cart Action */}
                    {cart.length > 0 && (
                        <div
                            onClick={() => setMobileTab('cart')}
                            className="lg:hidden mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-ink font-bold flex items-center justify-between shadow-glow-emerald cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-xs">{cart.length} item{cart.length > 1 ? 's' : ''} in cart</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <span>{formatCurrency(grandTotal)}</span>
                                <span className="text-[11px] bg-slate-950 text-white px-2 py-0.5 rounded-lg ml-1.5">Checkout &rarr;</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Area: Cart & payment */}
                <div className={cn("lg:col-span-5 2xl:col-span-4 glass-panel rounded-2xl border border-slate-800/80 flex flex-col h-full lg:overflow-hidden shadow-2xl bg-gradient-to-b from-panel to-deep", mobileTab !== 'cart' && "hidden lg:flex")}>
                    {/* Header: title, hold/clear, customer (never shrinks) */}
                    <div className="shrink-0 px-3 py-2.5 border-b border-slate-800 flex items-center gap-2">
                        <h2 className="font-bold text-white text-base flex items-center gap-1.5 shrink-0">
                            <ShoppingCart className="w-5 h-5 text-emerald-400" />
                            <span className="sr-only sm:not-sr-only">Cart</span>
                            <span
                                className={cn(
                                    "min-w-[1.5rem] text-center text-xs font-bold px-1.5 py-0.5 rounded-full border",
                                    cart.length > 0 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
                                )}
                                aria-label={`${cart.length} items`}
                            >
                                {cart.length}
                            </span>
                        </h2>

                        <label htmlFor="pos-customer" className="sr-only">Customer</label>
                        <select
                            id="pos-customer"
                            value={selectedCustomer?.id || ''}
                            onChange={(e) => {
                                const id = parseInt(e.target.value);
                                const found = customers.find(c => c.id === id) || null;
                                setSelectedCustomer(found);
                            }}
                            className="flex-1 min-w-0 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-300 pl-3 pr-8 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="">Walk-in customer</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.phone}) — due {formatCurrency(c.total_credit)}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => setShowHoldPromptModal(true)}
                            disabled={cart.length === 0}
                            title="Hold this order (F9)"
                            aria-label="Hold this order"
                            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <PauseCircle className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={clearCart}
                            disabled={cart.length === 0}
                            title="Clear cart"
                            aria-label="Clear cart"
                            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Cart lines — the only part that scrolls */}
                    <div ref={cartListRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 space-y-1.5" aria-label="Cart items">
                        {cart.length === 0 ? (
                            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6">
                                <ShoppingCart className="w-12 h-12 stroke-[1.2] text-slate-600 mb-2" />
                                <p className="text-sm font-semibold text-slate-300">Cart is empty</p>
                                <p className="text-sm text-slate-500 mt-0.5">Click a medicine or scan a barcode to add it.</p>
                                {heldOrders.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowHeldModal(true)}
                                        className="mt-3 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/40 text-sm font-bold hover:bg-amber-500/25 transition flex items-center gap-1.5"
                                    >
                                        <FolderDown className="w-4 h-4" />
                                        Resume a held order ({heldOrders.length})
                                    </button>
                                )}
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.medicine.id}
                                    data-cart-id={item.medicine.id}
                                    className={cn(
                                        "flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-1.5 pl-3 pr-1.5 py-2 rounded-xl border transition-colors duration-500",
                                        touched?.id === item.medicine.id
                                            ? "bg-emerald-500/10 border-emerald-500/50"
                                            : "bg-slate-900/80 border-slate-800"
                                    )}
                                >
                                    <div className="basis-full sm:basis-0 sm:flex-1 min-w-0 pr-1.5 sm:pr-0">
                                        <p className="text-sm font-semibold text-white truncate" title={item.medicine.name}>
                                            {item.medicine.name}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {formatCurrency(item.unit_price)} / {item.unit_name}
                                            {item.medicine.earliest_batch?.batch_number && (
                                                <span className="text-emerald-400"> · Batch {item.medicine.earliest_batch.batch_number}</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Quantity: − [type] + */}
                                    <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.medicine.id, -1)}
                                            aria-label={item.quantity === 1 ? `Remove ${item.medicine.name}` : `Decrease ${item.medicine.name}`}
                                            className="w-7 h-8 flex items-center justify-center text-slate-400 hover:text-white"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={1}
                                            max={item.medicine.total_stock}
                                            value={item.quantity}
                                            onFocus={(e) => e.currentTarget.select()}
                                            onChange={(e) => setQuantity(item.medicine.id, e.target.value)}
                                            aria-label={`Quantity of ${item.medicine.name}`}
                                            className="no-spinner w-10 h-8 p-0 text-center text-sm font-bold text-white bg-transparent border-0 focus:ring-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.medicine.id, 1)}
                                            aria-label={`Increase ${item.medicine.name}`}
                                            className="w-7 h-8 flex items-center justify-center text-slate-400 hover:text-white"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <p className="ml-auto sm:ml-0 sm:w-[76px] shrink-0 text-right text-sm font-bold text-emerald-400 tabular-nums">
                                        {formatCurrency(item.quantity * item.unit_price)}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.medicine.id)}
                                        aria-label={`Remove ${item.medicine.name}`}
                                        title="Remove"
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals & payment (never shrinks) */}
                    <div className="shrink-0 px-4 py-3 bg-slate-900/90 border-t border-slate-800 space-y-2.5">
                        <div className="space-y-0.5 text-sm text-slate-400">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="text-white font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDiscountDrawer(!showDiscountDrawer);
                                        if (showTaxDrawer) setShowTaxDrawer(false);
                                    }}
                                    aria-expanded={showDiscountDrawer}
                                    className="flex items-center gap-1.5 hover:text-cyan-300 transition"
                                >
                                    <Tag className="w-3.5 h-3.5" />
                                    Discount{discountValue > 0 ? ` (${discountType === 'percentage' ? `${discountValue}%` : 'flat'})` : ''}
                                    <span className="text-xs px-1.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                                        {discountValue > 0 ? 'edit' : 'add'}
                                    </span>
                                </button>
                                <span className={cn("tabular-nums", discountValue > 0 ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                                    {discountValue > 0 ? `−${formatCurrency(discountAmount)}` : '—'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTaxDrawer(!showTaxDrawer);
                                        if (showDiscountDrawer) setShowDiscountDrawer(false);
                                    }}
                                    aria-expanded={showTaxDrawer}
                                    className="flex items-center gap-1.5 hover:text-cyan-300 transition"
                                >
                                    <Percent className="w-3.5 h-3.5" />
                                    VAT ({taxPercentage}%)
                                    <span className="text-xs px-1.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">change</span>
                                </button>
                                <span className="text-white font-medium tabular-nums">{formatCurrency(taxAmount)}</span>
                            </div>
                        </div>

                        {/* Discount Config Drawer */}
                        {showDiscountDrawer && (
                            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-300">Discount Mode:</span>
                                    <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setDiscountType('percentage')}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[11px] font-bold transition",
                                                discountType === 'percentage' ? "bg-cyan-500 text-ink" : "text-slate-400 hover:text-white"
                                            )}
                                        >
                                            % Percent
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDiscountType('fixed')}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[11px] font-bold transition",
                                                discountType === 'fixed' ? "bg-cyan-500 text-ink" : "text-slate-400 hover:text-white"
                                            )}
                                        >
                                            ৳ Flat (BDT)
                                        </button>
                                    </div>
                                </div>

                                {/* Preset Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                    {discountType === 'percentage' ? (
                                        [0, 5, 7.5, 10, 15, 20].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setDiscountValue(val)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition",
                                                    discountValue === val
                                                        ? "bg-emerald-500 text-ink font-black shadow-sm"
                                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                )}
                                            >
                                                {val === 0 ? 'None' : `${val}%`}
                                            </button>
                                        ))
                                    ) : (
                                        [0, 20, 50, 100, 200, 500].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setDiscountValue(val)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition",
                                                    discountValue === val
                                                        ? "bg-emerald-500 text-ink font-black shadow-sm"
                                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                )}
                                            >
                                                {val === 0 ? '৳0' : `৳${val}`}
                                            </button>
                                        ))
                                    )}
                                </div>

                                {/* Custom Input */}
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[11px] text-slate-400">Custom Value:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step={discountType === 'percentage' ? '0.5' : '1'}
                                        value={discountValue || ''}
                                        placeholder={discountType === 'percentage' ? 'e.g. 12' : 'e.g. 150'}
                                        onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold focus:outline-none focus:border-cyan-500"
                                    />
                                    {discountValue > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setDiscountValue(0)}
                                            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 px-1.5 py-1 bg-rose-500/10 rounded-md border border-rose-500/20"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tax / VAT Config Drawer */}
                        {showTaxDrawer && (
                            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-300">Govt VAT / Tax Setting:</span>
                                    <span className="text-[11px] text-cyan-400 font-bold">Active: {taxPercentage}%</span>
                                </div>

                                {/* Quick VAT Preset Pills */}
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[
                                        { label: '0% Exempt', val: 0 },
                                        { label: '5% Std', val: 5 },
                                        { label: '7.5%', val: 7.5 },
                                        { label: '10%', val: 10 },
                                        { label: '15%', val: 15 },
                                    ].map((preset) => (
                                        <button
                                            key={preset.val}
                                            type="button"
                                            onClick={() => setTaxPercentage(preset.val)}
                                            className={cn(
                                                "py-1.5 rounded-lg text-[11px] font-bold transition text-center",
                                                taxPercentage === preset.val
                                                    ? "bg-cyan-500 text-ink font-black shadow-sm"
                                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom VAT Input */}
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[11px] text-slate-400">Custom Tax Rate (%):</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={taxPercentage}
                                        onChange={(e) => setTaxPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-24 text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold focus:outline-none focus:border-cyan-500"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">%</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                            <span className="text-base font-bold text-white">Total</span>
                            <span className="text-2xl font-black text-emerald-400 tabular-nums">{formatCurrency(grandTotal)}</span>
                        </div>

                        {/* Payment method */}
                        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Payment method">
                            {(['cash', 'card', 'digital_wallet', 'credit'] as const).map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    role="radio"
                                    aria-checked={paymentMethod === method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={cn(
                                        "py-1.5 rounded-xl text-xs font-bold transition",
                                        paymentMethod === method
                                            ? "bg-emerald-500 text-ink shadow"
                                            : "bg-slate-800 text-slate-400 hover:text-white"
                                    )}
                                >
                                    {{ cash: 'Cash', card: 'Card', digital_wallet: 'bKash / MFS', credit: 'Credit' }[method]}
                                </button>
                            ))}
                        </div>

                        {/* Cash received & change */}
                        {paymentMethod === 'cash' && (
                            <div className="flex items-center gap-2">
                                <label htmlFor="pos-cash-received" className="text-xs text-slate-400 font-semibold shrink-0">Received</label>
                                <input
                                        id="pos-cash-received"
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        value={paidAmount}
                                        placeholder={grandTotal.toFixed(2)}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        className="no-spinner flex-1 min-w-0 text-sm bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                <span className="text-xs text-slate-400 font-semibold shrink-0">Change</span>
                                <span className="shrink-0 min-w-[84px] text-right text-sm text-cyan-400 font-bold tabular-nums" aria-live="polite">
                                    {formatCurrency(changeAmount)}
                                </span>
                            </div>
                        )}

                        <button
                            type="button"
                            disabled={cart.length === 0 || isProcessing}
                            onClick={handleCheckout}
                            className={cn(
                                "w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                                cart.length === 0 || isProcessing
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-ink hover:from-emerald-400 hover:to-teal-400 shadow-glow-emerald"
                            )}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isProcessing ? 'Processing…' : `Complete sale · ${formatCurrency(grandTotal)}`}
                            {!isProcessing && cart.length > 0 && <kbd className="hidden lg:inline text-[11px] font-mono opacity-70">F8</kbd>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hold Order Prompt Modal */}
            {showHoldPromptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-md p-6 border border-amber-500/40 shadow-2xl relative bg-panel">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <PauseCircle className="w-5 h-5 text-amber-400" />
                                <h3 className="text-sm font-bold text-white">Hold Active Order</h3>
                            </div>
                            <button onClick={() => setShowHoldPromptModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="my-4 space-y-3">
                            <p className="text-xs text-slate-300">
                                This will suspend the current cart of <strong className="text-white">{cart.length} items ({formatCurrency(grandTotal)})</strong> so you can serve the next customer.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                    Customer Label / Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={selectedCustomer ? `Held for ${selectedCustomer.name}` : "e.g. Customer picking extra item..."}
                                    value={holdNoteInput}
                                    onChange={(e) => setHoldNoteInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') confirmHoldOrder();
                                    }}
                                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                onClick={() => setShowHoldPromptModal(false)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmHoldOrder}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-ink shadow-sm"
                            >
                                Confirm & Hold Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Held Orders List Modal */}
            {showHeldModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-2xl p-6 border border-slate-700 shadow-2xl relative bg-panel">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <FolderDown className="w-5 h-5 text-amber-400" />
                                <h3 className="text-sm font-bold text-white">Suspended / Held Orders ({heldOrders.length})</h3>
                            </div>
                            <button onClick={() => setShowHeldModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="my-4 space-y-3 max-h-96 overflow-y-auto pr-1">
                            {heldOrders.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-xs">
                                    No held orders at this moment.
                                </div>
                            ) : (
                                heldOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs font-bold text-amber-400">{order.id}</span>
                                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {order.held_at}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-white text-xs truncate">
                                                {order.note_label || (order.customer ? `Customer: ${order.customer.name}` : 'Walk-in Retail')}
                                            </h4>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {order.cart.map(c => `${c.medicine.name} (x${c.quantity})`).join(', ')}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                                            <div className="text-right">
                                                <span className="text-[11px] text-slate-500 block">Total</span>
                                                <span className="text-sm font-extrabold text-emerald-400">
                                                    {formatCurrency(order.grand_total)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => deleteHeldOrder(order.id)}
                                                    title="Discard this held order"
                                                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => resumeHeldOrder(order)}
                                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-ink flex items-center gap-1.5 shadow-sm transition"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    <span>Resume Order</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-800">
                            <button
                                onClick={() => setShowHeldModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DDI Safety Warning Modal (Clinical Shield) */}
            {showSafetyModal && safetyWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-xl p-6 border border-rose-500/50 shadow-2xl relative bg-gradient-to-b from-rose-950/30 via-slate-900 to-deep">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-rose-500/30">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-glow-rose">
                                <ShieldAlert className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-rose-400 uppercase tracking-tight">
                                    Drug-Drug Interaction Warning
                                </h3>
                                <p className="text-xs text-slate-300">
                                    Clinical Contraindication Detected in Current Cart
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {safetyWarning.interactions.map((ddi: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white">
                                            {ddi.drug_a} + {ddi.drug_b}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider",
                                            ddi.severity === 'fatal' ? "bg-red-600 text-paper" : "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                                        )}>
                                            {ddi.severity} Hazard
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                        {ddi.description}
                                    </p>
                                    {ddi.clinical_management && (
                                        <div className="mt-2 text-xs font-semibold text-emerald-300 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                                            💡 Clinical Advice: {ddi.clinical_management}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setShowSafetyModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                            >
                                Edit Cart Items
                            </button>

                            <button
                                onClick={() => {
                                    setSafetyOverrideAcknowledged(true);
                                    setShowSafetyModal(false);
                                }}
                                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-paper shadow-glow-rose transition"
                            >
                                Pharmacist Override & Push
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && completedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
                    <div className="glass-panel-elevated rounded-3xl w-full max-w-md p-6 border border-slate-700 shadow-2xl relative bg-panel">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-sm font-bold text-white">Dispensing Invoice</h3>
                            </div>
                            <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Thermal Receipt Simulator */}
                        <div
                            id="pos-thermal-slip"
                            className="stock-colors my-4 p-4 rounded-2xl bg-white text-slate-950 font-mono text-xs shadow-inner space-y-2 border border-slate-200"
                        >
                            <div className="text-center border-b border-slate-300 pb-2">
                                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-950">
                                    {store_settings?.store_name || 'PHARMACARE AI RX'}
                                </h4>
                                {store_settings?.store_tagline && (
                                    <p className="text-[11px] text-slate-700">{store_settings.store_tagline}</p>
                                )}
                                {store_settings?.address && (
                                    <p className="text-[11px] text-slate-600 mt-0.5">{store_settings.address}</p>
                                )}
                                {store_settings?.phone && (
                                    <p className="text-[11px] text-slate-600">Tel: {store_settings.phone}</p>
                                )}
                                {(store_settings?.show_license_on_receipt !== false) && (
                                    <div className="text-[11px] text-slate-600 mt-0.5">
                                        {store_settings?.drug_license_no && <div>{store_settings.drug_license_no}</div>}
                                        {store_settings?.vat_reg_no && <div>{store_settings.vat_reg_no}</div>}
                                    </div>
                                )}
                            </div>

                            <div className="text-[11px] space-y-0.5 border-b border-slate-300 pb-2">
                                <div>Invoice: <span className="font-bold">{completedSale.invoice_number}</span></div>
                                <div>Date: {formatDate(completedSale.created_at)}</div>
                                <div>Customer: {completedSale.customer?.name || 'Walk-in Cash'}</div>
                                <div>Cashier: {completedSale.user?.name || 'Pharmacist'}</div>
                            </div>

                            {/* Items List */}
                            <div className="border-b border-slate-300 pb-2 space-y-1">
                                {completedSale.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs">
                                        <div>
                                            <span className="font-bold">{item.medicine?.name}</span>
                                            <span className="text-[11px] block text-slate-600">
                                                Qty: {item.quantity} x {formatCurrency(item.unit_price)} (FEFO: {item.batch?.batch_number})
                                            </span>
                                        </div>
                                        <span className="font-bold">{formatCurrency(item.total_price)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-right space-y-0.5 pt-1 text-xs">
                                <div className="flex justify-between text-xs">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(completedSale.subtotal)}</span>
                                </div>
                                {Number(completedSale.discount_amount) > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-700 font-bold">
                                        <span>Discount ({completedSale.discount_type === 'percentage' ? `${completedSale.discount_value}%` : 'Flat'}):</span>
                                        <span>-{formatCurrency(completedSale.discount_amount)}</span>
                                    </div>
                                )}
                                {(store_settings?.show_tax_on_receipt !== false) && (
                                    <div className="flex justify-between text-xs">
                                        <span>Govt VAT / Tax ({completedSale.tax_percentage}%):</span>
                                        <span>{formatCurrency(completedSale.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
                                    <span>Grand Total:</span>
                                    <span>{formatCurrency(completedSale.grand_total)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>Paid ({completedSale.payment_method}):</span>
                                    <span>{formatCurrency(completedSale.paid_amount)}</span>
                                </div>
                                {Number(completedSale.change_amount) > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-700 font-bold">
                                        <span>Change Returned:</span>
                                        <span>{formatCurrency(completedSale.change_amount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-center pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                                {store_settings?.receipt_footer || 'Thank you for choosing PharmaCare AI! Quick healing.'}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const slip = document.getElementById('pos-thermal-slip');
                                    if (!slip) {
                                        window.print();
                                        return;
                                    }
                                    const width = store_settings?.thermal_printer_width === '58mm' ? '54mm' : '72mm';
                                    const pageSize = store_settings?.thermal_printer_width === '58mm' ? '58mm' : '80mm';
                                    const win = window.open('', '_blank', 'width=400,height=600');
                                    if (!win) {
                                        window.print();
                                        return;
                                    }
                                    win.document.write(`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <title>Receipt - ${completedSale.invoice_number}</title>
                                            <style>
                                                @page { margin: 0; size: ${pageSize} auto; }
                                                body {
                                                    font-family: 'Courier New', Courier, monospace;
                                                    font-size: 12px;
                                                    color: #000;
                                                    background: #fff;
                                                    margin: 0;
                                                    padding: 8px 6px;
                                                    width: ${width};
                                                }
                                                .text-center { text-align: center; }
                                                .text-right { text-align: right; }
                                                .font-bold { font-weight: bold; }
                                                .font-black { font-weight: 900; }
                                                .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                                                .border-t { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
                                                .flex { display: flex; justify-content: space-between; margin-bottom: 2px; }
                                                .text-xs { font-size: 10px; }
                                                .text-sm { font-size: 13px; }
                                                .text-emerald-700 { color: #000; font-weight: bold; }
                                            </style>
                                        </head>
                                        <body>
                                            ${slip.innerHTML}
                                            <script>
                                                window.onload = function() {
                                                    window.focus();
                                                    window.print();
                                                    setTimeout(function() { window.close(); }, 500);
                                                };
                                            </script>
                                        </body>
                                        </html>
                                    `);
                                    win.document.close();
                                }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-ink flex items-center justify-center gap-1.5 shadow-glow-emerald"
                            >
                                <Printer className="w-4 h-4" /> Print Thermal Receipt
                            </button>
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                            >
                                New Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
