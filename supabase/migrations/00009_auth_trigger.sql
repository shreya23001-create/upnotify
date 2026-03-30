-- Migration 9: Auth trigger — auto-create org + workspace + user on signup
-- =================================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
  new_workspace_id uuid;
  user_email text;
  user_name text;
  invite_org_id uuid;
  invite_workspace_id uuid;
  invite_role text;
begin
  user_email := new.email;
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));

  -- Check if this is an invited user (org_id set in metadata)
  invite_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  invite_workspace_id := (new.raw_user_meta_data->>'workspace_id')::uuid;
  invite_role := coalesce(new.raw_user_meta_data->>'role', 'viewer');

  if invite_org_id is not null then
    -- Invited user: join existing org
    insert into public.users (id, org_id, workspace_id, email, full_name, role)
    values (new.id, invite_org_id, invite_workspace_id, user_email, user_name, invite_role);

    -- Create contact preferences
    insert into public.contact_preferences (org_id, user_id)
    values (invite_org_id, new.id);
  else
    -- New signup: create org + workspace + user
    insert into public.organisations (name, slug, type)
    values (user_name, replace(lower(user_email), '@', '-at-') || '-' || substr(gen_random_uuid()::text, 1, 8), 'direct')
    returning id into new_org_id;

    insert into public.workspaces (org_id, name, slug, is_internal)
    values (new_org_id, 'Default', 'default', false)
    returning id into new_workspace_id;

    insert into public.users (id, org_id, workspace_id, email, full_name, role)
    values (new.id, new_org_id, new_workspace_id, user_email, user_name, 'admin');

    -- Create contact preferences
    insert into public.contact_preferences (org_id, user_id)
    values (new_org_id, new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Fire after a new user is created in Supabase Auth
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
