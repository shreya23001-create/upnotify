-- Migration 4: Monitoring — monitors, check_results, incidents, maintenance_windows
-- =================================================================

-- =================================================================
-- MONITORS
-- =================================================================
create table public.monitors (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references public.organisations(id) on delete cascade,
  workspace_id            uuid not null references public.workspaces(id) on delete cascade,
  name                    text not null,
  type                    text not null check (type in (
    'http', 'ssl', 'domain', 'dns', 'keyword',
    'port', 'api', 'ping', 'heartbeat', 'competitor', 'server'
  )),
  target                  text not null,
  check_interval_seconds  integer not null default 300,
  timeout_ms              integer not null default 30000,
  config                  jsonb not null default '{}',
  severity                text not null default 'P2' check (severity in ('P1', 'P2', 'P3', 'P4')),
  status                  text not null default 'unknown' check (status in ('up', 'down', 'degraded', 'unknown', 'paused')),
  is_paused               boolean not null default false,
  last_checked_at         timestamptz,
  next_check_at           timestamptz,
  flap_count              integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_monitors_org_workspace on public.monitors(org_id, workspace_id);
create index idx_monitors_next_check on public.monitors(next_check_at) where is_paused = false;

create trigger monitors_updated_at
  before update on public.monitors
  for each row execute function public.update_updated_at();

alter table public.monitors enable row level security;

create policy "Users can view own org monitors"
  on public.monitors for select to authenticated
  using (org_id = public.user_org_id());

create policy "Admins/managers can create monitors"
  on public.monitors for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

create policy "Admins/managers can update monitors"
  on public.monitors for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'))
  with check (org_id = public.user_org_id());

create policy "Admins can delete monitors"
  on public.monitors for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

-- =================================================================
-- CHECK RESULTS (immutable — INSERT + SELECT only)
-- =================================================================
create table public.check_results (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  monitor_id      uuid not null references public.monitors(id) on delete cascade,
  status          text not null check (status in ('up', 'down', 'degraded')),
  response_time_ms integer,
  status_code     integer,
  region          text,
  error_message   text,
  metadata        jsonb not null default '{}',
  checked_at      timestamptz not null default now()
);

create index idx_check_results_monitor_time on public.check_results(monitor_id, checked_at desc);
create index idx_check_results_org_time on public.check_results(org_id, checked_at desc);

alter table public.check_results enable row level security;

-- SELECT only for org members
create policy "Users can view own org check results"
  on public.check_results for select to authenticated
  using (org_id = public.user_org_id());

-- INSERT only (no update, no delete — immutable)
create policy "Service can insert check results"
  on public.check_results for insert to authenticated
  with check (org_id = public.user_org_id());

-- =================================================================
-- INCIDENTS
-- =================================================================
create table public.incidents (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  monitor_id      uuid not null references public.monitors(id) on delete cascade,
  title           text not null,
  status          text not null default 'investigating' check (status in ('investigating', 'identified', 'monitoring', 'resolved')),
  severity        text not null check (severity in ('P1', 'P2', 'P3', 'P4')),
  started_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  duration_seconds integer,
  root_cause      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_incidents_org_workspace on public.incidents(org_id, workspace_id, status);
create index idx_incidents_monitor on public.incidents(monitor_id, started_at desc);

create trigger incidents_updated_at
  before update on public.incidents
  for each row execute function public.update_updated_at();

alter table public.incidents enable row level security;

create policy "Users can view own org incidents"
  on public.incidents for select to authenticated
  using (org_id = public.user_org_id());

create policy "Admins/managers can create incidents"
  on public.incidents for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

create policy "Admins/managers can update incidents"
  on public.incidents for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'))
  with check (org_id = public.user_org_id());

create policy "Admins can delete incidents"
  on public.incidents for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');

-- =================================================================
-- MAINTENANCE WINDOWS
-- =================================================================
create table public.maintenance_windows (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.organisations(id) on delete cascade,
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  title                 text not null,
  description           text,
  starts_at             timestamptz not null,
  ends_at               timestamptz not null,
  affected_monitor_ids  uuid[] not null default '{}',
  is_active             boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_maintenance_windows_org on public.maintenance_windows(org_id, starts_at, ends_at);

create trigger maintenance_windows_updated_at
  before update on public.maintenance_windows
  for each row execute function public.update_updated_at();

alter table public.maintenance_windows enable row level security;

create policy "Users can view own org maintenance windows"
  on public.maintenance_windows for select to authenticated
  using (org_id = public.user_org_id());

create policy "Admins/managers can create maintenance windows"
  on public.maintenance_windows for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

create policy "Admins/managers can update maintenance windows"
  on public.maintenance_windows for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'))
  with check (org_id = public.user_org_id());

create policy "Admins can delete maintenance windows"
  on public.maintenance_windows for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');
