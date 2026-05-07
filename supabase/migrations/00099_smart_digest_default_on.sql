-- Migration: flip Smart Digest on as the default for all orgs
-- Only flips orgs that never manually changed their setting (updated_at = created_at).
-- Orgs that explicitly opted out (already changed the setting) are left untouched.
UPDATE org_alert_settings
SET mode = 'smart'
WHERE mode = 'off'
  AND updated_at = created_at;

-- Change the column default so all future new orgs also start on Smart Digest.
ALTER TABLE org_alert_settings
  ALTER COLUMN mode SET DEFAULT 'smart';
