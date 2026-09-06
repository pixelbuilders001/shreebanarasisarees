-- Order flow RLS: READ access for orders / order_items / order_status_history
-- ---------------------------------------------------------------------------
-- `orders`, `order_items` and `order_status_history` are written by the
-- deployed `create-order` Edge Function (service role, bypasses RLS). RLS is
-- enabled on all three tables with no effective SELECT policy, so the
-- storefront can read none of them:
--   SELECT policy on orders   -> missing
--   SELECT policy on children -> missing
--
-- NOTE: a previous batch of policies for `orders` was pasted including one
-- for a `teams` table that does not exist, which aborted the whole script
-- and prevented any of the orders policies from being created. Recreating
-- the intended wide-open read below.
--
-- Writes are handled by the Edge Function, so only SELECT is opened here.
-- ---------------------------------------------------------------------------

drop policy if exists order_items_read_all on public.order_items;
drop policy if exists order_status_history_read_all on public.order_status_history;
drop policy if exists orders_read_all on public.orders;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

create policy orders_read_all
  on public.orders
  for select
  using (true);

create policy order_items_read_all
  on public.order_items
  for select
  using (true);

create policy order_status_history_read_all
  on public.order_status_history
  for select
  using (true);