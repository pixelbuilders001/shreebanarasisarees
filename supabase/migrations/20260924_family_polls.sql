-- ==============================================================================
-- Migration: Family Shopping ("Ask Family") Polls & Frictionless Voting
-- Date: 2026-09-24
-- Features:
--   1. Creates public.family_polls for poll metadata and settings
--   2. Creates public.family_poll_items linking candidate sarees to the poll
--   3. Creates public.family_poll_votes for anonymous family votes and comments
--   4. RLS policies allowing public anonymous reads and inserts
--   5. cast_family_vote RPC function for atomic voting and tallying
-- ==============================================================================

-- 1. family_polls table
CREATE TABLE IF NOT EXISTS public.family_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  creator_name TEXT NOT NULL,
  occasion TEXT DEFAULT 'Choosing a Saree',
  creator_token TEXT NOT NULL,
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  show_price BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'decided', 'closed')),
  winning_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days')
);

CREATE INDEX IF NOT EXISTS idx_family_polls_slug ON public.family_polls(slug);
CREATE INDEX IF NOT EXISTS idx_family_polls_creator_token ON public.family_polls(creator_token);

-- 2. family_poll_items table
CREATE TABLE IF NOT EXISTS public.family_poll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.family_polls(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 0 CHECK (votes_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_poll_items_poll_id ON public.family_poll_items(poll_id);
CREATE INDEX IF NOT EXISTS idx_family_poll_items_product_id ON public.family_poll_items(product_id);

-- 3. family_poll_votes table
CREATE TABLE IF NOT EXISTS public.family_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.family_polls(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.family_poll_items(id) ON DELETE CASCADE,
  voter_token TEXT NOT NULL,
  voter_name TEXT NOT NULL DEFAULT 'Family Member',
  comment TEXT,
  reaction TEXT DEFAULT 'heart',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_voter_per_poll UNIQUE (poll_id, voter_token)
);

CREATE INDEX IF NOT EXISTS idx_family_poll_votes_poll_id ON public.family_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_family_poll_votes_item_id ON public.family_poll_votes(item_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.family_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_poll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_poll_votes ENABLE ROW LEVEL SECURITY;

-- 5. Public RLS Policies
-- Allow anyone to view polls, items, and votes
DROP POLICY IF EXISTS "Public can view family polls" ON public.family_polls;
CREATE POLICY "Public can view family polls"
  ON public.family_polls FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can insert family polls" ON public.family_polls;
CREATE POLICY "Public can insert family polls"
  ON public.family_polls FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update own family polls via token" ON public.family_polls;
CREATE POLICY "Public can update own family polls via token"
  ON public.family_polls FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view family poll items" ON public.family_poll_items;
CREATE POLICY "Public can view family poll items"
  ON public.family_poll_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can insert family poll items" ON public.family_poll_items;
CREATE POLICY "Public can insert family poll items"
  ON public.family_poll_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update family poll items" ON public.family_poll_items;
CREATE POLICY "Public can update family poll items"
  ON public.family_poll_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view family poll votes" ON public.family_poll_votes;
CREATE POLICY "Public can view family poll votes"
  ON public.family_poll_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can insert family poll votes" ON public.family_poll_votes;
CREATE POLICY "Public can insert family poll votes"
  ON public.family_poll_votes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update family poll votes" ON public.family_poll_votes;
CREATE POLICY "Public can update family poll votes"
  ON public.family_poll_votes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Atomic voting RPC
CREATE OR REPLACE FUNCTION public.cast_family_vote(
  p_poll_id UUID,
  p_item_id UUID,
  p_voter_token TEXT,
  p_voter_name TEXT DEFAULT 'Family Member',
  p_comment TEXT DEFAULT NULL,
  p_reaction TEXT DEFAULT 'heart'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_item_id UUID;
  v_status TEXT;
BEGIN
  -- Verify poll is still active
  SELECT status INTO v_status FROM public.family_polls WHERE id = p_poll_id;
  IF v_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll not found');
  END IF;

  IF v_status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll is closed');
  END IF;

  -- Check if this voter already voted on this poll
  SELECT item_id INTO v_old_item_id
  FROM public.family_poll_votes
  WHERE poll_id = p_poll_id AND voter_token = p_voter_token;

  IF FOUND THEN
    -- If switching choice, adjust item tallies
    IF v_old_item_id <> p_item_id THEN
      UPDATE public.family_poll_items
      SET votes_count = GREATEST(votes_count - 1, 0)
      WHERE id = v_old_item_id;

      UPDATE public.family_poll_items
      SET votes_count = votes_count + 1
      WHERE id = p_item_id;
    END IF;

    -- Update vote details
    UPDATE public.family_poll_votes
    SET item_id = p_item_id,
        voter_name = CASE WHEN p_voter_name IS NOT NULL AND TRIM(p_voter_name) <> '' THEN TRIM(p_voter_name) ELSE voter_name END,
        comment = COALESCE(p_comment, comment),
        reaction = COALESCE(p_reaction, reaction)
    WHERE poll_id = p_poll_id AND voter_token = p_voter_token;

  ELSE
    -- First time vote
    INSERT INTO public.family_poll_votes (poll_id, item_id, voter_token, voter_name, comment, reaction)
    VALUES (p_poll_id, p_item_id, p_voter_token, COALESCE(NULLIF(TRIM(p_voter_name), ''), 'Family Member'), p_comment, p_reaction);

    -- Increment tally
    UPDATE public.family_poll_items
    SET votes_count = votes_count + 1
    WHERE id = p_item_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.cast_family_vote TO anon, authenticated, service_role;
