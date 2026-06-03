-- Migration 00108: cron_locks — overlap protection for long-running crons
-- =================================================================
-- engineering-app#77 — the check-runner can run for up to maxDuration=300s
-- with hundreds of monitors. When a run hits an upstream slow-down (DNS
-- timeouts, a 30s probe stuck), the next cron tick fires before the
-- previous run has finished and starts a parallel one. Two runs racing
-- on the same monitors caused: (1) duplicate alerts on flap recovery,
-- (2) Supabase connection-pool exhaustion under spike, (3) confused
-- next_check_at scheduling.
--
-- Pattern is a row-with-expiry lock: insert a row keyed by cron_name,
-- the unique constraint prevents a second insert, and a TTL keeps a
-- crashed run from holding the lock forever. The cron's finally block
-- deletes the row on clean exit.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.cron_locks (
  cron_name  TEXT        PRIMARY KEY,
  locked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cron_locks_expires_at
  ON public.cron_locks (expires_at);

-- This table is only written by service-role cron handlers, never by users.
-- RLS still on as a discipline (zero policies → zero authenticated access).
ALTER TABLE public.cron_locks ENABLE ROW LEVEL SECURITY;
