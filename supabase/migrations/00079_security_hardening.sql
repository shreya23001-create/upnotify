-- Migration 00079: Security hardening — function search paths + RLS policy tightening
-- Fixes all Supabase linter WARN items from the security advisor report.
--
-- 1. All 11 functions get SET search_path = '' to prevent search_path injection.
--    All table references are fully qualified (public.table_name) where needed.
-- 2. email_templates "Service role full access" policy dropped — service role
--    bypasses RLS automatically, the policy was granting unnecessary blanket access.
-- 3. feature_flag_usage INSERT scoped to the user's own org_id.
-- 4. status_page_subscribers + public_alert_subscribers INSERT/UPDATE policies
--    are intentionally permissive (public subscription feature, no auth required).
--    Those warnings are acknowledged false positives and left unchanged.
--
-- NOTE: Enable Leaked Password Protection manually in:
--   Supabase Dashboard → Authentication → Password Protection → Enable HaveIBeenPwned

-- =============================================================================
-- 1. Fix function search paths
-- =============================================================================

-- Generic updated_at trigger (used across many tables)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Public monitors updated_at trigger
CREATE OR REPLACE FUNCTION public.update_public_monitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Email templates updated_at trigger
CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Competitor monitors updated_at trigger
CREATE OR REPLACE FUNCTION public.set_competitor_monitors_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ SET search_path = '';

-- Razorpay annual upgrade log updated_at trigger
CREATE OR REPLACE FUNCTION public.set_rzp_annual_upgrade_log_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ SET search_path = '';

-- Core auth helper: returns current user's org_id
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Core auth helper: is the current user a super admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_super_admin = true
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Core auth helper: current user's role string
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Admin check: is current user in admin_roles table or super admin?
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE LOWER(email) = LOWER((SELECT email FROM public.users WHERE id = auth.uid()))
    AND is_active = true
  )
  OR public.is_super_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Auth trigger: creates org + workspace + user record on first sign-in
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Auth trigger: creates email_preferences row on new user
CREATE OR REPLACE FUNCTION public.create_email_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =============================================================================
-- 2. email_templates — drop the blanket "USING (true)" policy
--    Service role bypasses RLS automatically; this policy adds no value and
--    the linter flags it as granting unrestricted access to all roles.
-- =============================================================================

DROP POLICY IF EXISTS "Service role full access on email_templates" ON public.email_templates;

-- =============================================================================
-- 3. feature_flag_usage — scope INSERT to the user's own org
--    Previously: any authenticated user could insert any row.
--    Now: users can only record flag usage against their own org_id.
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated can insert flag usage" ON public.feature_flag_usage;

CREATE POLICY "Authenticated can insert own org flag usage"
  ON public.feature_flag_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.user_org_id());
