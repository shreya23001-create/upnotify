-- Migration 103: Lock blog_posts.content to JSONB objects only
-- =================================================================
-- Companion to migration 00100. Migration 00100 backfilled JSONB-string
-- content rows into { "body": <string> } shape. This migration:
--
--   1. Re-runs the same backfill (idempotent) — covers any drift if the
--      generator regressed between 00100 and now, or if 00100 was applied
--      after some new corruption landed.
--   2. Normalises any non-object primitive (number, bool, array) that
--      somehow slipped past — sets to '{}' so the CHECK below can be
--      applied without failing on legacy rows.
--   3. Unpublishes any post whose body and html are both empty after
--      normalisation. Empty content with status='published' = guaranteed
--      404 in the renderer, in the sitemap, and in the public blog index.
--   4. Adds a CHECK constraint so future writes that try to put a
--      primitive into the JSONB column are rejected at the DB layer.
--
-- Root cause this defends against: calendar-blog-generator.ts on 2026-05-02
-- saved `content: draft.bodyMarkdown` (a raw string) directly into a JSONB
-- column. Postgres accepted it as a JSONB string primitive; the renderer
-- returned 404 because content->>'body' was NULL. The TypeScript guard in
-- lib/db/blog-posts.ts (normaliseContent) now wraps any primitive on the
-- way in, but a DB-level CHECK is the belt to that suspenders — it cannot
-- be bypassed by future writers, raw SQL, or admin scripts.
-- =================================================================

-- 1. Wrap remaining JSONB-string content into { body: <string> }
UPDATE public.blog_posts
SET content = jsonb_build_object('body', content #>> '{}')
WHERE jsonb_typeof(content) = 'string';

-- 2. Coerce any other non-object JSONB primitive to empty object
UPDATE public.blog_posts
SET content = '{}'::jsonb
WHERE jsonb_typeof(content) <> 'object';

-- 3. Unpublish posts whose body and html are both empty — they 404
UPDATE public.blog_posts
SET status = 'draft', published_at = NULL
WHERE status = 'published'
  AND COALESCE(content->>'body', '') = ''
  AND COALESCE(content->>'html', '') = '';

-- 4. CHECK constraint: content must be a JSONB object going forward
ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_content_is_object;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_content_is_object
  CHECK (jsonb_typeof(content) = 'object');

COMMENT ON CONSTRAINT blog_posts_content_is_object ON public.blog_posts IS
  'Belt-and-braces guard against the 2026-05-02 calendar-blog-generator regression that saved raw markdown as a JSONB string primitive. Combined with normaliseContent() in lib/db/blog-posts.ts, makes it impossible for content to be anything other than a JSONB object. See migration 00100 for the original backfill.';
