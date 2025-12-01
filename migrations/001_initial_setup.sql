-- ============================================================================
-- Migration: 001_initial_setup.sql
-- Description: Enable extensions and create helper functions and triggers
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS Policy Helper Function: Get shop_id from JWT token
-- This assumes you'll store shop_id in the JWT token claims
CREATE OR REPLACE FUNCTION get_shop_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'shop_id')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

