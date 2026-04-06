-- =============================================================
-- Automated Blog Publishing
-- Auto-generate outage blog posts from public monitor incidents
-- Approval via email token (approve/reject)
-- =============================================================

-- Extend blog_posts with auto-generation metadata
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_public_incident_id UUID REFERENCES public_incidents(id) ON DELETE SET NULL;

-- Update status check constraint to include pending_approval
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft', 'published', 'archived', 'pending_approval'));

CREATE INDEX IF NOT EXISTS idx_blog_posts_auto_generated ON blog_posts(auto_generated) WHERE auto_generated = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_source_incident ON blog_posts(source_public_incident_id) WHERE source_public_incident_id IS NOT NULL;

-- Blog approval tokens — one approve token + one reject token per draft
CREATE TABLE IF NOT EXISTS blog_approval_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id  UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  token         TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  action        TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_approval_tokens_token ON blog_approval_tokens(token);
CREATE INDEX IF NOT EXISTS idx_blog_approval_tokens_post  ON blog_approval_tokens(blog_post_id);

-- RLS: service role (admin client) bypasses RLS for all writes
ALTER TABLE blog_approval_tokens ENABLE ROW LEVEL SECURITY;
-- No user-level policies — all operations via admin client only
