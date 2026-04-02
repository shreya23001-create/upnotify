-- Migration 16: Admin roles and permissions
-- =================================================================
-- Supports multiple admins with role-based access to the admin panel.
-- Roles: super_admin, admin, viewer.
-- Only super_admin can manage other admins.
-- =================================================================

-- Admin roles table
CREATE TABLE public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  display_name TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_roles_email ON public.admin_roles(email);

CREATE TRIGGER admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: only super_admin can manage admin roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manages admin roles"
  ON public.admin_roles FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Also allow any admin to read their own row (for permission checks)
CREATE POLICY "Admins can read own role"
  ON public.admin_roles FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Helper function: check if user is any kind of admin (super, admin, or viewer)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE LOWER(email) = LOWER((SELECT email FROM public.users WHERE id = auth.uid()))
    AND is_active = true
  )
  OR public.is_super_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Seed the super admin record
INSERT INTO public.admin_roles (email, role, display_name, permissions, is_active)
VALUES (
  'sachindiwaker@gmail.com',
  'super_admin',
  'Sachin Diwaker',
  '{
    "users": { "read": true, "write": true },
    "organisations": { "read": true, "write": true },
    "plans": { "read": true, "write": true },
    "tracker": { "read": true, "write": true },
    "feature_flags": { "read": true, "write": true },
    "impersonate": true
  }'::jsonb,
  true
)
ON CONFLICT (email) DO NOTHING;
