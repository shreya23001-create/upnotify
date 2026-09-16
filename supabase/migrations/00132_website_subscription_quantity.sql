-- Explicit paid "slot count", independent of how many domains have been
-- named yet. Lets a user buy N slots before naming any domain. Total limit
-- = SUM(purchased_quantity) over active/cancelling/past_due rows — a SUM,
-- not a counter column, so activateWebsiteSubscription's existing
-- razorpay_subscription_id dedup (one row per real payment) is *itself*
-- the idempotency guard against webhook retries. No separate ledger needed.
alter table public.website_subscriptions
  add column if not exists purchased_quantity integer not null default 0;

-- Backfill: every existing paid row bought exactly as many slots as it
-- currently has named domains (the old implicit model). This retroactively
-- caps existing per-website customers at their current count; they can buy
-- more via the same picker going forward.
update public.website_subscriptions
   set purchased_quantity = coalesce(array_length(domains, 1), 0)
 where status <> 'incomplete'
   and purchased_quantity = 0;

alter table public.website_subscriptions
  add constraint website_subscriptions_quantity_nonneg check (purchased_quantity >= 0);

alter table public.website_subscriptions
  add constraint website_subscriptions_domains_within_quantity
  check (status = 'incomplete' or coalesce(array_length(domains, 1), 0) <= purchased_quantity);

comment on column public.website_subscriptions.purchased_quantity is
  'Website slots paid for in this checkout. Org total limit = SUM over active/cancelling/past_due rows.';

-- Single round-trip limit lookup.
create or replace function public.org_purchased_website_limit(p_org_id uuid)
returns integer language sql stable as $$
  select coalesce(sum(purchased_quantity), 0)::int
    from public.website_subscriptions
   where org_id = p_org_id
     and status in ('active', 'cancelling', 'past_due');
$$;

-- Race-safe slot claim: finds a paid row with a free slot and appends the
-- domain to it. Used by addPendingWebsites instead of inserting a separate
-- 'incomplete' row, once the org has a purchased slot available.
create or replace function public.claim_website_slot(p_org_id uuid, p_domain text)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id
    from public.website_subscriptions
   where org_id = p_org_id
     and status in ('active','cancelling','past_due')
     and coalesce(array_length(domains,1),0) < purchased_quantity
   order by created_at
   for update skip locked
   limit 1;
  if v_id is null then return null; end if;
  update public.website_subscriptions set domains = array_append(domains, p_domain) where id = v_id;
  return v_id;
end $$;
