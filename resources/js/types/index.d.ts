export interface User {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'pharmacist' | 'cashier' | 'inventory_manager';
    phone?: string;
    avatar?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    is_active: boolean;
}

export interface GenericName {
    id: number;
    name: string;
    therapeutic_class?: string;
    description?: string;
    pregnancy_category?: string;
}

export interface Manufacturer {
    id: number;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    is_active: boolean;
}

export interface DosageForm {
    id: number;
    name: string;
    icon?: string;
}

export interface Unit {
    id: number;
    name: string;
    short_name: string;
}

export interface Batch {
    id: number;
    medicine_id: number;
    batch_number: string;
    expiry_date: string;
    cost_price: number | string;
    selling_price: number | string;
    initial_quantity: number;
    current_quantity: number;
    supplier_id?: number;
    is_active: boolean;
    days_until_expiry: number;
    expiry_status: 'critical' | 'warning' | 'good' | 'expired';
    is_expired: boolean;
    medicine?: Medicine;
    supplier?: Manufacturer;
}

export interface Medicine {
    id: number;
    name: string;
    brand_name?: string;
    sku: string;
    barcode?: string;
    generic_name_id?: number;
    category_id?: number;
    manufacturer_id?: number;
    dosage_form_id?: number;
    primary_unit_id?: number;
    secondary_unit_id?: number;
    unit_conversion_rate: number;
    strength?: string;
    storage_condition: string;
    min_stock_alert: number;
    is_prescription_required: boolean;
    is_controlled_substance: boolean;
    side_effects?: string;
    usage_instructions?: string;
    is_active: boolean;
    total_stock: number;
    current_selling_price: number;
    is_low_stock: boolean;
    generic_name?: GenericName;
    category?: Category;
    manufacturer?: Manufacturer;
    dosage_form?: DosageForm;
    primary_unit?: Unit;
    secondary_unit?: Unit;
    batches?: Batch[];
    active_batches?: Batch[];
}

export interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    total_credit: number | string;
    credit_limit: number | string;
    loyalty_points: number;
}

export interface PrescriptionItem {
    id?: number;
    prescription_id?: number;
    medicine_id?: number;
    drug_name_raw: string;
    dosage?: string;
    frequency?: string;
    duration_days: number;
    quantity: number;
    instructions?: string;
    match_confidence: number;
    is_dispensed?: boolean;
    medicine?: Medicine;
}

export interface Prescription {
    id: number;
    prescription_number: string;
    customer_id?: number;
    user_id?: number;
    doctor_name?: string;
    doctor_reg_number?: string;
    hospital_name?: string;
    prescription_date?: string;
    image_path?: string;
    raw_ocr_json?: any;
    ai_extracted_data?: any;
    status: 'pending' | 'verified' | 'dispensed' | 'cancelled';
    notes?: string;
    customer?: Customer;
    items?: PrescriptionItem[];
    created_at: string;
}

export interface SaleItem {
    id?: number;
    medicine_id: number;
    batch_id: number;
    unit_name: string;
    quantity: number;
    unit_price: number;
    cost_price?: number;
    discount_amount: number;
    tax_amount: number;
    total_price: number;
    medicine?: Medicine;
    batch?: Batch;
}

export interface Sale {
    id: number;
    invoice_number: string;
    customer_id?: number;
    user_id: number;
    prescription_id?: number;
    subtotal: number | string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number | string;
    discount_amount: number | string;
    tax_percentage: number | string;
    tax_amount: number | string;
    grand_total: number | string;
    paid_amount: number | string;
    change_amount: number | string;
    due_amount: number | string;
    payment_method: string;
    payment_status: 'paid' | 'partial' | 'unpaid' | 'refunded';
    notes?: string;
    is_returned: boolean;
    customer?: Customer;
    user?: User;
    items?: SaleItem[];
    created_at: string;
}

export interface DrugInteraction {
    id: number;
    generic_a_id: number;
    generic_b_id: number;
    severity: 'mild' | 'moderate' | 'severe' | 'fatal';
    description: string;
    clinical_management?: string;
    generic_a?: GenericName;
    generic_b?: GenericName;
}

export interface StockAdjustment {
    id: number;
    adjustment_number: string;
    medicine_id: number;
    batch_id?: number;
    user_id: number;
    type: 'addition' | 'deduction' | 'damage' | 'expired' | 'reconciliation';
    quantity: number;
    reason: string;
    notes?: string;
    medicine?: Medicine;
    batch?: Batch;
    user?: User;
    created_at: string;
}

export interface AuditLog {
    id: number;
    user_id?: number;
    action: string;
    entity_type: string;
    entity_id?: number;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    user?: User;
}

export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>> {
    auth: {
        user: User | null;
        available_users?: User[];
        roles?: Record<string, string>;
    };
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    app_info: {
        name: string;
        version: string;
        currency_symbol: string;
    };
}
