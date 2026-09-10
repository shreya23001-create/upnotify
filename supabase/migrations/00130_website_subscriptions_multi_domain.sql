-- Revises the per-website billing model (00129): a customer can add several
-- websites in ONE "Add Website" checkout session, billed together as a
-- single combined Razorpay subscription (₹149/month × domain count) with
-- one invoice. Adding more websites in a LATER, separate session creates a
-- SEPARATE combined subscription — batches are never merged together.
--
-- target_domain (singular) becomes domains (plural, array) to hold every
-- domain in the batch. target_domain is kept temporarily for any rows
-- already written by the single-domain flow and is nullable going forward;
-- new code should read/write `domains` instead.
alter table public.website_subscriptions add column if not exists domains text[] not null default '{}';

-- Backfill: fold the old single-domain rows into the new array column so
-- existing data (if any was created before this migration) keeps working.
update public.website_subscriptions
  set domains = array[target_domain]
  where target_domain is not null and (domains is null or domains = '{}');

-- Old exact-domain lookup index is no longer useful once domains is an
-- array (Postgres doesn't index array-containment the same way); replaced
-- with a GIN index for "does this org have an active row containing domain X".
drop index if exists idx_website_subscriptions_org_domain;
create index idx_website_subscriptions_domains_gin on public.website_subscriptions using gin (domains);

comment on column public.website_subscriptions.domains is
  'Every website domain covered by this one combined subscription/invoice. A customer adding more websites later in a SEPARATE checkout session gets a new row here, never merged into an existing one.';
