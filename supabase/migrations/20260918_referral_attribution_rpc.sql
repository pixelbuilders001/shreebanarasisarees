-- ==============================================================================
-- Migration: Referral Attribution Security & Claim Functions (Phase 2)
-- Date: 2026-09-18
-- Features:
--   1. Public helper function to resolve referrer by referral code (bypasses RLS)
--   2. Atomic claim_referral function to link referee to referrer securely
--   3. Authenticated INSERT policy on public.referrals
-- ==============================================================================

-- 1. Helper to resolve referrer details by code
CREATE OR REPLACE FUNCTION public.resolve_referrer_by_code(code text)
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, full_name 
  FROM public.profiles
  WHERE referral_code = UPPER(TRIM(code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_referrer_by_code(text) TO anon, authenticated;

-- 2. Atomic function to claim and link referral
CREATE OR REPLACE FUNCTION public.claim_referral(ref_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_user_id uuid;
  current_user_id uuid := auth.uid();
  already_referred uuid;
  order_count integer;
BEGIN
  IF current_user_id IS NULL OR ref_code IS NULL OR TRIM(ref_code) = '' THEN
    RETURN false;
  END IF;

  -- Find referrer
  SELECT id INTO ref_user_id
    FROM public.profiles
   WHERE referral_code = UPPER(TRIM(ref_code))
   LIMIT 1;

  -- Block self-referral or not found
  IF ref_user_id IS NULL OR ref_user_id = current_user_id THEN
    RETURN false;
  END IF;

  -- Check if current user was already referred
  SELECT referred_by INTO already_referred
    FROM public.profiles
   WHERE id = current_user_id;

  IF already_referred IS NOT NULL THEN
    RETURN false;
  END IF;

  -- Check if user already placed any orders
  SELECT count(*) INTO order_count
    FROM public.orders
   WHERE user_id = current_user_id;

  IF order_count > 0 THEN
    RETURN false;
  END IF;

  -- Update profile with referred_by
  UPDATE public.profiles
     SET referred_by = ref_user_id
   WHERE id = current_user_id;

  -- Record relationship in referrals table
  INSERT INTO public.referrals (referrer_id, referee_id, status)
  VALUES (ref_user_id, current_user_id, 'REGISTERED')
  ON CONFLICT (referee_id) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;

-- 3. Ensure referee can insert into referrals table if calling directly
DROP POLICY IF EXISTS referrals_insert_referee ON public.referrals;
CREATE POLICY referrals_insert_referee ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referee_id = auth.uid());
