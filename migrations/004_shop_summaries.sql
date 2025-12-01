-- ============================================================================
-- Migration: 004_shop_summaries.sql
-- Description: Create shop_summaries table for admin panel overview
-- ============================================================================

-- Shop Summaries (Admin view - aggregated shop information)
CREATE TABLE IF NOT EXISTS shop_summaries (
  shop_id UUID PRIMARY KEY REFERENCES shop_settings(shop_id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  registered_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_status TEXT NOT NULL CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')) DEFAULT 'trial',
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  last_payment_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  total_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_summaries_registered_date ON shop_summaries(registered_date DESC);
CREATE INDEX IF NOT EXISTS idx_shop_summaries_subscription_status ON shop_summaries(subscription_status);
CREATE INDEX IF NOT EXISTS idx_shop_summaries_is_active ON shop_summaries(is_active);

-- Apply updated_at trigger
CREATE TRIGGER update_shop_summaries_updated_at 
  BEFORE UPDATE ON shop_summaries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

