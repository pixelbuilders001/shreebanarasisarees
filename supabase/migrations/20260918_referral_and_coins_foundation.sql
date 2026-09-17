-- ==============================================================================
-- Migration: Banarasi Coins & Referral System Foundation (Phase 1)
-- Date: 2026-09-18
-- Features:
--   1. Adds referral_code and referred_by to public.profiles
--   2. Creates public.user_wallets for quick balance reads
--   3. Creates public.coin_transactions as an immutable double-entry ledger
--   4. Creates public.referrals to track referral relationships
--   5. Function & Trigger to auto-generate unique referral codes & wallets on signup
--   6. One-time backfill for existing users
--   7. Full Row-Level Security (RLS) policies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Step 1: Extend profiles table with referral attributes
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(16) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- ------------------------------------------------------------------------------
-- Step 2: Create user_wallets table (Summary balances)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
  pending_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
  total_earned NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Step 3: Create coin_transactions table (Immutable Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (
    type IN (
      'REFERRAL_REWARD',
      'ORDER_REDEMPTION',
      'ORDER_CANCELLED_REFUND',
      'WELCOME_BONUS',
      'EXPIRED',
      'ADMIN_ADJUSTMENT'
    )
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (
    status IN ('PENDING', 'COMPLETED', 'CANCELLED')
  ),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  source_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_tx_status ON public.coin_transactions(status);
CREATE INDEX IF NOT EXISTS idx_coin_tx_order_id ON public.coin_transactions(order_id);

-- ------------------------------------------------------------------------------
-- Step 4: Create referrals table (Referrer <-> Referee Mapping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED' CHECK (
    status IN ('REGISTERED', 'QUALIFIED', 'REWARDED', 'VOIDED')
  ),
  qualifying_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);

-- ------------------------------------------------------------------------------
-- Step 5: Helper function to generate unique, clean referral codes (e.g. SBS-8X4K2)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS VARCHAR(16)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result TEXT := '';
  i INTEGER := 0;
  candidate TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..5 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    candidate := 'SBS-' || result;
    
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = candidate) INTO exists_code;
    IF NOT exists_code THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- Step 6: Triggers to auto-assign referral code & wallet on profile creation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_profile_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_unique_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_referral_code ON public.profiles;
CREATE TRIGGER trigger_assign_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_referral();


CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, available_balance, pending_balance, total_earned)
  VALUES (NEW.id, 0.00, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_user_wallet ON public.profiles;
CREATE TRIGGER trigger_create_user_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_wallet();

-- ------------------------------------------------------------------------------
-- Step 7: One-time backfill for existing profiles
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    UPDATE public.profiles
    SET referral_code = public.generate_unique_referral_code()
    WHERE id = r.id;
  END LOOP;

  INSERT INTO public.user_wallets (user_id, available_balance, pending_balance, total_earned)
  SELECT id, 0.00, 0.00, 0.00 FROM public.profiles
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- ------------------------------------------------------------------------------
-- Step 8: Row-Level Security (RLS) Setup
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallets_select_owner ON public.user_wallets;
CREATE POLICY wallets_select_owner ON public.user_wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS wallets_admin_all ON public.user_wallets;
CREATE POLICY wallets_admin_all ON public.user_wallets
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS coin_tx_select_owner ON public.coin_transactions;
CREATE POLICY coin_tx_select_owner ON public.coin_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS coin_tx_admin_all ON public.coin_transactions;
CREATE POLICY coin_tx_admin_all ON public.coin_transactions
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS referrals_select_parties ON public.referrals;
CREATE POLICY referrals_select_parties ON public.referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referee_id = auth.uid());

DROP POLICY IF EXISTS referrals_admin_all ON public.referrals;
CREATE POLICY referrals_admin_all ON public.referrals
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff());
