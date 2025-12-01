-- ShopOS Supabase Database Schema
-- Version: 1.0.0
-- Description: Complete schema for ShopOS POS system with multi-tenancy support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GLOBAL TABLES (No shopId)
-- ============================================================================

-- Admin Users (Global admin accounts)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX idx_admin_users_username ON admin_users(username);

-- Admin Configuration (Single-row table)
CREATE TABLE admin_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trial_days INTEGER NOT NULL DEFAULT 7,
  trial_enabled BOOLEAN NOT NULL DEFAULT true,
  gemini_api_key TEXT,
  paystack_test_public_key TEXT,
  paystack_test_secret_key TEXT,
  paystack_live_public_key TEXT,
  paystack_live_secret_key TEXT,
  paystack_mode TEXT CHECK (paystack_mode IN ('test', 'live')) DEFAULT 'test',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000000')
);

-- Coupons (Global, admin-managed)
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  applicable_plans TEXT[] NOT NULL DEFAULT ARRAY['monthly', 'yearly'],
  expiration_date TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);

-- ============================================================================
-- SHOP-SCOPED TABLES (All have shopId for multi-tenancy)
-- ============================================================================

-- Shop Settings (Root tenant entity)
CREATE TABLE shop_settings (
  shop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT '₦',
  receipt_footer TEXT NOT NULL DEFAULT 'Thank you for your patronage!',
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  auto_backup TEXT NOT NULL DEFAULT 'off' CHECK (auto_backup IN ('off', 'daily', 'weekly', 'monthly')),
  last_backup_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shop_settings_country ON shop_settings(country);
CREATE INDEX idx_shop_settings_state ON shop_settings(state);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- Should be hashed in production
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'manager', 'cashier', 'stock_clerk')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ha', 'yo', 'ig', 'ar', 'fr')),
  profile_photo TEXT,
  is_archived BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, username)
);

CREATE INDEX idx_users_shop_id ON users(shop_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(shop_id, name)
);

CREATE INDEX idx_categories_shop_id ON categories(shop_id);
CREATE INDEX idx_categories_is_archived ON categories(is_archived);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_suppliers_shop_id ON suppliers(shop_id);
CREATE INDEX idx_suppliers_is_archived ON suppliers(is_archived);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  translations JSONB, -- Multi-language support
  barcode TEXT NOT NULL,
  category TEXT NOT NULL, -- Denormalized for performance
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  image TEXT,
  
  -- Pricing & Units
  cost_price_carton NUMERIC(10, 2) NOT NULL,
  cost_price_unit NUMERIC(10, 2) NOT NULL,
  carton_price NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  units_per_carton INTEGER NOT NULL,
  
  -- Stock
  stock_cartons INTEGER NOT NULL DEFAULT 0,
  stock_units INTEGER NOT NULL DEFAULT 0,
  total_units INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  
  -- Pharmacy / Specific
  batch_number TEXT,
  expiry_date DATE,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(shop_id, barcode)
);

CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_is_archived ON products(is_archived);
CREATE INDEX idx_products_total_units ON products(total_units) WHERE is_archived = false;

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_debt NUMERIC(10, 2) NOT NULL DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_is_archived ON customers(is_archived);

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cashier_name TEXT NOT NULL, -- Denormalized
  items JSONB NOT NULL, -- Array of CartItem (embedded)
  total NUMERIC(10, 2) NOT NULL,
  profit NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'pos', 'credit', 'gift_card', 'split')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  is_credit BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMPTZ,
  gift_card_code TEXT,
  gift_card_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_sales_shop_id ON sales(shop_id);
CREATE INDEX idx_sales_date ON sales(date DESC);
CREATE INDEX idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

-- Debt Transactions
CREATE TABLE debt_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
  amount NUMERIC(10, 2) NOT NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_debt_transactions_shop_id ON debt_transactions(shop_id);
CREATE INDEX idx_debt_transactions_customer_id ON debt_transactions(customer_id);
CREATE INDEX idx_debt_transactions_sale_id ON debt_transactions(sale_id);
CREATE INDEX idx_debt_transactions_date ON debt_transactions(date DESC);

-- Stock Movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'audit')),
  quantity_change INTEGER NOT NULL,
  quantity_type TEXT NOT NULL CHECK (quantity_type IN ('carton', 'unit')),
  balance_after INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note TEXT,
  batch_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_shop_id ON stock_movements(shop_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  recorded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_expenses_shop_id ON expenses(shop_id);
CREATE INDEX idx_expenses_recorded_by_user_id ON expenses(recorded_by_user_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_is_archived ON expenses(is_archived);

-- Gift Cards
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  initial_value NUMERIC(10, 2) NOT NULL,
  balance NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'empty')),
  theme TEXT NOT NULL CHECK (theme IN ('standard', 'gold', 'dark', 'festive')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(shop_id, code)
);

CREATE INDEX idx_gift_cards_shop_id ON gift_cards(shop_id);
CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_name TEXT NOT NULL, -- Denormalized
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_shop_id ON activity_logs(shop_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- User Preferences (View modes, UI settings per user)
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL, -- e.g., 'pos_view_mode', 'stock_view_mode', 'language'
  preference_value TEXT NOT NULL, -- JSON string for complex values
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, user_id, preference_key)
);

CREATE INDEX idx_user_preferences_shop_id ON user_preferences(shop_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_key ON user_preferences(preference_key);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_start_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ NOT NULL,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  last_payment_amount NUMERIC(10, 2),
  payment_reference TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id)
);

CREATE INDEX idx_subscriptions_shop_id ON subscriptions(shop_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_trial_end_date ON subscriptions(trial_end_date);
CREATE INDEX idx_subscriptions_subscription_end_date ON subscriptions(subscription_end_date);

-- Payment Records
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL, -- Denormalized
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  amount NUMERIC(10, 2) NOT NULL,
  payment_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  notes TEXT,
  coupon_code TEXT,
  discount_amount NUMERIC(10, 2),
  original_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_records_shop_id ON payment_records(shop_id);
CREATE INDEX idx_payment_records_subscription_id ON payment_records(subscription_id);
CREATE INDEX idx_payment_records_payment_reference ON payment_records(payment_reference);
CREATE INDEX idx_payment_records_status ON payment_records(status);
CREATE INDEX idx_payment_records_payment_date ON payment_records(payment_date DESC);

-- Payment Verifications (Audit trail for Paystack API verifications)
CREATE TABLE payment_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_reference TEXT NOT NULL UNIQUE,
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC(10, 2),
  currency TEXT DEFAULT 'NGN',
  customer_email TEXT,
  paystack_response JSONB,
  error_message TEXT,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('api', 'callback', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_verifications_payment_reference ON payment_verifications(payment_reference);
CREATE INDEX idx_payment_verifications_shop_id ON payment_verifications(shop_id);
CREATE INDEX idx_payment_verifications_status ON payment_verifications(status);
CREATE INDEX idx_payment_verifications_verified_at ON payment_verifications(verified_at DESC);

-- Coupon Usage
CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL, -- Denormalized
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL, -- Denormalized
  payment_id UUID NOT NULL REFERENCES payment_records(id) ON DELETE CASCADE,
  discount_amount NUMERIC(10, 2) NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_shop_id ON coupon_usages(shop_id);
CREATE INDEX idx_coupon_usages_payment_id ON coupon_usages(payment_id);
CREATE INDEX idx_coupon_usages_coupon_code ON coupon_usages(coupon_code);

-- AI Usage Records
CREATE TABLE ai_usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL, -- Denormalized
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_name TEXT NOT NULL, -- Denormalized
  prompt TEXT NOT NULL,
  response TEXT,
  is_abuse BOOLEAN DEFAULT false,
  abuse_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_usage_records_shop_id ON ai_usage_records(shop_id);
CREATE INDEX idx_ai_usage_records_user_id ON ai_usage_records(user_id);
CREATE INDEX idx_ai_usage_records_created_at ON ai_usage_records(created_at DESC);
CREATE INDEX idx_ai_usage_records_is_abuse ON ai_usage_records(is_abuse);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON shop_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_usage_records_updated_at BEFORE UPDATE ON ai_usage_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy Helper Function: Get shop_id from JWT token
-- This assumes you'll store shop_id in the JWT token claims
CREATE OR REPLACE FUNCTION get_shop_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'shop_id')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policies for Shop-Scoped Tables
-- Policy: Users can only access their own shop's data
CREATE POLICY shop_isolation_policy ON shop_settings
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON users
  FOR ALL
  USING (shop_id = get_shop_id() OR shop_id IS NULL);

CREATE POLICY shop_isolation_policy ON categories
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON suppliers
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON products
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON customers
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON sales
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON debt_transactions
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON stock_movements
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON expenses
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON gift_cards
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON activity_logs
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON subscriptions
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON payment_records
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON coupon_usages
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON ai_usage_records
  FOR ALL
  USING (shop_id = get_shop_id());

-- RLS Policies for Admin Users
-- Allow service role full access (for authentication)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_users_service_role_policy ON admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Global Tables (Admin Only)
-- Policy: Only authenticated admin users can access
CREATE POLICY admin_only_policy ON admin_config
  FOR ALL
  USING (auth.role() = 'authenticated' AND (current_setting('request.jwt.claims', true)::json->>'role')::TEXT = 'admin');

CREATE POLICY admin_only_policy ON coupons
  FOR ALL
  USING (auth.role() = 'authenticated' AND (current_setting('request.jwt.claims', true)::json->>'role')::TEXT = 'admin');

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default admin config
INSERT INTO admin_config (id, trial_days, trial_enabled, paystack_mode)
VALUES ('00000000-0000-0000-0000-000000000000', 7, true, 'test')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. All timestamps use TIMESTAMPTZ for timezone awareness
-- 2. Numeric types use NUMERIC(precision, scale) for accurate financial calculations
-- 3. Foreign keys use appropriate CASCADE/RESTRICT rules
-- 4. Indexes are created on frequently queried columns
-- 5. RLS policies enforce multi-tenancy at the database level
-- 6. JWT claims should include 'shop_id' and 'role' for RLS to work
-- 7. UUIDs are used for all primary keys for better distribution
-- 8. JSONB is used for flexible fields (translations, items)
-- 9. All shop-scoped tables have shop_id index for RLS performance
-- 10. Consider partitioning large tables (sales, stock_movements) by shop_id or date

