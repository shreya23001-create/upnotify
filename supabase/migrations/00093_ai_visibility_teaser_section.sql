-- =============================================================================
-- Migration 00093: AI Visibility teaser section on landing page
--
-- Adds a CMS-managed cross-product teaser strip on the homepage promoting
-- Uptrue AI Visibility (the standalone product on aivisibility.uptrue.io).
--
-- Slots between ai_features (sort_order 60) and agency (sort_order 70) at
-- sort_order 65. Hardcoded fallback exists in app/page.tsx so the section
-- renders even before this migration is applied (zero-downtime safe).
--
-- The page.tsx renderSection switch ignores the content payload — the
-- teaser strip is a fixed JSX block (brand-controlled). is_visible drives
-- whether it shows; admin can hide via UPDATE without code change.
-- =============================================================================

-- is_visible STARTS FALSE — the teaser CTA links to https://aivisibility.uptrue.io
-- which is not live yet (AIV-2 in master_pending_tasks: Boss-side infra
-- setup pending). Flip to true via SQL once the subdomain resolves:
--
--   UPDATE page_sections SET is_visible = true
--   WHERE page = 'landing' AND section_key = 'ai_visibility_teaser';
--
-- Discovered during Louis review of D4 Stage 0 — shipping a CTA that 404s
-- would damage user trust more than the missing cross-promotion costs.
INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES (
  'landing',
  'ai_visibility_teaser',
  'ai_visibility_teaser',
  '{}'::jsonb,
  65,
  false
)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      sort_order   = EXCLUDED.sort_order;
      -- Note: NOT updating is_visible on conflict so admin overrides stick.
