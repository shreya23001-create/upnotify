-- =============================================================
-- 00037: Subscription cancellation reasons + pause support
-- =============================================================

-- Cancellation reasons log
CREATE TABLE IF NOT EXISTS cancellation_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  reason          TEXT NOT NULL CHECK (reason IN ('too_expensive', 'not_using', 'switching_competitor', 'missing_features', 'too_complex', 'temporary', 'other')),
  reason_detail   TEXT,
  action_taken    TEXT NOT NULL CHECK (action_taken IN ('canceled', 'paused', 'retained')),
  plan_slug       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cancellation_log_org ON cancellation_log(org_id);
CREATE INDEX idx_cancellation_log_created ON cancellation_log(created_at DESC);

-- Add pause fields to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pause_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pause_reason TEXT;

-- Add 'paused' to status constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'paused'));
