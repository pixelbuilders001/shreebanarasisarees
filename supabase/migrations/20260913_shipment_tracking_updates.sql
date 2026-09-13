-- ==============================================================================
-- Migration: Flexible Shipment Tracking Checkpoints
-- Description: Stores granular courier/transit updates between 'shipped' and 'out_for_delivery'
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shipment_tracking_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Main status title (e.g. "Order has left Tajpur facility", "In Transit")
  title TEXT NOT NULL,
  
  -- Optional explanatory note (e.g. "Package loaded and moving to facility near you | Patna")
  subtitle TEXT,
  
  -- Event timestamp
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Highlight card toggle (renders as green highlight card if true)
  is_highlighted BOOLEAN DEFAULT false,
  
  -- Generic metadata for any optional courier info (next_stop, distance, eta, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for ordering checkpoints by order and time
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order_time 
  ON public.shipment_tracking_updates(order_id, event_time ASC);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.shipment_tracking_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shipment_tracking_select_policy ON public.shipment_tracking_updates;
DROP POLICY IF EXISTS shipment_tracking_insert_admin_staff ON public.shipment_tracking_updates;
DROP POLICY IF EXISTS shipment_tracking_update_admin_staff ON public.shipment_tracking_updates;
DROP POLICY IF EXISTS shipment_tracking_delete_admin_staff ON public.shipment_tracking_updates;

-- (A) SELECT: Admin/Staff can view all; customers can view only their own order updates
CREATE POLICY shipment_tracking_select_policy
  ON public.shipment_tracking_updates
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipment_tracking_updates.order_id
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

-- (B) INSERT: Admin, Manager, Staff only
CREATE POLICY shipment_tracking_insert_admin_staff
  ON public.shipment_tracking_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_staff()
  );

-- (C) UPDATE: Admin, Manager, Staff only
CREATE POLICY shipment_tracking_update_admin_staff
  ON public.shipment_tracking_updates
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_staff()
  )
  WITH CHECK (
    public.is_admin_or_staff()
  );

-- (D) DELETE: Admin, Manager, Staff only
CREATE POLICY shipment_tracking_delete_admin_staff
  ON public.shipment_tracking_updates
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin_or_staff()
  );
