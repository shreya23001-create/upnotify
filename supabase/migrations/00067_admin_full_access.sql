-- Migration 67: Upgrade existing 'admin' role records to full write access
-- Matches the new ROLE_DEFAULTS.admin in lib/db/admin-roles.ts.
-- Super admin can still override individual permissions via the Admin Team UI.
-- =================================================================

UPDATE public.admin_roles
SET permissions = '{
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
}'::jsonb
WHERE role = 'admin';
