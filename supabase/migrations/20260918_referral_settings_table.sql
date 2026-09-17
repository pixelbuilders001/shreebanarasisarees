-- ==============================================================================
-- Migration: Referral Settings Configuration Table
-- Date: 2026-09-18
-- Features:
--   1. Creates public.referral_settings for dynamic Admin configuration
--   2. Inserts default Tiered Slabs (₹150 / ₹300 / ₹500) and 20% Cart Cap
--   3. Sets up RLS policies (Public Read, Admin/Staff Full Access)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.referral_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  tier1_min_order NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
  tier1_reward_coins NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
  tier2_min_order NUMERIC(10, 2) NOT NULL DEFAULT 4000.00,
  tier2_reward_coins NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
  tier3_min_order NUMERIC(10, 2) NOT NULL DEFAULT 9000.00,
  tier3_reward_coins NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  max_redemption_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  min_order_for_redemption NUMERIC(10, 2) NOT NULL DEFAULT 1999.00,
  return_window_days INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default single record
INSERT INTO public.referral_settings (
  id,
  is_active,
  tier1_min_order,
  tier1_reward_coins,
  tier2_min_order,
  tier2_reward_coins,
  tier3_min_order,
  tier3_reward_coins,
  max_redemption_percent,
  min_order_for_redemption,
  return_window_days,
  updated_at
) VALUES (
  'default',
  TRUE,
  1500.00,
  150.00,
  4000.00,
  300.00,
  9000.00,
  500.00,
  20.00,
  1999.00,
  7,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Storefront and Admin both read configuration)
DROP POLICY IF EXISTS referral_settings_select_all ON public.referral_settings;
CREATE POLICY referral_settings_select_all ON public.referral_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated admin & staff full control (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS referral_settings_admin_all ON public.referral_settings;
CREATE POLICY referral_settings_admin_all ON public.referral_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff());
