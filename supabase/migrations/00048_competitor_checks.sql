-- Migration 00048: Competitor check history, incidents, and AI summary
-- Phase 1 of competitor monitoring — April 2026
-- Harvey review: GREEN. ToS + Privacy Policy updates tracked for go-live.

-- ── competitor_check_results ─────────────────────────────────────────────────
-- Stores per-check history for charts and uptime calculation.
-- Content is never stored — only status, timing, and keyword presence.

CREATE TABLE IF NOT EXISTS competitor_check_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id     UUID NOT NULL REFERENCES competitor_monitors(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  status            TEXT NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
  response_time_ms  INTEGER,
  status_code       INTEGER,
  keyword_matched   TEXT,         -- exact keyword phrase detected (e.g. 'under maintenance')
  keyword_category  TEXT,         -- 'maintenance' | 'error' | null
  error_message     TEXT,
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_results_competitor_at
  ON competitor_check_results (competitor_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_results_org_at
  ON competitor_check_results (org_id, checked_at DESC);

ALTER TABLE competitor_check_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_results_org_select"
  ON competitor_check_results FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ── competitor_incidents ──────────────────────────────────────────────────────
-- Tracks open/resolved downtime events per competitor.
-- Prevents duplicate in-app alerts and enables downtime duration calculations.

CREATE TABLE IF NOT EXISTS competitor_incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitor_monitors(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  cause         TEXT,           -- 'down' | 'maintenance' | 'error_page'
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_competitor_incidents_open
  ON competitor_incidents (competitor_id, status);

ALTER TABLE competitor_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_incidents_org_select"
  ON competitor_incidents FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ── AI summary + keyword toggle on competitor_monitors ────────────────────────
-- ai_summary: Claude-generated paragraph, refreshable max once per 24h.
-- keywords_enabled: users can toggle keyword detection per competitor.

ALTER TABLE competitor_monitors
  ADD COLUMN IF NOT EXISTS ai_summary       TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS keywords_enabled BOOLEAN NOT NULL DEFAULT true;
