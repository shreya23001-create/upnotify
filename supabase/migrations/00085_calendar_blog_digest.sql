-- =============================================================================
-- Migration 00085 — Content Calendar + Boss Digest pipeline
-- =============================================================================
-- Adds the schema needed for the May 2026 content push:
--   1. New columns on blog_posts to support post types, primary keyword,
--      FAQ blocks, target hub, and digest workflow
--   2. New table content_calendar — seeded from keyword-research/Content_Calendar.csv
--   3. New table boss_digest_runs — audit log for daily digest sends
--
-- The new flow does NOT replace the existing immediate-email pipeline
-- (outage / LLM news / custom topic). Those continue to use
-- delivery_method='immediate'. Calendar-driven posts use 'digest'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend blog_posts
-- ---------------------------------------------------------------------------

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS post_type text
    CHECK (post_type IS NULL OR post_type IN (
      'outage', 'llm_news', 'custom_topic',
      'hub_foundational', 'troubleshooting', 'informational',
      'commercial', 'combined_intent'
    )),
  ADD COLUMN IF NOT EXISTS primary_keyword text,
  ADD COLUMN IF NOT EXISTS secondary_keywords text[],
  ADD COLUMN IF NOT EXISTS faq_jsonb jsonb,
  ADD COLUMN IF NOT EXISTS target_hub text,
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'immediate'
    CHECK (delivery_method IN ('immediate', 'digest')),
  ADD COLUMN IF NOT EXISTS digest_status text NOT NULL DEFAULT 'pending'
    CHECK (digest_status IN ('pending', 'in_digest', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS digested_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_jsonb jsonb;

CREATE INDEX IF NOT EXISTS idx_blog_posts_digest_pending
  ON blog_posts (created_at)
  WHERE delivery_method = 'digest' AND digest_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_blog_posts_post_type
  ON blog_posts (post_type) WHERE post_type IS NOT NULL;

COMMENT ON COLUMN blog_posts.post_type IS
  'Post category. Calendar-driven types: hub_foundational, troubleshooting, informational, commercial, combined_intent. Legacy types: outage, llm_news, custom_topic.';

COMMENT ON COLUMN blog_posts.delivery_method IS
  'How approval is requested. immediate = per-post email (legacy). digest = batched into daily Boss Digest at 07:00.';

COMMENT ON COLUMN blog_posts.review_jsonb IS
  'Output of the second-Claude review pass: { highlights[], worries[], scores{}, ctaCheck, slugCheck, hardFails[] }';

-- ---------------------------------------------------------------------------
-- 2. content_calendar — the 168-page plan
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Plan
  publish_date date NOT NULL,
  post_type text NOT NULL CHECK (post_type IN (
    'hub_foundational', 'troubleshooting', 'informational',
    'commercial', 'combined_intent'
  )),
  hub text,
  primary_keyword text NOT NULL,
  secondary_keywords text[] DEFAULT '{}',
  search_volume int,
  kd int,
  url_path text NOT NULL,
  title_draft text NOT NULL,
  author text NOT NULL CHECK (author IN ('Aradhna', 'Sachin', 'Steve', 'Krithi')),
  brand_prefix_required boolean NOT NULL DEFAULT false,

  -- Lifecycle
  status text NOT NULL DEFAULT 'planned' CHECK (status IN (
    'planned', 'generating', 'drafted', 'approved', 'published', 'failed', 'skipped'
  )),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  generated_at timestamptz,
  failed_at timestamptz,
  failure_reason text,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_calendar_due
  ON content_calendar (publish_date, status)
  WHERE status = 'planned';

CREATE INDEX idx_content_calendar_status
  ON content_calendar (status);

CREATE INDEX idx_content_calendar_post_type
  ON content_calendar (post_type);

CREATE UNIQUE INDEX idx_content_calendar_url_path
  ON content_calendar (url_path);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_content_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_content_calendar_updated_at();

-- RLS — content_calendar is admin-only (not user-scoped)
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_calendar_admin_all ON content_calendar
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = ANY (
    string_to_array(current_setting('app.admin_emails', true), ',')
  ))
  WITH CHECK (auth.jwt() ->> 'email' = ANY (
    string_to_array(current_setting('app.admin_emails', true), ',')
  ));

COMMENT ON TABLE content_calendar IS
  'The 168-page content plan from keyword-research/Content_Calendar.csv. Drives the calendar/draft-runner cron. Read by /admin to manage publish schedule.';

-- ---------------------------------------------------------------------------
-- 3. boss_digest_runs — audit log for daily digest sends
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS boss_digest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  draft_count int NOT NULL,
  blog_post_ids uuid[] NOT NULL,
  email_sent_to text[] NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'partial', 'failed')),
  error_message text,
  resend_message_id text
);

CREATE INDEX idx_boss_digest_runs_ran_at
  ON boss_digest_runs (ran_at DESC);

COMMENT ON TABLE boss_digest_runs IS
  'Audit log for daily Boss Digest sends. One row per cron run at 07:00.';
