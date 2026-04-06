-- Health score cache columns on organisations
-- Computed by the /api/cron/health-scores endpoint (weekly batch job)
-- Avoids N+1 queries on the /admin/users page

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS health_score        integer         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_score_label  text            DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_score_at     timestamptz     DEFAULT NULL;

COMMENT ON COLUMN organisations.health_score       IS 'Cached 0-100 health score, refreshed by cron weekly';
COMMENT ON COLUMN organisations.health_score_label IS 'Healthy | Watch | At Risk | Critical';
COMMENT ON COLUMN organisations.health_score_at    IS 'When the score was last computed';
