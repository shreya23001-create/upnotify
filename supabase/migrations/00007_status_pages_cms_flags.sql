-- Migration 7: Status pages, CMS, feature flags, agency tags
-- =================================================================

-- =================================================================
-- STATUS PAGES
-- =================================================================
create table public.status_pages (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references public.organisations(id) on delete cascade,
  workspace_id            uuid not null references public.workspaces(id) on delete cascade,
  name                    text not null,
  slug                    text unique not null,
  custom_domain           text,
  custom_domain_verified  boolean not null default false,
  dns_verification_token  text,
  branding                jsonb not null default '{}',
  monitor_ids             uuid[] not null default '{}',
  is_published            boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_status_pages_org on public.status_pages(org_id, workspace_id);
create index idx_status_pages_slug on public.status_pages(slug);
create index idx_status_pages_domain on public.status_pages(custom_domain) where custom_domain is not null;

create trigger status_pages_updated_at
  before update on public.status_pages
  for each row execute function public.update_updated_at();

alter table public.status_pages enable row level security;

-- Public can view published status pages
create policy "Public can view published status pages"
  on public.status_pages for select to anon
  using (is_published = true);

create policy "Users can view own org status pages"
  on public.status_pages for select to authenticated
  using (org_id = public.user_org_id());

create policy "Admins/managers can create status pages"
  on public.status_pages for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'));

create policy "Admins/managers can update status pages"
  on public.status_pages for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() in ('admin', 'manager'))
  with check (org_id = public.user_org_id());

create policy "Admins can delete status pages"
  on public.status_pages for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');

-- =================================================================
-- STATUS PAGE SUBSCRIBERS
-- =================================================================
create table public.status_page_subscribers (
  id                  uuid primary key default gen_random_uuid(),
  status_page_id      uuid not null references public.status_pages(id) on delete cascade,
  email               text not null,
  confirmed           boolean not null default false,
  confirmation_token  text,
  unsubscribe_token   text not null default gen_random_uuid()::text,
  created_at          timestamptz not null default now(),
  unique (status_page_id, email)
);

alter table public.status_page_subscribers enable row level security;

-- Public can subscribe (insert)
create policy "Anyone can subscribe to status page"
  on public.status_page_subscribers for insert to anon
  with check (true);

-- Public can unsubscribe (update confirmed/unsubscribe)
create policy "Anyone can update subscription via token"
  on public.status_page_subscribers for update to anon
  using (true)
  with check (true);

-- Org admins can view subscribers for their status pages
create policy "Admins can view status page subscribers"
  on public.status_page_subscribers for select to authenticated
  using (
    exists (
      select 1 from public.status_pages sp
      where sp.id = status_page_id and sp.org_id = public.user_org_id()
    )
  );

-- =================================================================
-- BLOG POSTS
-- =================================================================
create table public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  content         jsonb not null default '{}',
  excerpt         text,
  author_id       uuid references public.users(id) on delete set null,
  status          text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  category        text,
  tags            text[],
  seo_title       text,
  seo_description text,
  og_image_url    text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_blog_posts_slug on public.blog_posts(slug);
create index idx_blog_posts_status on public.blog_posts(status, published_at desc);

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.update_updated_at();

alter table public.blog_posts enable row level security;

-- Public can read published posts
create policy "Public can view published blog posts"
  on public.blog_posts for select to anon
  using (status = 'published');

-- Authenticated users can also read published posts
create policy "Authenticated can view published blog posts"
  on public.blog_posts for select to authenticated
  using (status = 'published');

-- Super admin can manage all posts
create policy "Super admin can manage blog posts"
  on public.blog_posts for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =================================================================
-- PAGE SECTIONS (CMS landing pages)
-- =================================================================
create table public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,
  section_key text not null,
  content     jsonb not null default '{}',
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  updated_at  timestamptz not null default now(),
  unique (page, section_key)
);

create trigger page_sections_updated_at
  before update on public.page_sections
  for each row execute function public.update_updated_at();

alter table public.page_sections enable row level security;

create policy "Public can view visible page sections"
  on public.page_sections for select to anon
  using (is_visible = true);

create policy "Authenticated can view visible page sections"
  on public.page_sections for select to authenticated
  using (is_visible = true);

create policy "Super admin can manage page sections"
  on public.page_sections for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =================================================================
-- ADMIN PERMISSIONS (sub-admin access control)
-- =================================================================
create table public.admin_permissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  module      text not null,
  can_read    boolean not null default true,
  can_write   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, module)
);

alter table public.admin_permissions enable row level security;

create policy "Super admin can manage admin permissions"
  on public.admin_permissions for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Admins can view own permissions"
  on public.admin_permissions for select to authenticated
  using (user_id = auth.uid());

-- =================================================================
-- FEATURE FLAGS
-- =================================================================
create table public.feature_flags (
  id                  uuid primary key default gen_random_uuid(),
  key                 text unique not null,
  description         text,
  is_enabled          boolean not null default false,
  rollout_percentage  integer not null default 0 check (rollout_percentage >= 0 and rollout_percentage <= 100),
  target_org_ids      uuid[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_feature_flags_key on public.feature_flags(key);

create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.update_updated_at();

alter table public.feature_flags enable row level security;

create policy "Authenticated can read feature flags"
  on public.feature_flags for select to authenticated
  using (true);

create policy "Super admin can manage feature flags"
  on public.feature_flags for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =================================================================
-- FEATURE FLAG USAGE (telemetry)
-- =================================================================
create table public.feature_flag_usage (
  id          uuid primary key default gen_random_uuid(),
  flag_id     uuid not null references public.feature_flags(id) on delete cascade,
  org_id      uuid not null,
  result      boolean not null,
  evaluated_at timestamptz not null default now()
);

alter table public.feature_flag_usage enable row level security;

create policy "Authenticated can insert flag usage"
  on public.feature_flag_usage for insert to authenticated
  with check (true);

create policy "Super admin can view flag usage"
  on public.feature_flag_usage for select to authenticated
  using (public.is_super_admin());

-- =================================================================
-- AGENCY TAGS (GTM, GA4, Meta Pixel)
-- =================================================================
create table public.agency_tags (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade unique,
  gtm_id          text,
  ga4_id          text,
  pixel_id        text,
  custom_script   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger agency_tags_updated_at
  before update on public.agency_tags
  for each row execute function public.update_updated_at();

alter table public.agency_tags enable row level security;

create policy "Users can view own org agency tags"
  on public.agency_tags for select to authenticated
  using (org_id = public.user_org_id());

create policy "Admins can manage agency tags"
  on public.agency_tags for insert to authenticated
  with check (org_id = public.user_org_id() and public.user_role() = 'admin');

create policy "Admins can update agency tags"
  on public.agency_tags for update to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin')
  with check (org_id = public.user_org_id());

create policy "Admins can delete agency tags"
  on public.agency_tags for delete to authenticated
  using (org_id = public.user_org_id() and public.user_role() = 'admin');
