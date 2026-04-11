-- Migration 63: Public incidents — blog delay + auto-close support
-- Adds blog_generated_at to prevent duplicate blog generation
-- Adds blog_eligible_after so blog only generates after 15-min confirmation window

ALTER TABLE public_incidents
  ADD COLUMN IF NOT EXISTS blog_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blog_eligible_after TIMESTAMPTZ;

-- Set blog_eligible_after = started_at + 15 minutes for any existing open incidents
UPDATE public_incidents
SET blog_eligible_after = started_at + INTERVAL '15 minutes'
WHERE blog_eligible_after IS NULL;

CREATE INDEX IF NOT EXISTS idx_public_incidents_blog_eligible
  ON public_incidents (blog_eligible_after)
  WHERE resolved_at IS NULL AND blog_generated_at IS NULL;
