-- =============================================================
-- 00024: Compete Add-on Plans (separate from base monitoring plans)
-- Separate Stripe subscription, itemized on same invoice
-- =============================================================

-- Compete plans table
create table if not exists compete_plans (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  description           text,
  product_limit         integer not null default 10,
  price_monthly_pence   integer not null default 0,
  price_yearly_pence    integer,
  has_yearly_discount   boolean not null default false,
  extra_product_price_pence integer not null default 100,
  extra_product_bundle_sizes integer[] not null default '{5,10}',
  max_extra_products    integer not null default 20,
  nudge_to_slug         text,
  stripe_product_id     text,
  stripe_monthly_price_id text,
  stripe_yearly_price_id  text,
  is_active             boolean not null default true,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now()
);

-- Compete subscriptions (separate from base monitoring subscriptions)
create table if not exists compete_subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references organisations(id) on delete cascade,
  compete_plan_id         uuid not null references compete_plans(id),
  stripe_subscription_id  text,
  status                  text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  billing_cycle           text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  extra_products_purchased integer not null default 0,
  stripe_extra_price_id   text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  canceled_at             timestamptz,
  created_at              timestamptz not null default now()
);

-- Indexes
create index idx_compete_subs_org on compete_subscriptions(org_id);
create index idx_compete_subs_status on compete_subscriptions(org_id, status) where status = 'active';

-- RLS
alter table compete_plans enable row level security;
alter table compete_subscriptions enable row level security;

-- Plans are readable by everyone (public pricing)
create policy "Anyone can read compete plans" on compete_plans
  for select using (true);

-- Subscriptions: users can read their own org's
create policy "Users can read own compete subscription" on compete_subscriptions
  for select using (
    org_id in (select org_id from users where id = auth.uid())
  );

-- Remove has_compete and compete_product_limit from base plans (no longer bundled)
alter table plans drop column if exists has_compete;
alter table plans drop column if exists compete_product_limit;

-- Seed compete plans
insert into compete_plans (name, slug, description, product_limit, price_monthly_pence, price_yearly_pence, has_yearly_discount, extra_product_price_pence, extra_product_bundle_sizes, max_extra_products, nudge_to_slug, sort_order)
values
  ('Starter', 'compete-starter', 'Track up to 10 competitor products', 10, 900, 9000, true, 100, '{5,10}', 20, 'compete-pro', 1),
  ('Pro', 'compete-pro', 'Track up to 500 competitor products', 500, 2900, 29000, true, 100, '{5,10}', 100, 'compete-business', 2),
  ('Business', 'compete-business', 'Track up to 2,500 competitor products', 2500, 9900, null, false, 100, '{5,10}', 2500, null, 3);
