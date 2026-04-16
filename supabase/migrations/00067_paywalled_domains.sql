-- =============================================================================
-- Migration 00067: paywalled_domains
-- Auto-detected and pre-seeded list of domains that block scrapers.
-- Checked before article fetch to skip known paywalls without wasting the timeout.
-- =============================================================================

create table if not exists paywalled_domains (
  id          bigserial primary key,
  domain      text not null unique,          -- e.g. "ft.com" (no www, no scheme)
  auto_detected boolean not null default true, -- false = manually seeded
  added_at    timestamptz not null default now()
);

-- Index for fast lookup by domain
create index if not exists paywalled_domains_domain_idx on paywalled_domains (domain);

-- Pre-seed known paywalls
insert into paywalled_domains (domain, auto_detected) values
  ('ft.com',              false),
  ('wsj.com',             false),
  ('nytimes.com',         false),
  ('bloomberg.com',       false),
  ('economist.com',       false),
  ('thetimes.co.uk',      false),
  ('telegraph.co.uk',     false),
  ('hbr.org',             false),
  ('theathletic.com',     false),
  ('businessinsider.com', false),
  ('barrons.com',         false),
  ('marketwatch.com',     false),
  ('newyorker.com',       false),
  ('wired.com',           false),
  ('foreignaffairs.com',  false),
  ('theinformation.com',  false),
  ('puck.news',           false),
  ('semafor.com',         false),
  ('axios.com',           false),
  ('politico.com',        false),
  ('theatlantic.com',     false),
  ('washingtonpost.com',  false),
  ('latimes.com',         false),
  ('bostonglobe.com',     false),
  ('sfchronicle.com',     false)
on conflict (domain) do nothing;
