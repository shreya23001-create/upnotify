-- Migration 5: Alerting — alert_channels, alerts, voice_call_logs
-- =================================================================

-- =================================================================
-- ALERT CHANNELS
-- =================================================================
create table public.alert_channels (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  workspace_id    uuid references public.workspaces(id) on delete cascade,
  type            text not null check (type in ('email', 'slack', 'teams', 'whatsapp', 'voice', 'webhook')),
  name            text not null,
  config          jsonb not null default '{}',
  severity_filter text[] not null default '{P1,P2,P3,P4}',
  is_enabled      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_alert_channels_org_workspace on public.alert_channels(org_id, workspace_id);

create trigger alert_channels_updated_at
  before update on public.alert_channels
  for each row execute function public.update_updated_at();

alter table public.alert_channels enable row level security;

create policy "Users can view own org alert channels"
  on public.alert_channels for select to authenticated
  using (org_id = public.user_org_id());

create policy "Admins/managers can create alert channels"
  on public.alert_channels for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

create policy "Admins/managers can update alert channels"
  on public.alert_channels for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'))
  with check (org_id = public.user_org_id());

create policy "Admins can delete alert channels"
  on public.alert_channels for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

-- =================================================================
-- ALERTS (dispatched alert records)
-- =================================================================
create table public.alerts (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  incident_id     uuid not null references public.incidents(id) on delete cascade,
  channel_id      uuid not null references public.alert_channels(id) on delete cascade,
  status          text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'acknowledged')),
  sent_at         timestamptz,
  error_message   text,
  created_at      timestamptz not null default now()
);

create index idx_alerts_incident on public.alerts(incident_id);
create index idx_alerts_org_time on public.alerts(org_id, created_at desc);

alter table public.alerts enable row level security;

create policy "Users can view own org alerts"
  on public.alerts for select to authenticated
  using (org_id = public.user_org_id());

create policy "Service can insert alerts"
  on public.alerts for insert to authenticated
  with check (org_id = public.user_org_id());

create policy "Service can update alert status"
  on public.alerts for update to authenticated
  using (org_id = public.user_org_id())
  with check (org_id = public.user_org_id());

-- =================================================================
-- VOICE CALL LOGS
-- =================================================================
create table public.voice_call_logs (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations(id) on delete cascade,
  alert_id            uuid not null references public.alerts(id) on delete cascade,
  twilio_call_sid     text,
  to_number           text not null,
  duration_seconds    integer,
  status              text not null,
  cost_gbp            integer,
  created_at          timestamptz not null default now()
);

create index idx_voice_call_logs_org on public.voice_call_logs(org_id, created_at desc);

alter table public.voice_call_logs enable row level security;

create policy "Users can view own org voice call logs"
  on public.voice_call_logs for select to authenticated
  using (org_id = public.user_org_id());

create policy "Service can insert voice call logs"
  on public.voice_call_logs for insert to authenticated
  with check (org_id = public.user_org_id());
