-- Rebrand: replace "Uptrue" with "Upnotify" inside existing landing page_sections
-- CMS content seeded by 00068_landing_cms.sql. The app-level fallback copy in
-- app/(public)/page.tsx was already updated, but seeded DB rows take priority
-- over those fallbacks and were left saying "Uptrue".
UPDATE public.page_sections
SET content = REPLACE(content::text, 'Uptrue', 'Upnotify')::jsonb
WHERE page = 'landing'
  AND content::text LIKE '%Uptrue%';
