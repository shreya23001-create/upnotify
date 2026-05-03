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

INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES (
  'landing',
  'ai_visibility_teaser',
  'ai_visibility_teaser',
  '{}'::jsonb,
  65,
  true
)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      sort_order   = EXCLUDED.sort_order;
