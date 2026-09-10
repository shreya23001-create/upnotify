-- Add-On Plan: a customer on an active paid base subscription (subscriptions
-- table) can additionally purchase one or more "Add On Plan" units, each
-- granting the same limits as Pre Plan (slug 'lite'), stacked additively on
-- top of whatever their base plan already grants. Each add-on bills on its
-- own annual cycle from its own purchase date, independent of the base
-- plan's renewal date.
--
-- Kept as a SEPARATE table from `subscriptions` rather than a second row in
-- that table with a type flag, specifically so the existing Razorpay
-- webhook's org-wide "cancel every other active subscription" logic in
-- handleSubscriptionActivated (app/api/webhooks/razorpay/route.ts) cannot
-- see or accidentally cancel add-on rows — it only ever queries
-- `subscriptions`. This avoids touching that safety-critical code path at
-- all for the base-plan case.
create table public.org_addon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  addon_plan_id uuid not null references public.plans(id),
  razorpay_subscription_id text,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_addon_subscriptions_status_check
    check (status = any (array['active'::text, 'past_due'::text, 'canceled'::text, 'cancelling'::text, 'incomplete'::text]))
);

create index idx_org_addon_subscriptions_org_id on public.org_addon_subscriptions(org_id);
create unique index idx_org_addon_subscriptions_razorpay_id on public.org_addon_subscriptions(razorpay_subscription_id) where razorpay_subscription_id is not null;

create trigger org_addon_subscriptions_updated_at
  before update on public.org_addon_subscriptions
  for each row execute function public.update_updated_at();

comment on table public.org_addon_subscriptions is
  'Additive "Add On Plan" purchases stacked on top of an org''s base subscription (public.subscriptions). Each row grants an extra Pre Plan (slug lite) worth of limits and bills independently. Intentionally separate from subscriptions so the base-plan webhook cancel-all logic cannot touch these rows.';
