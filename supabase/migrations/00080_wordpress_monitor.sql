-- Uptrue WordPress Monitor — full schema
-- Tables: wp_monitors, wp_snapshots, wp_findings
-- Plan limits: wp_monitor_limit on plans, wp_monitor_limit_override on organisations

-- ============================================================
-- 1. Add 'wordpress' to monitor type CHECK constraint
-- ============================================================

ALTER TABLE monitors DROP CONSTRAINT IF EXISTS monitors_type_check;

ALTER TABLE monitors ADD CONSTRAINT monitors_type_check CHECK (type IN (
  'http', 'ssl', 'domain', 'dns', 'keyword', 'port', 'api', 'ping', 'heartbeat',
  'competitor', 'server',
  'security-headers', 'response-time', 'robots-txt', 'ip-change', 'mx-health',
  'whois-change', 'sitemap', 'redirect-chain', 'spf-dmarc', 'blacklist',
  'page-size', 'cookie-consent', 'nameserver-change',
  'wordpress'
));

-- ============================================================
-- 2. wp_monitors — one row per connected WP site
-- ============================================================

CREATE TABLE IF NOT EXISTS wp_monitors (
  id                     uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  monitor_id             uuid        NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  org_id                 uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  site_url               text        NOT NULL,
  api_token              text        NOT NULL UNIQUE,
  token_verified         boolean     NOT NULL DEFAULT false,
  last_push_at           timestamptz,
  check_interval_minutes integer     NOT NULL DEFAULT 120,
  settings               jsonb       NOT NULL DEFAULT '{}',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wp_monitors_org_id_idx      ON wp_monitors(org_id);
CREATE INDEX IF NOT EXISTS wp_monitors_monitor_id_idx  ON wp_monitors(monitor_id);
CREATE INDEX IF NOT EXISTS wp_monitors_api_token_idx   ON wp_monitors(api_token);

-- ============================================================
-- 3. wp_snapshots — one row per plugin push
-- ============================================================

CREATE TABLE IF NOT EXISTS wp_snapshots (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  wp_monitor_id        uuid        NOT NULL REFERENCES wp_monitors(id) ON DELETE CASCADE,
  org_id               uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  received_at          timestamptz NOT NULL DEFAULT now(),
  wp_version           text,
  php_version          text,
  active_plugins       jsonb       NOT NULL DEFAULT '[]',
  inactive_plugins     jsonb       NOT NULL DEFAULT '[]',
  active_theme         jsonb       NOT NULL DEFAULT '{}',
  admin_users          jsonb       NOT NULL DEFAULT '[]',
  recent_pages         jsonb       NOT NULL DEFAULT '[]',
  file_scan            jsonb       NOT NULL DEFAULT '{}',
  debug_mode           boolean,
  memory_limit         text,
  db_size_mb           numeric(10,2),
  cron_last_run        timestamptz,
  health_score         integer,
  raw_data             jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wp_snapshots_wp_monitor_id_idx ON wp_snapshots(wp_monitor_id);
CREATE INDEX IF NOT EXISTS wp_snapshots_received_at_idx   ON wp_snapshots(received_at DESC);
CREATE INDEX IF NOT EXISTS wp_snapshots_org_id_idx        ON wp_snapshots(org_id);

-- ============================================================
-- 4. wp_findings — individual issues detected by diff
-- ============================================================

CREATE TABLE IF NOT EXISTS wp_findings (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  wp_monitor_id    uuid        NOT NULL REFERENCES wp_monitors(id) ON DELETE CASCADE,
  org_id           uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  snapshot_id      uuid        REFERENCES wp_snapshots(id) ON DELETE SET NULL,
  finding_type     text        NOT NULL,
  severity         text        NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  title            text        NOT NULL,
  detail           jsonb       NOT NULL DEFAULT '{}',
  status           text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  first_detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz,
  ai_explanation   text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wp_findings_wp_monitor_id_idx ON wp_findings(wp_monitor_id);
CREATE INDEX IF NOT EXISTS wp_findings_status_idx        ON wp_findings(status);
CREATE INDEX IF NOT EXISTS wp_findings_severity_idx      ON wp_findings(severity);
CREATE INDEX IF NOT EXISTS wp_findings_org_id_idx        ON wp_findings(org_id);

-- ============================================================
-- 5. Plan limits
-- ============================================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS wp_monitor_limit integer NOT NULL DEFAULT 0;

UPDATE plans SET wp_monitor_limit = 0  WHERE slug = 'free';
UPDATE plans SET wp_monitor_limit = 1  WHERE slug = 'lite';
UPDATE plans SET wp_monitor_limit = 5  WHERE slug = 'builder';
UPDATE plans SET wp_monitor_limit = 10 WHERE slug = 'scale';

-- ============================================================
-- 6. Organisation-level admin override
-- ============================================================

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS wp_monitor_limit_override integer NULL;

COMMENT ON COLUMN organisations.wp_monitor_limit_override IS
  'Super admin override for WP monitor limit. Overrides plan limit when set. NULL = use plan limit.';

-- ============================================================
-- 7. Row Level Security
-- ============================================================

ALTER TABLE wp_monitors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_findings  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own org wp_monitors"  ON wp_monitors;
DROP POLICY IF EXISTS "Users see own org wp_snapshots" ON wp_snapshots;
DROP POLICY IF EXISTS "Users see own org wp_findings"  ON wp_findings;

CREATE POLICY "Users see own org wp_monitors"
  ON wp_monitors FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own org wp_snapshots"
  ON wp_snapshots FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own org wp_findings"
  ON wp_findings FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
