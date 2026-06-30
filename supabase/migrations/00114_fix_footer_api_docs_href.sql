-- Migration 00114: Fix footer "API Docs" link 404 (#166)
--
-- The CMS-seeded global footer (migration 00090) linked "API Docs" to "/docs",
-- but the page lives at "/api-docs" — there is no "/docs" route, so the footer
-- link 404'd on every public page. The code default in
-- components/ui/public-footer.tsx already uses "/api-docs", but
-- getLandingSection('footer') reads this DB row and overrides the default, so
-- the stale value kept shipping to production.
--
-- Replace the standalone JSON string value "/docs" with "/api-docs" in the
-- footer content. "/docs" only appears as the API Docs href, so a targeted
-- string replace is safe and order-independent. Idempotent — re-running is a
-- no-op once corrected (and a no-op on fresh DBs where 00090 has not seeded).

UPDATE public.page_sections
SET content = REPLACE(content::text, '"/docs"', '"/api-docs"')::jsonb
WHERE page = 'global'
  AND section_key = 'footer'
  AND content::text LIKE '%"/docs"%';
