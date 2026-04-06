-- Migration 00046: competitor_monitors table
-- Tracks uptime/availability of competitor domains for each org
-- Referenced in /lib/db/competitor-monitors.ts but was never created

CREATE TABLE IF NOT EXISTS competitor_monitors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  domain                TEXT NOT NULL,
  display_name          TEXT NOT NULL DEFAULT '',
  last_status           TEXT NOT NULL DEFAULT 'unknown'
                          CHECK (last_status IN ('up', 'down', 'degraded', 'unknown')),
  last_response_time_ms INTEGER,
  last_checked_at       TIMESTAMPTZ,
  uptime_30d            NUMERIC(5,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, domain)
);

-- Index for cron sweep (checks oldest-checked first)
CREATE INDEX IF NOT EXISTS idx_competitor_monitors_checked_at
  ON competitor_monitors (last_checked_at ASC NULLS FIRST);

-- RLS: users can only see their org's competitors
ALTER TABLE competitor_monitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_monitors_org_select"
  ON competitor_monitors FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "competitor_monitors_org_insert"
  ON competitor_monitors FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "competitor_monitors_org_delete"
  ON competitor_monitors FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- updated_at trigger
CREATE TRIGGER competitor_monitors_updated_at
  BEFORE UPDATE ON competitor_monitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
