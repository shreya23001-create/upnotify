-- Migration 00049: Enable RLS on all AOE internal tables
-- These tables are accessed exclusively via the admin (service role) client,
-- which bypasses RLS. Enabling RLS with no user policies means:
--   - Regular users: zero access via PostgREST (correct)
--   - Service role: bypasses RLS as normal (no change)
-- This resolves the Supabase security advisory "RLS not enabled on public table".

alter table public.aoe_outreach_log    enable row level security;
alter table public.aoe_site_discovery  enable row level security;
alter table public.aoe_site_checks     enable row level security;
alter table public.aoe_email_quota     enable row level security;
alter table public.aoe_settings        enable row level security;
