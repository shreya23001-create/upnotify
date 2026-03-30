-- Migration 3: Billing — plans, subscriptions, invoices, payouts, preferences
-- =================================================================

-- =================================================================
-- PLANS (publicly readable, super admin writable)
-- =================================================================
create table public.plans (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  slug                    text unique not null,
  type                    text not null check (type in ('direct', 'agency')),
  price_monthly_gbp       integer not null default 0,
  price_annual_gbp        integer,
  onboarding_fee_gbp      integer not null default 0,
  monitor_limit           integer,
  check_interval_seconds  integer not null default 300,
  client_workspace_limit  integer,
  data_retention_days     integer,
  has_api_access          boolean not null default false,
  has_ai_predictive       boolean not null default false,
  has_status_page_custom_domain boolean not null default false,
  has_white_label         boolean not null default false,
  has_voice_calls         boolean not null default false,
  voice_call_monthly_limit integer not null default 0,
  is_visible              boolean not null default true,
  stripe_price_id_monthly text,
  stripe_price_id_annual  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.update_updated_at();

alter table public.plans enable row level security;

create policy "Anyone authenticated can view visible plans"
  on public.plans for select to authenticated
  using (is_visible = true);

create policy "Anon can view visible plans"
  on public.plans for select to anon
  using (is_visible = true);

create policy "Super admin can manage plans"
  on public.plans for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =================================================================
-- SUBSCRIPTIONS
-- =================================================================
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references public.organisations(id) on delete cascade,
  plan_id                 uuid not null references public.plans(id),
  stripe_subscription_id  text,
  status                  text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  billing_cycle           text check (billing_cycle in ('monthly', 'annual', 'one_time')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  canceled_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_subscriptions_org_id on public.subscriptions(org_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

alter table public.subscriptions enable row level security;

create policy "Users can view own org subscriptions"
  on public.subscriptions for select to authenticated
  using (org_id = public.user_org_id());

create policy "Super admin can manage subscriptions"
  on public.subscriptions for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =================================================================
-- INVOICES
-- =================================================================
create table public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations(id) on delete cascade,
  subscription_id     uuid references public.subscriptions(id) on delete set null,
  stripe_invoice_id   text,
  amount_gbp          integer not null,
  status              text not null default 'draft' check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf_url     text,
  period_start        timestamptz,
  period_end          timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_invoices_org_id on public.invoices(org_id, created_at desc);

alter table public.invoices enable row level security;

create policy "Users can view own org invoices"
  on public.invoices for select to authenticated
  using (org_id = public.user_org_id());

create policy "Super admin can manage invoices"
  on public.invoices for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =================================================================
-- STRIPE CONNECT PAYOUTS (agency revenue tracking)
-- =================================================================
create table public.stripe_connect_payouts (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations(id) on delete cascade,
  stripe_payout_id    text not null,
  amount_gbp          integer not null,
  platform_fee_gbp    integer not null,
  status              text not null,
  payout_date         timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_stripe_connect_payouts_org_id on public.stripe_connect_payouts(org_id);

alter table public.stripe_connect_payouts enable row level security;

create policy "Users can view own org payouts"
  on public.stripe_connect_payouts for select to authenticated
  using (org_id = public.user_org_id());

create policy "Super admin can manage payouts"
  on public.stripe_connect_payouts for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =================================================================
-- CONTACT PREFERENCES
-- =================================================================
create table public.contact_preferences (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references public.organisations(id) on delete cascade,
  user_id                 uuid not null references public.users(id) on delete cascade,
  email_product_updates   boolean not null default true,
  email_billing           boolean not null default true,
  email_incident_digest   boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id)
);

create trigger contact_preferences_updated_at
  before update on public.contact_preferences
  for each row execute function public.update_updated_at();

alter table public.contact_preferences enable row level security;

create policy "Users can view own preferences"
  on public.contact_preferences for select to authenticated
  using (user_id = auth.uid());

create policy "Users can update own preferences"
  on public.contact_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can insert own preferences"
  on public.contact_preferences for insert to authenticated
  with check (user_id = auth.uid());
