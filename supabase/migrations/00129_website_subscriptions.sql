-- Per-website billing: ₹149/year per monitored website, one Razorpay
-- subscription and one invoice per website, independent of the org-level
-- Pre Plan / Pro Plan tiers (which existing subscribers keep — grandfathered,
-- unaffected by this table).
--
-- Kept as a SEPARATE table from `subscriptions`, mirroring
-- org_addon_subscriptions (00128), for the same reason: the Razorpay
-- webhook's handleSubscriptionActivated cancels every other active
-- subscription in `subscriptions` for the org when a new one activates.
-- If per-website subs lived in that table, paying for a 2nd website would
-- silently cancel the 1st website's subscription. This table is invisible
-- to that logic entirely.
create table public.website_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  -- Normalized grouping key: registrable domain with "www." stripped for
  -- real domains (example.com and www.example.com are the same website;
  -- blog.example.com is a different website). For non-domain targets
  -- (IPs, host:port, etc.) this is the exact target string.
  target_domain text not null,
  razorpay_subscription_id text,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint website_subscriptions_status_check
    check (status = any (array['active'::text, 'past_due'::text, 'canceled'::text, 'cancelling'::text, 'incomplete'::text]))
);

create index idx_website_subscriptions_org_id on public.website_subscriptions(org_id);
create index idx_website_subscriptions_org_domain on public.website_subscriptions(org_id, target_domain);
create unique index idx_website_subscriptions_razorpay_id on public.website_subscriptions(razorpay_subscription_id) where razorpay_subscription_id is not null;

create trigger website_subscriptions_updated_at
  before update on public.website_subscriptions
  for each row execute function public.update_updated_at();

comment on table public.website_subscriptions is
  'One row per paid website (₹149/year, Razorpay). Grouping key is target_domain (normalized). Independent of the org-level subscriptions table — grandfathered Pre/Pro Plan orgs never touch this table.';

-- Monitors need a normalized domain column to group multiple monitor types
-- (http, ssl, dns, ...) under one paid website. Nullable + backfilled since
-- existing monitors predate this billing model; NULL means "not yet
-- classified" and is treated as its own ungrouped target by application code.
alter table public.monitors add column if not exists target_domain text;
create index if not exists idx_monitors_org_target_domain on public.monitors(org_id, target_domain);

-- Invoices need to link to a website_subscriptions row too, mirroring the
-- existing (currently-unused-in-practice) subscription_id FK to the base
-- subscriptions table.
alter table public.invoices add column if not exists website_subscription_id uuid references public.website_subscriptions(id) on delete set null;
