-- Migration: Update delivery_settings table for 20-minute delivery calculation
-- Date: 2026-09-02

-- 1. Ensure delivery_settings table structure matches requirements
CREATE TABLE IF NOT EXISTS delivery_settings (
  id text PRIMARY KEY DEFAULT 'default',
  shop_lat double precision,
  shop_lng double precision,
  express_max_minutes integer NOT NULL DEFAULT 20,
  express_max_km numeric(6,2) NOT NULL DEFAULT 5.0,
  packing_buffer_minutes integer NOT NULL DEFAULT 3,
  delivery_buffer_minutes integer NOT NULL DEFAULT 3,
  serviceable_district text DEFAULT 'Samastipur',
  serviceable_state text DEFAULT 'Bihar',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add columns if table existed previously without them
ALTER TABLE delivery_settings
ADD COLUMN IF NOT EXISTS shop_lat double precision,
ADD COLUMN IF NOT EXISTS shop_lng double precision,
ADD COLUMN IF NOT EXISTS packing_buffer_minutes integer NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS delivery_buffer_minutes integer NOT NULL DEFAULT 3;

-- 3. Upsert default configuration row
INSERT INTO delivery_settings (
  id,
  shop_lat,
  shop_lng,
  express_max_minutes,
  express_max_km,
  packing_buffer_minutes,
  delivery_buffer_minutes,
  serviceable_district,
  serviceable_state,
  is_active,
  updated_at
) VALUES (
  'default',
  NULL, -- Enter SHOP_LATITUDE here (e.g. 25.855802)
  NULL, -- Enter SHOP_LONGITUDE here (e.g. 85.779337)
  20,
  5.00,
  3,
  3,
  'Samastipur',
  'Bihar',
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  express_max_minutes = EXCLUDED.express_max_minutes,
  express_max_km = EXCLUDED.express_max_km,
  packing_buffer_minutes = EXCLUDED.packing_buffer_minutes,
  delivery_buffer_minutes = EXCLUDED.delivery_buffer_minutes,
  serviceable_district = EXCLUDED.serviceable_district,
  serviceable_state = EXCLUDED.serviceable_state,
  updated_at = now();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to delivery_settings so storefront / edge function can read settings
DROP POLICY IF EXISTS "Allow public read access to delivery_settings" ON delivery_settings;
CREATE POLICY "Allow public read access to delivery_settings"
  ON delivery_settings
  FOR SELECT
  TO public
  USING (true);

-- Restrict write access to authenticated admin / service role
DROP POLICY IF EXISTS "Restrict write access to delivery_settings" ON delivery_settings;
CREATE POLICY "Restrict write access to delivery_settings"
  ON delivery_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
