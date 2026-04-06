-- =============================================================================
-- Migration: 00038_aoe.sql
-- AOE — Automated Outreach Engine
-- All tables prefixed aoe_ for easy identification and portability
-- =============================================================================

-- ---------------------------------------------------------------------------
-- aoe_outreach_log: every email ever sent by AOE
-- ---------------------------------------------------------------------------
create table if not exists public.aoe_outreach_log (
  id                  uuid primary key default gen_random_uuid(),
  domain              text not null,
  email_sent_to       text not null,
  email_source        text not null,         -- whois | rdap | website_scrape | pattern_guess
  campaign            text not null,         -- ssl_expiry | site_down | site_slow | ecom_down | compete_cold
  platform            text,                  -- general | shopify | woocommerce
  product             text not null,         -- uptrue | compete
  sent_at             timestamptz not null default now(),
  opened_at           timestamptz,
  clicked_at          timestamptz,
  bounced             boolean not null default false,
  spam_complaint      boolean not null default false,
  opted_out           boolean not null default false,
  opted_out_at        timestamptz,
  converted           boolean not null default false,
  converted_at        timestamptz,
  converted_plan      text,                  -- free | lite | builder | scale
  resend_message_id   text,                  -- Resend message ID for webhook matching
  month               text not null          -- YYYY-MM for grouping
);

create index if not exists aoe_outreach_log_domain_idx   on public.aoe_outreach_log (domain);
create index if not exists aoe_outreach_log_month_idx    on public.aoe_outreach_log (month);
create index if not exists aoe_outreach_log_campaign_idx on public.aoe_outreach_log (campaign);
create index if not exists aoe_outreach_log_resend_idx   on public.aoe_outreach_log (resend_message_id);

-- ---------------------------------------------------------------------------
-- aoe_site_discovery: sites queued for silent monitoring then emailing
-- ---------------------------------------------------------------------------
create table if not exists public.aoe_site_discovery (
  id                  uuid primary key default gen_random_uuid(),
  domain              text not null unique,
  platform            text,                  -- general | shopify | woocommerce
  email               text,
  email_source        text,                  -- whois | rdap | website_scrape | pattern_guess
  discovered_at       timestamptz not null default now(),
  status              text not null default 'pending_check',
                                             -- pending_check | checking | ready | emailed | opted_out | skip
  check_count         int not null default 0,
  last_checked_at     timestamptz,
  ready_at            timestamptz,
  emailed_at          timestamptz,
  skip_reason         text                   -- existing_user | no_email | opted_out | no_issues
);

create index if not exists aoe_site_discovery_status_idx   on public.aoe_site_discovery (status);
create index if not exists aoe_site_discovery_platform_idx on public.aoe_site_discovery (platform);

-- ---------------------------------------------------------------------------
-- aoe_site_checks: nightly silent check results per site (3 nights, 18 checks)
-- ---------------------------------------------------------------------------
create table if not exists public.aoe_site_checks (
  id                  uuid primary key default gen_random_uuid(),
  domain              text not null,
  checked_at          timestamptz not null default now(),
  response_time_ms    int,
  status_code         int,
  is_down             boolean not null default false,
  ssl_expiry_days     int,
  error_message       text,
  check_number        int not null           -- 1-18 across 3 nights
);

create index if not exists aoe_site_checks_domain_idx on public.aoe_site_checks (domain);
create index if not exists aoe_site_checks_checked_at_idx on public.aoe_site_checks (checked_at);

-- ---------------------------------------------------------------------------
-- aoe_email_quota: monthly quota snapshot — recalculated daily at midnight
-- ---------------------------------------------------------------------------
create table if not exists public.aoe_email_quota (
  id                  uuid primary key default gen_random_uuid(),
  month               text not null unique,  -- YYYY-MM
  total_quota         int not null,          -- 50000
  reserved_alerts     int not null,          -- calculated from monitors + subscribers
  safety_buffer       int not null,          -- 20% of reserved_alerts
  hard_reserve        int not null,          -- 2% of total_quota
  available_marketing int not null,          -- total - reserved - buffer - hard_reserve
  monitors_with_email int,                   -- snapshot at calculation time
  status_page_subs    int,                   -- snapshot at calculation time
  marketing_sent      int not null default 0,
  alert_sent          int not null default 0,
  burst_sent          int not null default 0,
  status              text not null default 'active',
                                             -- active | paused_85 | upgrade_required_95
  calculated_at       timestamptz,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- aoe_settings: admin-controlled toggles (ON/OFF per campaign)
-- ---------------------------------------------------------------------------
create table if not exists public.aoe_settings (
  key                 text primary key,
  value               text not null,         -- 'true' | 'false' | numeric string
  updated_at          timestamptz not null default now(),
  updated_by          text                   -- admin email who made the change
);

-- Seed default settings
insert into public.aoe_settings (key, value) values
  ('master_enabled',           'true'),
  ('campaign_ssl_expiry',      'true'),
  ('campaign_site_down',       'true'),
  ('campaign_ecom_down',       'true'),
  ('campaign_compete_cold',    'false'),
  ('last_day_burst_enabled',   'true'),
  ('daily_discovery_limit',    '5000'),
  ('daily_email_limit',        '2000'),
  ('cooldown_days',            '30')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS: disable for all AOE tables (admin client only — no user access)
-- ---------------------------------------------------------------------------
alter table public.aoe_outreach_log   disable row level security;
alter table public.aoe_site_discovery disable row level security;
alter table public.aoe_site_checks    disable row level security;
alter table public.aoe_email_quota    disable row level security;
alter table public.aoe_settings       disable row level security;
