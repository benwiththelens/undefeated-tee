-- Order ledger for the Undefeated drop.
-- Written only by the Stripe webhook, using the service role key.

create table if not exists public.orders (
  -- Stripe event id. The dedupe key: Stripe retries deliveries, and the
  -- webhook relies on ON CONFLICT DO NOTHING here to fire one Discord ping.
  event_id     text primary key,
  session_id   text not null,
  created_at   timestamptz not null,
  product      text not null,
  size         text not null,
  amount_total integer,
  currency     text,
  email        text,
  name         text,
  address      jsonb,
  recorded_at  timestamptz not null default now()
);

create index if not exists orders_session_id_idx on public.orders (session_id);
create index if not exists orders_size_idx on public.orders (size);

-- Orders hold customer names and shipping addresses. RLS on with no policies
-- means anon and authenticated clients get nothing; the webhook's service role
-- key bypasses RLS by design.
alter table public.orders enable row level security;

-- How many of each size to print:
--   select size, count(*) from public.orders group by size order by count(*) desc;
