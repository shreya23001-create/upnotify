-- Migration 00050: cron_run_log — per-run history for all cron jobs
-- Enables system health page to show last N runs, errors, duration per cron.
-- Accessed only via admin service role client — RLS enabled with no user policies.

CREATE TABLE IF NOT EXISTS cron_run_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_path     TEXT NOT NULL,                    -- e.g. /api/cron/check-runner
  status        TEXT NOT NULL DEFAULT 'running'   -- running | ok | error
    CHECK (status IN ('running', 'ok', 'error')),
  triggered_by  TEXT NOT NULL DEFAULT 'schedule'  -- schedule | manual
    CHECK (triggered_by IN ('schedule', 'manual')),
  duration_ms   INTEGER,                          -- null while running
  error_message TEXT,                             -- populated on error
  result_summary TEXT,                            -- e.g. "checked: 42, down: 1"
  ran_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_run_log_path_at
  ON cron_run_log (cron_path, ran_at DESC);

CREATE INDEX IF NOT EXISTS idx_cron_run_log_ran_at
  ON cron_run_log (ran_at DESC);

ALTER TABLE cron_run_log ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — admin service role only
