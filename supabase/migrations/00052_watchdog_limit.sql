-- Migration 00052: Add competitor_limit (Watchdog slots) to plans table
-- Enforced in /lib/utils/plan-limits.ts via checkCompetitorLimit()

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS competitor_limit INTEGER NOT NULL DEFAULT 3;

-- Set per-plan Watchdog (competitor tracking) limits
UPDATE plans SET competitor_limit = 3  WHERE slug = 'free';
UPDATE plans SET competitor_limit = 5  WHERE slug = 'lite';
UPDATE plans SET competitor_limit = 10 WHERE slug = 'builder';
UPDATE plans SET competitor_limit = 25 WHERE slug = 'scale';
