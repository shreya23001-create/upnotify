-- Per-org monitor limit override for super admin use
-- When set, this overrides the plan's monitor_limit for that org only.
-- NULL = use plan limit as normal.
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS monitor_limit_override integer NULL;

COMMENT ON COLUMN organisations.monitor_limit_override IS
  'Super admin override for monitor limit. Overrides plan limit when set. NULL = use plan limit.';
