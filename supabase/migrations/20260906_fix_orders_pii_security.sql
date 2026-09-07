-- ==============================================================================
-- Migration: Complete Security & Role-Based Access Control for Orders
-- Date: 2026-09-06
-- Roles Supported:
--   1. Admin / Manager / Staff: Full access (SELECT, UPDATE, INSERT) for fulfillment,
--      dispatch, order status tracking, manual counter orders, and admin panel views.
--   2. Customers (User / Google OAuth): Restricted to their own orders (by auth.uid()
--      or matching profile phone number).
--   3. Anonymous / Public: Bulk database reading is strictly blocked.
--   4. Service Role: Unrestricted for Supabase Edge Functions (e.g. create-order).
-- ==============================================================================

-- 1. Helper Function: is_admin_or_staff()
-- Uses SECURITY DEFINER and STABLE so it runs with system privileges,
-- avoids RLS recursion on the profiles table, and is cached per-query for high speed.
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager', 'staff')
  );
$$;

-- Grant execution permission on helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_or_staff() TO authenticated;


-- 2. Drop all previous & existing orders policies (makes migration re-runnable / idempotent)
DROP POLICY IF EXISTS orders_read_all ON public.orders;
DROP POLICY IF EXISTS orders_select_owner ON public.orders;
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
DROP POLICY IF EXISTS orders_staff_update ON public.orders;
DROP POLICY IF EXISTS orders_staff_insert ON public.orders;
DROP POLICY IF EXISTS orders_select_policy ON public.orders;
DROP POLICY IF EXISTS orders_update_admin_staff ON public.orders;
DROP POLICY IF EXISTS orders_insert_admin_staff ON public.orders;

DROP POLICY IF EXISTS order_items_read_all ON public.order_items;
DROP POLICY IF EXISTS order_items_select_owner ON public.order_items;
DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;
DROP POLICY IF EXISTS order_items_select_policy ON public.order_items;
DROP POLICY IF EXISTS order_items_update_admin_staff ON public.order_items;
DROP POLICY IF EXISTS order_items_insert_admin_staff ON public.order_items;

DROP POLICY IF EXISTS order_status_history_read_all ON public.order_status_history;
DROP POLICY IF EXISTS order_status_history_select_owner ON public.order_status_history;
DROP POLICY IF EXISTS order_status_history_admin_all ON public.order_status_history;
DROP POLICY IF EXISTS order_status_history_select_policy ON public.order_status_history;
DROP POLICY IF EXISTS order_status_history_insert_admin_staff ON public.order_status_history;


-- 3. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 4. POLICIES FOR `public.orders`
-- ==============================================================================

-- (A) SELECT Policy:
-- - Admins, managers, and staff can view ALL orders.
-- - Customers can view orders where user_id matches their auth.uid().
-- - If customer provided phone in profile, can also view matching past orders.
CREATE POLICY orders_select_policy
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_staff()
    OR user_id = auth.uid()
    OR (
      orders.user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.phone_number IS NOT NULL
        AND length(trim(profiles.phone_number::text)) >= 10
        AND orders.customer_phone IS NOT NULL
        AND orders.customer_phone LIKE '%' || right(regexp_replace(profiles.phone_number::text, '\D', '', 'g'), 10) || '%'
      )
    )
  );

-- (B) UPDATE Policy:
-- - Admins, managers, and staff can update order status, notes, tracking, rider info.
CREATE POLICY orders_update_admin_staff
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_staff()
  )
  WITH CHECK (
    public.is_admin_or_staff()
  );

-- (C) INSERT Policy:
-- - Admins and staff can create manual / counter / phone orders directly in admin panel.
CREATE POLICY orders_insert_admin_staff
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_staff()
  );


-- ==============================================================================
-- 5. POLICIES FOR `public.order_items`
-- ==============================================================================

-- (A) SELECT Policy:
-- - Staff/Admin can view all items.
-- - Customer can view items belonging to their own authorized orders.
CREATE POLICY order_items_select_policy
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR (
          orders.user_id IS NULL
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.phone_number IS NOT NULL
            AND length(trim(profiles.phone_number::text)) >= 10
            AND orders.customer_phone IS NOT NULL
            AND orders.customer_phone LIKE '%' || right(regexp_replace(profiles.phone_number::text, '\D', '', 'g'), 10) || '%'
          )
        )
      )
    )
  );

-- (B) UPDATE Policy:
-- - Admin/Staff can update item status (e.g. marked packed, item cancelled).
CREATE POLICY order_items_update_admin_staff
  ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_staff()
  )
  WITH CHECK (
    public.is_admin_or_staff()
  );

-- (C) INSERT Policy:
-- - Admin/Staff can insert items for counter/manual showroom orders.
CREATE POLICY order_items_insert_admin_staff
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_staff()
  );


-- ==============================================================================
-- 6. POLICIES FOR `public.order_status_history`
-- ==============================================================================

-- (A) SELECT Policy:
-- - Staff/Admin can view full timeline for all orders.
-- - Customer can view history timeline for their own orders.
CREATE POLICY order_status_history_select_policy
  ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND (
        orders.user_id = auth.uid()
        OR (
          orders.user_id IS NULL
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.phone_number IS NOT NULL
            AND length(trim(profiles.phone_number::text)) >= 10
            AND orders.customer_phone IS NOT NULL
            AND orders.customer_phone LIKE '%' || right(regexp_replace(profiles.phone_number::text, '\D', '', 'g'), 10) || '%'
          )
        )
      )
    )
  );

-- (B) INSERT Policy:
-- - Admin/Staff can insert timeline entries (e.g. "Order packed by Ramesh", "Rider assigned").
CREATE POLICY order_status_history_insert_admin_staff
  ON public.order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_staff()
  );
