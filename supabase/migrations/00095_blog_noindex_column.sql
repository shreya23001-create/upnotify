-- Migration 95: Add noindex column to blog_posts
-- =================================================================
-- Adds a boolean `noindex` column so individual blog posts can be
-- excluded from search-engine indexing without deleting them.
--
-- Use case: Tier 3 auto-generated permutation comparison posts that
-- exist mainly for navigation but should not compete in search
-- (929 alternates flagged in Search Console as of Apr 2026).
--
-- Migration 00096 will then backfill `noindex=true` for matching posts.
-- Renderer (app/(public)/blog/[slug]/page.tsx) sets robots meta-tag
-- accordingly. Sitemap (app/sitemap.ts) filters noindex posts out.
-- =================================================================

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.blog_posts.noindex IS
  'When true, the rendered blog page emits robots:noindex,nofollow and the sitemap excludes the URL. Used to suppress thin / permutation content from search index without deleting the post.';

-- Partial index — only the small set of noindex'd posts is indexed,
-- which is the only set we ever need to exclude from queries.
CREATE INDEX IF NOT EXISTS idx_blog_posts_noindex
  ON public.blog_posts(noindex)
  WHERE noindex = true;
