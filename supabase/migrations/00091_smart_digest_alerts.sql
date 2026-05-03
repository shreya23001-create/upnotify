-- =============================================================================
-- Migration 00091: Smart Digest Alerts
--
-- Replaces the per-event email-storm pattern with a buffered digest model.
--
--   First event in a window → INSTANT email (so the customer knows something
--   is happening within seconds). Subsequent events in the same window →
--   collected. When the window closes → ONE digest email summarising all of
--   them. Critical-severity events always bypass the buffer (instant every
--   time). Other channels (Slack / Telegram / Webhook / Teams) keep per-event
--   behaviour — they have their own threading/batching and the email-storm
--   problem doesn't apply.
--
-- Two new tables:
--   1. org_alert_settings  — per-org config (mode, window, severity floor)
--   2. pending_alert_events — buffer of email events awaiting digest flush
--
-- Default for EXISTING orgs: mode='off' (preserves today's per-event
-- behaviour — zero migration risk). New signups default to mode='smart'.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. org_alert_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_alert_settings (
  org_id uuid PRIMARY KEY REFERENCES organisations(id) ON DELETE CASCADE,

  -- 'off'   = today's behaviour, every event sends an email immediately
  -- 'smart' = first-instant-then-digest model
  mode text NOT NULL DEFAULT 'off' CHECK (mode IN ('off', 'smart')),

  -- How long to collect events before sending the digest. 5/10/30/60 minutes.
  digest_window_minutes int NOT NULL DEFAULT 30 CHECK (digest_window_minutes IN (5, 10, 30, 60)),

  -- Severities at or above this floor bypass the buffer and always send
  -- instant emails. 'critical' (default) → only critical bypasses; 'warning'
  -- → critical + warning bypass; 'all' → effectively turns Smart Digest off.
  instant_severity_floor text NOT NULL DEFAULT 'critical' CHECK (instant_severity_floor IN ('critical', 'warning', 'all')),

  -- Group events by target host inside the digest (always-on for V1; column
  -- exists so admin can disable per-org for support without code change).
  same_host_grouping boolean NOT NULL DEFAULT true,

  -- A monitor with ≥ this many cycles in the window renders as
  -- "{name} flapped Nx" instead of N separate lines. 0 = disable.
  flap_badge_threshold int NOT NULL DEFAULT 3 CHECK (flap_badge_threshold >= 0),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE org_alert_settings ENABLE ROW LEVEL SECURITY;

-- Admins read/write their own org. Service role bypasses RLS.
CREATE POLICY org_alert_settings_select ON org_alert_settings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY org_alert_settings_update ON org_alert_settings
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY org_alert_settings_insert ON org_alert_settings
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION trg_org_alert_settings_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER org_alert_settings_touch_updated_at
  BEFORE UPDATE ON org_alert_settings
  FOR EACH ROW EXECUTE FUNCTION trg_org_alert_settings_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2. pending_alert_events — the buffer
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pending_alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  monitor_id uuid NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,

  event_type text NOT NULL CHECK (event_type IN ('open', 'recovery')),
  severity text NOT NULL,

  -- Pre-rendered copy so the digest builder doesn't have to re-derive
  subject text NOT NULL,
  headline text NOT NULL,
  detail text,

  -- For same-host grouping in the digest
  monitor_name text NOT NULL,
  monitor_target text NOT NULL,
  monitor_type text NOT NULL,

  metadata jsonb DEFAULT '{}'::jsonb,

  -- Set when the event was sent as an instant email (the first-of-window
  -- trigger or a critical bypass). The event still appears in the digest
  -- afterwards so the digest tells the full story.
  instant_sent_at timestamptz,

  -- Set when the event was included in a digest. Once set, the flusher
  -- will not pick it up again. Events stay in the table for audit (1-week
  -- retention via a separate cleanup; out of scope for this migration).
  digested_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pending_alert_events ENABLE ROW LEVEL SECURITY;

-- Customers can read their own org's events (for the future "alert history"
-- view); only the service role writes / updates / deletes.
CREATE POLICY pending_alert_events_select ON pending_alert_events
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Hot index — the flusher's primary query (find unsent events per org).
CREATE INDEX idx_pending_alert_events_pending
  ON pending_alert_events (org_id, created_at)
  WHERE digested_at IS NULL;

-- Audit / monitoring index
CREATE INDEX idx_pending_alert_events_org_created
  ON pending_alert_events (org_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Defaults — preserve today's behaviour for ALL existing orgs
-- ----------------------------------------------------------------------------
-- Every existing org gets mode='off' so behaviour is identical to before
-- this migration. Boss / admins can flip individual orgs to 'smart' via the
-- new settings page (or via UPDATE statement).
INSERT INTO org_alert_settings (org_id, mode)
SELECT id, 'off'
FROM organisations
WHERE id NOT IN (SELECT org_id FROM org_alert_settings)
ON CONFLICT (org_id) DO NOTHING;

COMMENT ON TABLE org_alert_settings IS
  'Per-org email alert delivery preferences. mode=off keeps per-event behaviour; mode=smart enables Smart Digest (first-instant-then-digest).';

COMMENT ON TABLE pending_alert_events IS
  'Buffer of email events awaiting digest flush when the org is in mode=smart. Events stay after digested_at is set for audit; out-of-scope cleanup runs separately.';
