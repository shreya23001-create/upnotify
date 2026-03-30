-- Migration 2: Core tenancy — organisations, workspaces, users + RLS helpers
-- =================================================================

-- =================================================================
-- CREATE TABLES FIRST (before helper functions that reference them)
-- =================================================================

-- ORGANISATIONS
create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  type        text not null default 'direct' check (type in ('direct', 'agency')),
  stripe_customer_id        text unique,
  stripe_connect_account_id text,
  timezone    text not null default 'Europe/London',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger organisations_updated_at
  before update on public.organisations
  for each row execute function public.update_updated_at();

-- WORKSPACES
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations(id) on delete cascade,
  name        text not null,
  slug        text not null,
  is_internal boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);

create index idx_workspaces_org_id on public.workspaces(org_id);

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.update_updated_at();

-- USERS
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  org_id          uuid not null references public.organisations(id) on delete cascade,
  workspace_id    uuid references public.workspaces(id) on delete set null,
  email           text not null,
  full_name       text,
  role            text not null default 'viewer' check (role in ('admin', 'manager', 'viewer', 'client')),
  is_super_admin  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_users_org_id on public.users(org_id);
create index idx_users_email on public.users(email);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

-- =================================================================
-- RLS HELPER FUNCTIONS (now that users table exists)
-- SECURITY DEFINER so they bypass RLS when reading public.users
-- =================================================================

create or replace function public.user_org_id()
returns uuid as $$
  select org_id from public.users where id = auth.uid()
$$ language sql security definer stable;

create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and is_super_admin = true
  )
$$ language sql security definer stable;

create or replace function public.user_role()
returns text as $$
  select role from public.users where id = auth.uid()
$$ language sql security definer stable;

-- =================================================================
-- RLS POLICIES (now that helper functions exist)
-- =================================================================

-- ORGANISATIONS RLS
alter table public.organisations enable row level security;

create policy "Users can view own org"
  on public.organisations for select to authenticated
  using (id = public.user_org_id());

create policy "Super admin can view all orgs"
  on public.organisations for select to authenticated
  using (public.is_super_admin());

create policy "Admins can update own org"
  on public.organisations for update to authenticated
  using (id = public.user_org_id() and public.user_role() = 'admin')
  with check (id = public.user_org_id());

-- WORKSPACES RLS
alter table public.workspaces enable row level security;

create policy "Users can view own org workspaces"
  on public.workspaces for select to authenticated
  using (org_id = public.user_org_id());

create policy "Admins can create workspaces"
  on public.workspaces for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

create policy "Admins can update workspaces"
  on public.workspaces for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'))
  with check (org_id = public.user_org_id());

create policy "Admins can delete workspaces"
  on public.workspaces for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');

-- USERS RLS
alter table public.users enable row level security;

create policy "Users can view own org members"
  on public.users for select to authenticated
  using (org_id = public.user_org_id());

create policy "Users can update own profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can insert users in own org"
  on public.users for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() = 'admin');

create policy "Admins can delete users in own org"
  on public.users for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');
