-- Migration 66: Grant super admin access to Dev Saxena
-- Mirrors the setup done for the original founder in migrations 00013 and 00016.
-- =================================================================

-- Set is_super_admin flag on the users row (if already signed up)
UPDATE public.users
SET is_super_admin = true
WHERE email = 'devsaxena012@gmail.com';

-- Seed the super_admin record in admin_roles (full permissions, mirrors super_admin defaults)
INSERT INTO public.admin_roles (email, role, display_name, permissions, is_active)
VALUES (
  'devsaxena012@gmail.com',
  'super_admin',
  'Dev Saxena',
  '{
    "users":         { "read": true, "write": true },
    "organisations": { "read": true, "write": true },
    "plans":         { "read": true, "write": true },
    "tracker":       { "read": true, "write": true },
    "feature_flags": { "read": true, "write": true },
    "blog":          { "read": true, "write": true },
    "aoe":           { "read": true, "write": true },
    "audit_log":     { "read": true, "write": true },
    "support":       { "read": true, "write": true },
    "system":        { "read": true, "write": true },
    "user360":       { "read": true, "write": true },
    "impersonate":   true
  }'::jsonb,
  true
)
ON CONFLICT (email) DO UPDATE
  SET role        = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      is_active   = EXCLUDED.is_active;
