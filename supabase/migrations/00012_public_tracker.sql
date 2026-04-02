-- =============================================================
-- Public Tracker — admin-managed pages tracking famous websites
-- Completely separate from customer monitoring tables
-- =============================================================

-- Public monitors (admin-managed list of famous sites)
CREATE TABLE public_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  check_interval_seconds INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  last_status TEXT DEFAULT 'unknown',
  last_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Check results for public monitors
CREATE TABLE public_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public_monitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_public_checks_monitor_time ON public_check_results(monitor_id, checked_at DESC);

-- Incidents for public monitors
CREATE TABLE public_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public_monitors(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  cause TEXT,
  status_code INTEGER
);
CREATE INDEX idx_public_incidents_monitor ON public_incidents(monitor_id, started_at DESC);

-- Alert subscribers for public monitors
CREATE TABLE public_alert_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public_monitors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(monitor_id, email)
);
CREATE INDEX idx_public_subscribers_monitor ON public_alert_subscribers(monitor_id);

-- RLS policies — public SELECT, admin-only write
ALTER TABLE public_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_alert_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
CREATE POLICY "public_monitors_select" ON public_monitors FOR SELECT USING (true);
CREATE POLICY "public_check_results_select" ON public_check_results FOR SELECT USING (true);
CREATE POLICY "public_incidents_select" ON public_incidents FOR SELECT USING (true);

-- Subscribers can read their own rows
CREATE POLICY "public_subscribers_select" ON public_alert_subscribers FOR SELECT USING (true);

-- Insert for subscribers (email subscribe form — public)
CREATE POLICY "public_subscribers_insert" ON public_alert_subscribers
  FOR INSERT WITH CHECK (true);

-- Service role bypasses RLS for all write operations (cron, admin)
-- No explicit INSERT/UPDATE/DELETE policies for monitors, check_results, incidents
-- because admin operations use service_role key which bypasses RLS

-- Auto-update updated_at on public_monitors
CREATE OR REPLACE FUNCTION update_public_monitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_public_monitors_updated_at
  BEFORE UPDATE ON public_monitors
  FOR EACH ROW EXECUTE FUNCTION update_public_monitors_updated_at();
