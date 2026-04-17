-- Migration 00069: blog_subscribers
-- Stores email addresses of people who subscribe to blog/PMB updates.
-- source: which category or 'general' for the generic subscribe form.

CREATE TABLE IF NOT EXISTS blog_subscribers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT 'general', -- category slug or 'general'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, source)
);

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_source ON blog_subscribers (source);

ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;
-- Admin service role only — no user-facing policies needed
