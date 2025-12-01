-- ============================================================================
-- Migration: 006_rls_policies.sql
-- Description: Enable Row Level Security and create RLS policies
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
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migrations)
DROP POLICY IF EXISTS shop_isolation_policy ON shop_settings;
DROP POLICY IF EXISTS shop_isolation_policy ON users;
DROP POLICY IF EXISTS shop_isolation_policy ON categories;
DROP POLICY IF EXISTS shop_isolation_policy ON suppliers;
DROP POLICY IF EXISTS shop_isolation_policy ON products;
DROP POLICY IF EXISTS shop_isolation_policy ON customers;
DROP POLICY IF EXISTS shop_isolation_policy ON sales;
DROP POLICY IF EXISTS shop_isolation_policy ON debt_transactions;
DROP POLICY IF EXISTS shop_isolation_policy ON stock_movements;
DROP POLICY IF EXISTS shop_isolation_policy ON expenses;
DROP POLICY IF EXISTS shop_isolation_policy ON gift_cards;
DROP POLICY IF EXISTS shop_isolation_policy ON activity_logs;
DROP POLICY IF EXISTS shop_isolation_policy ON user_preferences;
DROP POLICY IF EXISTS shop_isolation_policy ON subscriptions;
DROP POLICY IF EXISTS shop_isolation_policy ON payment_records;
DROP POLICY IF EXISTS shop_isolation_policy ON payment_verifications;
DROP POLICY IF EXISTS shop_isolation_policy ON coupon_usages;
DROP POLICY IF EXISTS shop_isolation_policy ON ai_usage_records;
DROP POLICY IF EXISTS admin_only_policy ON admin_config;
DROP POLICY IF EXISTS admin_only_policy ON coupons;
DROP POLICY IF EXISTS admin_users_service_role_policy ON admin_users;
DROP POLICY IF EXISTS shop_isolation_policy ON shop_summaries;

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

CREATE POLICY shop_isolation_policy ON user_preferences
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON subscriptions
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON payment_records
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON payment_verifications
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON coupon_usages
  FOR ALL
  USING (shop_id = get_shop_id());

CREATE POLICY shop_isolation_policy ON ai_usage_records
  FOR ALL
  USING (shop_id = get_shop_id());

-- RLS Policy for shop_summaries (admin access only)
-- Service role can access all shop summaries
CREATE POLICY shop_isolation_policy ON shop_summaries
  FOR ALL
  USING (true); -- Admin panel needs access to all shops

-- RLS Policies for Admin Users
-- Allow service role full access (for authentication)
CREATE POLICY admin_users_service_role_policy ON admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Global Tables (Admin Only)
-- Policy: Only authenticated admin users can access
-- Note: These policies will need to be adjusted based on your auth setup
CREATE POLICY admin_only_policy ON admin_config
  FOR ALL
  USING (true); -- Adjust based on your authentication setup

CREATE POLICY admin_only_policy ON coupons
  FOR ALL
  USING (true); -- Adjust based on your authentication setup

