-- Migration: Add legal review columns to blog_posts
-- Required by #19 (Harvey legal) — comparison/commercial posts must pass
-- through the /admin/legal-review queue before publication.

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS legal_review_by       TEXT,
  ADD COLUMN IF NOT EXISTS legal_reviewed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_review_outcome  TEXT
    CHECK (legal_review_outcome IN ('approved', 'rejected', 'needs_changes'));

-- Index so the legal-review admin page can quickly find un-reviewed commercial posts.
CREATE INDEX IF NOT EXISTS idx_blog_posts_legal_review
  ON blog_posts (post_type, legal_review_outcome)
  WHERE post_type = 'commercial';
