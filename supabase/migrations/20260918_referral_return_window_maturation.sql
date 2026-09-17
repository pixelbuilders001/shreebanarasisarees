-- ==============================================================================
-- Migration: Return Window Coin Maturation Function
-- Date: 2026-09-18
-- Description:
--   Matures pending referral rewards to COMPLETED only after the admin's
--   configured return window (e.g. 7 days) has safely elapsed without cancellation.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.process_matured_referral_coins()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matured_count integer := 0;
  voided_count integer := 0;
  tx RECORD;
  order_rec RECORD;
  wallet_rec RECORD;
BEGIN
  -- Find all pending referral reward transactions where maturation deadline has passed
  FOR tx IN
    SELECT ct.id, ct.user_id, ct.amount, ct.order_id, ct.expires_at
    FROM public.coin_transactions ct
    WHERE ct.type = 'REFERRAL_REWARD'
      AND ct.status = 'PENDING'
      AND ct.expires_at IS NOT NULL
      AND ct.expires_at <= NOW()
  LOOP
    -- Check order status
    SELECT order_status INTO order_rec
    FROM public.orders
    WHERE id = tx.order_id;

    IF order_rec.order_status = 'delivered' THEN
      -- Order is still delivered and return window has safely expired!
      -- 1. Complete the transaction
      UPDATE public.coin_transactions
         SET status = 'COMPLETED',
             description = 'Referral reward matured after return window completed'
       WHERE id = tx.id;

      -- 2. Credit referrer's wallet
      SELECT * INTO wallet_rec
      FROM public.user_wallets
      WHERE user_id = tx.user_id;

      IF FOUND THEN
        UPDATE public.user_wallets
           SET pending_balance = GREATEST(0, pending_balance - tx.amount),
               available_balance = available_balance + tx.amount,
               total_earned = total_earned + tx.amount,
               updated_at = NOW()
         WHERE user_id = tx.user_id;
      ELSE
        INSERT INTO public.user_wallets (user_id, available_balance, pending_balance, total_earned)
        VALUES (tx.user_id, tx.amount, 0, tx.amount);
      END IF;

      -- 3. Update referrals record
      UPDATE public.referrals
         SET status = 'REWARDED',
             rewarded_at = NOW()
       WHERE qualifying_order_id = tx.order_id;

      matured_count := matured_count + 1;

    ELSIF order_rec.order_status IN ('cancelled', 'returned') THEN
      -- Order was returned or cancelled during the return window!
      UPDATE public.coin_transactions
         SET status = 'CANCELLED',
             description = 'Referral reward voided: Order was returned or cancelled'
       WHERE id = tx.id;

      UPDATE public.user_wallets
         SET pending_balance = GREATEST(0, pending_balance - tx.amount),
             updated_at = NOW()
       WHERE user_id = tx.user_id;

      UPDATE public.referrals
         SET status = 'VOIDED'
       WHERE qualifying_order_id = tx.order_id;

      voided_count := voided_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'matured_count', matured_count,
    'voided_count', voided_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_matured_referral_coins() TO anon, authenticated;
