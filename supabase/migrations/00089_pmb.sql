-- =============================================================================
-- Migration 00068: pmb (Public Monitor Blogging)
-- Adds PMB columns to public_monitors, creates pmb_categories and pmb_runs.
-- pmb_runs is the dedup tracker + generation queue for all PMB blog posts.
-- =============================================================================

-- ── Add PMB fields to public_monitors ────────────────────────────────────────

alter table public_monitors
  add column if not exists pmb_enabled     boolean  not null default false,
  add column if not exists pmb_category    text,            -- slug from pmb_categories
  add column if not exists pmb_keywords    text[]   not null default '{}',
  add column if not exists status_page_url text;

create index if not exists public_monitors_pmb_enabled_idx
  on public_monitors (pmb_enabled)
  where pmb_enabled = true;

-- ── pmb_categories ────────────────────────────────────────────────────────────

create table if not exists pmb_categories (
  id               bigserial    primary key,
  slug             text         not null unique,
  display_name     text         not null,
  emoji            text         not null default '🌐',
  default_keywords text[]       not null default '{}',
  is_active        boolean      not null default true,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);

comment on table pmb_categories is
  'PMB content categories. Each category groups public monitors for comparison blogging.';

-- ── pmb_runs ──────────────────────────────────────────────────────────────────
-- One row per blog post to generate. run_key enforces dedup.
-- post_type: pairwise | leaderboard | category_report | provider_report

create table if not exists pmb_runs (
  id                bigserial    primary key,
  run_key           text         not null unique,  -- dedup key, see format in comments below
  post_type         text         not null,         -- 'pairwise' | 'leaderboard' | 'category_report' | 'provider_report'
  category_slug     text         not null,
  monitor_id        uuid         references public_monitors (id) on delete cascade,
  compare_monitor_id uuid        references public_monitors (id) on delete cascade,
  period_type       text         not null,         -- 'weekly' | 'monthly' | 'quarterly'
  period_start      date         not null,
  scheduled_for     date         not null,         -- which calendar day to generate this post
  status            text         not null default 'queued',
                                                   -- queued | generating | generated | approved | published | failed | discarded
  blog_post_id      uuid         references blog_posts (id) on delete set null,
  error_message     text,
  word_count        integer,
  generated_at      timestamptz,
  approved_at       timestamptz,
  approved_by       text,                          -- email of admin who approved
  created_at        timestamptz  not null default now()
);

-- run_key formats:
--   pairwise:        pw:{lower_domain}:{higher_domain}:{period_type}:{YYYY-MM-DD}
--   leaderboard:     lb:{category_slug}:{period_type}:{YYYY-MM-DD}
--   category_report: cr:{category_slug}:{period_type}:{YYYY-MM-DD}
--   provider_report: pr:{monitor_domain}:{period_type}:{YYYY-MM-DD}

create index if not exists pmb_runs_status_scheduled_idx
  on pmb_runs (status, scheduled_for);

create index if not exists pmb_runs_category_period_idx
  on pmb_runs (category_slug, period_type, period_start);

create index if not exists pmb_runs_monitor_idx
  on pmb_runs (monitor_id);

comment on table pmb_runs is
  'PMB generation queue. One row per blog post. run_key prevents duplicate generation across replays.';

-- ── Seed 10 PMB categories ────────────────────────────────────────────────────

insert into pmb_categories (slug, display_name, emoji, default_keywords) values
  ('ai-tools',          'AI Tools',                 '🤖', array['ai api uptime', 'ai service down', 'llm reliability', 'ai tool status', 'ai outage', 'chatgpt vs claude', 'ai api availability']),
  ('cloud-providers',   'Cloud Providers',           '☁️', array['cloud outage', 'aws vs azure', 'cloud reliability', 'cloud provider down', 'server down', 'cloud availability', 'uptime comparison']),
  ('payment-processors','Payment Processors',        '💳', array['payment gateway down', 'payment processor outage', 'stripe vs paypal', 'payment reliability', 'checkout failure', 'payment api status']),
  ('ecommerce',         'E-commerce Platforms',      '🛍️', array['ecommerce platform down', 'shopify outage', 'ecommerce reliability', 'online store status', 'ecommerce uptime']),
  ('collaboration',     'Collaboration Tools',       '💬', array['slack down', 'teams outage', 'collaboration tool status', 'video call issues', 'remote work tools down', 'productivity app outage']),
  ('devtools',          'Dev Tools & CI/CD',         '⚙️', array['ci cd down', 'github outage', 'devops tools status', 'pipeline failure', 'deployment platform down', 'dev tool reliability']),
  ('email-marketing',   'Email Marketing',           '📧', array['email delivery down', 'email marketing outage', 'smtp issues', 'email platform status', 'newsletter tool down', 'email deliverability']),
  ('cdn-security',      'CDN & Security',            '🌐', array['cdn outage', 'cloudflare down', 'ddos protection status', 'cdn reliability', 'web application firewall status', 'cdn latency']),
  ('cms-builders',      'CMS & Website Builders',    '📝', array['wordpress down', 'cms outage', 'website builder status', 'cms reliability', 'hosting outage', 'site builder down']),
  ('monitoring',        'Monitoring & Observability','📊', array['monitoring tool down', 'observability platform status', 'alerting system outage', 'apm tool reliability', 'monitoring reliability'])
on conflict (slug) do nothing;
