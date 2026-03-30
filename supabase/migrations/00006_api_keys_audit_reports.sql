-- Migration 6: API keys, audit log, reports
-- =================================================================

-- =================================================================
-- API KEYS
-- =================================================================
create table public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations(id) on delete cascade,
  name        text not null,
  key_hash    text not null,
  key_prefix  text not null,
  scopes      text[] not null default '{read}',
  last_used_at timestamptz,
  expires_at  timestamptz,
  is_revoked  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_api_keys_org on public.api_keys(org_id);
create index idx_api_keys_prefix on public.api_keys(key_prefix);

alter table public.api_keys enable row level security;

create policy "Admins can view own org API keys"
  on public.api_keys for select to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');

create policy "Admins can create API keys"
  on public.api_keys for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() = 'admin');

create policy "Admins can revoke API keys"
  on public.api_keys for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin')
  with check (org_id = public.user_org_id());

create policy "Admins can delete API keys"
  on public.api_keys for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');

-- =================================================================
-- AUDIT LOG (immutable — INSERT + SELECT only)
-- =================================================================
create table public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null,
  user_id         uuid,
  action          text not null,
  resource_type   text,
  resource_id     uuid,
  metadata        jsonb not null default '{}',
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- No foreign key on org_id intentionally — audit records must survive org deletion
create index idx_audit_log_org_time on public.audit_log(org_id, created_at desc);
create index idx_audit_log_action on public.audit_log(action, created_at desc);

alter table public.audit_log enable row level security;

-- Only admins can read audit logs
create policy "Admins can view own org audit log"
  on public.audit_log for select to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');

-- Super admin can view all audit logs
create policy "Super admin can view all audit logs"
  on public.audit_log for select to authenticated
  using (public.is_super_admin());

-- Any authenticated user can insert (actions are logged for all roles)
create policy "Authenticated users can insert audit log"
  on public.audit_log for insert to authenticated
  with check (org_id = public.user_org_id());

-- No UPDATE or DELETE policies — audit log is immutable

-- =================================================================
-- REPORTS
-- =================================================================
create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  type            text not null default 'monthly' check (type in ('monthly', 'custom', 'on_demand')),
  period_start    date not null,
  period_end      date not null,
  data            jsonb not null default '{}',
  ai_summary      text,
  generated_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index idx_reports_org_workspace on public.reports(org_id, workspace_id, period_start desc);

alter table public.reports enable row level security;

create policy "Users can view own org reports"
  on public.reports for select to authenticated
  using (org_id = public.user_org_id());

create policy "Service can insert reports"
  on public.reports for insert to authenticated
  with check (org_id = public.user_org_id());
