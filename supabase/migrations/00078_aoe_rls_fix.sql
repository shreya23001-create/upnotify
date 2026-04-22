-- Migration 00078: Re-apply RLS on AOE tables
-- 00049_aoe_rls.sql was never executed against the live database.
-- These tables are accessed exclusively via the service role client which bypasses RLS.
-- Enabling RLS with no user policies = zero PostgREST access for anon/authenticated roles.

alter table public.aoe_outreach_log    enable row level security;
alter table public.aoe_site_discovery  enable row level security;
alter table public.aoe_site_checks     enable row level security;
alter table public.aoe_email_quota     enable row level security;
alter table public.aoe_settings        enable row level security;
