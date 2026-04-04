-- Fix org slug generation: use email prefix only + random suffix
-- Old: john-at-gmail.com-abc12345
-- New: john-abc12345

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
  new_workspace_id uuid;
  user_email text;
  user_name text;
  email_prefix text;
  invite_org_id uuid;
  invite_workspace_id uuid;
  invite_role text;
BEGIN
  user_email := new.email;
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));
  email_prefix := lower(regexp_replace(split_part(user_email, '@', 1), '[^a-z0-9]', '-', 'g'));

  -- Check if this is an invited user
  invite_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  invite_workspace_id := (new.raw_user_meta_data->>'workspace_id')::uuid;
  invite_role := coalesce(new.raw_user_meta_data->>'role', 'viewer');

  IF invite_org_id IS NOT NULL THEN
    INSERT INTO public.users (id, org_id, workspace_id, email, full_name, role)
    VALUES (new.id, invite_org_id, invite_workspace_id, user_email, user_name, invite_role);

    INSERT INTO public.contact_preferences (org_id, user_id)
    VALUES (invite_org_id, new.id);
  ELSE
    INSERT INTO public.organisations (name, slug, type)
    VALUES (user_name, email_prefix || '-' || substr(gen_random_uuid()::text, 1, 6), 'direct')
    RETURNING id INTO new_org_id;

    INSERT INTO public.workspaces (org_id, name, slug, is_internal)
    VALUES (new_org_id, 'Default', 'default', false)
    RETURNING id INTO new_workspace_id;

    INSERT INTO public.users (id, org_id, workspace_id, email, full_name, role)
    VALUES (new.id, new_org_id, new_workspace_id, user_email, user_name, 'admin');

    INSERT INTO public.contact_preferences (org_id, user_id)
    VALUES (new_org_id, new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
