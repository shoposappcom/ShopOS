-- ============================================================================
-- Migration: 003_shop_scoped_tables.sql
-- Description: Create shop-scoped tables (all have shopId for multi-tenancy)
-- ============================================================================

-- Shop Settings (Root tenant entity)
CREATE TABLE IF NOT EXISTS shop_settings (
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

CREATE INDEX IF NOT EXISTS idx_shop_settings_country ON shop_settings(country);
CREATE INDEX IF NOT EXISTS idx_shop_settings_state ON shop_settings(state);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(shop_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_shop_id ON categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_archived ON categories(is_archived);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
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

CREATE INDEX IF NOT EXISTS idx_suppliers_shop_id ON suppliers(shop_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_archived ON suppliers(is_archived);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  translations JSONB,
  barcode TEXT NOT NULL,
  category TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  image TEXT,
  cost_price_carton NUMERIC(10, 2) NOT NULL,
  cost_price_unit NUMERIC(10, 2) NOT NULL,
  carton_price NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  units_per_carton INTEGER NOT NULL,
  stock_cartons INTEGER NOT NULL DEFAULT 0,
  stock_units INTEGER NOT NULL DEFAULT 0,
  total_units INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  batch_number TEXT,
  expiry_date DATE,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(shop_id, barcode)
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_total_units ON products(total_units) WHERE is_archived = false;

-- Customers
CREATE TABLE IF NOT EXISTS customers (
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

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_is_archived ON customers(is_archived);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cashier_name TEXT NOT NULL,
  items JSONB NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- Debt Transactions
CREATE TABLE IF NOT EXISTS debt_transactions (
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

CREATE INDEX IF NOT EXISTS idx_debt_transactions_shop_id ON debt_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_customer_id ON debt_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_sale_id ON debt_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_date ON debt_transactions(date DESC);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
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

CREATE INDEX IF NOT EXISTS idx_stock_movements_shop_id ON stock_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
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

CREATE INDEX IF NOT EXISTS idx_expenses_shop_id ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_recorded_by_user_id ON expenses(recorded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_is_archived ON expenses(is_archived);

-- Gift Cards
CREATE TABLE IF NOT EXISTS gift_cards (
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

CREATE INDEX IF NOT EXISTS idx_gift_cards_shop_id ON gift_cards(shop_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_id ON activity_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- User Preferences (View modes, UI settings per user)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_shop_id ON user_preferences(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date ON subscriptions(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_end_date ON subscriptions(subscription_end_date);

-- Payment Records
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_payment_records_shop_id ON payment_records(shop_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_subscription_id ON payment_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_reference ON payment_records(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date DESC);

-- Payment Verifications (Audit trail for Paystack API verifications)
CREATE TABLE IF NOT EXISTS payment_verifications (
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

CREATE INDEX IF NOT EXISTS idx_payment_verifications_payment_reference ON payment_verifications(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_shop_id ON payment_verifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON payment_verifications(status);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_verified_at ON payment_verifications(verified_at DESC);

-- Coupon Usage
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  payment_id UUID NOT NULL REFERENCES payment_records(id) ON DELETE CASCADE,
  discount_amount NUMERIC(10, 2) NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_shop_id ON coupon_usages(shop_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_payment_id ON coupon_usages(payment_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_code ON coupon_usages(coupon_code);

-- AI Usage Records
CREATE TABLE IF NOT EXISTS ai_usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  is_abuse BOOLEAN DEFAULT false,
  abuse_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_records_shop_id ON ai_usage_records(shop_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_records_user_id ON ai_usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_records_created_at ON ai_usage_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_records_is_abuse ON ai_usage_records(is_abuse);

-- Apply updated_at triggers
CREATE TRIGGER update_shop_settings_updated_at 
  BEFORE UPDATE ON shop_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
  BEFORE UPDATE ON suppliers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON sales 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at 
  BEFORE UPDATE ON gift_cards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_usage_records_updated_at 
  BEFORE UPDATE ON ai_usage_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

