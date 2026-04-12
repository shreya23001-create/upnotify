-- Migration 00065: Add payload column to autoblog_runs for queue-based generation
-- This splits generation into: detect -> queue -> generate (separate cron)

ALTER TABLE autoblog_runs ADD COLUMN IF NOT EXISTS payload jsonb;

-- Index to efficiently find the next queued run
CREATE INDEX IF NOT EXISTS idx_autoblog_runs_status_ran_at
  ON autoblog_runs (status, ran_at ASC)
  WHERE status IN ('queued', 'generating');
