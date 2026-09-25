-- Migration 134: Per-member sidebar tab access control
-- =================================================================
-- Adds a nullable text[] column recording which dashboard sidebar
-- tabs (by href) a 'member'-role user is allowed to see and reach.
-- NULL (the default) means "no restriction" — owners/admins are
-- always unrestricted regardless of this column's value; it only
-- takes effect for role = 'member'.

alter table public.users
  add column if not exists tab_access text[] default null;

comment on column public.users.tab_access is
  'Sidebar hrefs this member may access (e.g. {"/dashboard/monitors"}). NULL = unrestricted. Only enforced for role = member.';
