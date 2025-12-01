-- ============================================================================
-- Migration: 007_initial_data.sql
-- Description: Insert initial/default data
-- ============================================================================

-- Insert default admin config
INSERT INTO admin_config (id, trial_days, trial_enabled, paystack_mode)
VALUES ('00000000-0000-0000-0000-000000000000', 7, true, 'test')
ON CONFLICT (id) DO NOTHING;

