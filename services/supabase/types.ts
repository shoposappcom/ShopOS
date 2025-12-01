// Database types for Supabase (snake_case to match database columns)
// These are used for raw database operations

export interface DbShopSettings {
  shop_id: string;
  business_name: string;
  address: string;
  phone: string;
  country: string;
  state: string;
  currency: string;
  receipt_footer: string;
  tax_rate: number;
  auto_backup: 'off' | 'daily' | 'weekly' | 'monthly';
  last_backup_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  shop_id: string | null;
  username: string;
  password: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: 'superadmin' | 'admin' | 'manager' | 'cashier' | 'stock_clerk';
  status: 'active' | 'inactive';
  language: 'en' | 'ha' | 'yo' | 'ig' | 'ar' | 'fr';
  profile_photo: string | null;
  is_archived: boolean;
  last_login: string | null;
  created_at: string;
}

export interface DbCategory {
  id: string;
  shop_id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbSupplier {
  id: string;
  shop_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  address: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbProduct {
  id: string;
  shop_id: string;
  name: string;
  translations: Record<string, { name: string; category: string }> | null;
  barcode: string;
  category: string;
  category_id: string | null;
  supplier_id: string | null;
  image: string | null;
  cost_price_carton: number;
  cost_price_unit: number;
  carton_price: number;
  unit_price: number;
  units_per_carton: number;
  stock_cartons: number;
  stock_units: number;
  total_units: number;
  min_stock_level: number;
  batch_number: string | null;
  expiry_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbCustomer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  total_debt: number;
  last_purchase_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbSale {
  id: string;
  shop_id: string;
  date: string;
  cashier_id: string;
  cashier_name: string;
  items: any; // JSONB
  total: number;
  profit: number;
  payment_method: 'cash' | 'transfer' | 'pos' | 'credit' | 'gift_card' | 'split';
  customer_id: string | null;
  is_credit: boolean;
  due_date: string | null;
  gift_card_code: string | null;
  gift_card_amount: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbDebtTransaction {
  id: string;
  shop_id: string;
  customer_id: string;
  date: string;
  type: 'credit' | 'payment';
  amount: number;
  sale_id: string | null;
  note: string | null;
  created_at: string;
}

export interface DbStockMovement {
  id: string;
  shop_id: string;
  product_id: string;
  type: 'restock' | 'sale' | 'adjustment' | 'return' | 'audit';
  quantity_change: number;
  quantity_type: 'carton' | 'unit';
  balance_after: number;
  user_id: string;
  note: string | null;
  batch_number: string | null;
  created_at: string;
}

export interface DbExpense {
  id: string;
  shop_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  recorded_by_user_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbGiftCard {
  id: string;
  shop_id: string;
  code: string;
  initial_value: number;
  balance: number;
  status: 'active' | 'empty';
  theme: 'standard' | 'gold' | 'dark' | 'festive';
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbActivityLog {
  id: string;
  shop_id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface DbSubscription {
  id: string;
  shop_id: string;
  plan: 'monthly' | 'yearly';
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  payment_reference: string | null;
  last_verified_at: string;
  verification_checksum: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPaymentRecord {
  id: string;
  shop_id: string;
  shop_name: string;
  subscription_id: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  payment_reference: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date: string;
  verified_at: string | null;
  email: string;
  country: string;
  state: string;
  notes: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  original_amount: number | null;
  created_at: string;
}

export interface DbAdminConfig {
  id: string;
  trial_days: number;
  trial_enabled: boolean;
  gemini_api_key: string | null;
  paystack_test_public_key: string | null;
  paystack_test_secret_key: string | null;
  paystack_live_public_key: string | null;
  paystack_live_secret_key: string | null;
  paystack_mode: 'test' | 'live' | null;
  created_at: string;
  updated_at: string;
}

export interface DbCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_plans: string[];
  expiration_date: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbCouponUsage {
  id: string;
  coupon_id: string;
  coupon_code: string;
  shop_id: string;
  shop_name: string;
  payment_id: string;
  discount_amount: number;
  used_at: string;
}

export interface DbAIUsageRecord {
  id: string;
  shop_id: string;
  shop_name: string;
  user_id: string;
  user_name: string;
  prompt: string;
  response: string | null;
  is_abuse: boolean;
  abuse_reason: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbShopSummary {
  shop_id: string;
  shop_name: string;
  owner_email: string;
  owner_name: string;
  country: string;
  state: string;
  registered_date: string;
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  subscription_plan: 'monthly' | 'yearly' | null;
  last_payment_date: string | null;
  subscription_end_date: string | null;
  trial_end_date: string | null;
  total_revenue: number;
  is_active: boolean;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

