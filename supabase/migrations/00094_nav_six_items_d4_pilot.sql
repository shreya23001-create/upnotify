-- =============================================================================
-- Migration 00094: Update global nav to 6-item D4 layout
--
-- Replaces the 7-item nav seeded in 00090 with the new 6-item layout
-- agreed during D4 Stage 0 (homepage pilot, 03 May 2026):
--
--   Monitoring · WordPress (Plugin badge) · Tools (Free) · Tracker (Free) · Pricing · Blog
--
-- Dropped from previous: Features (anchor — covered by /monitoring),
--   Score (moved to /tools featured entry), AI SEO (still in /tools list).
-- Added: Monitoring (hub) and WordPress (the differentiator).
--
-- Footer is unchanged in this migration — its current seeded content (00090)
-- still matches the desired layout. If footer needs updates later, do it
-- here too.
--
-- Idempotent via ON CONFLICT DO UPDATE. Code DEFAULT_LINKS in
-- components/ui/public-nav.tsx is in lockstep — if DB row is missing/null,
-- the same 6-item layout renders from code (zero-downtime).
-- =============================================================================

INSERT INTO public.page_sections (page, section_key, section_type, content, sort_order, is_visible)
VALUES (
  'global',
  'nav',
  'nav',
  $json${
    "links": [
      { "label": "Monitoring", "href": "/monitoring" },
      { "label": "WordPress",  "href": "/wordpress-monitor", "badge": "Plugin" },
      { "label": "Tools",      "href": "/tools",             "badge": "Free" },
      { "label": "Tracker",    "href": "/tracker",           "badge": "Free" },
      { "label": "Pricing",    "href": "/#pricing" },
      { "label": "Blog",       "href": "/blog" }
    ],
    "cta_primary":   { "text": "Start Free", "href": "/signup" },
    "cta_secondary": { "text": "Log in",     "href": "/login" }
  }$json$,
  10,
  true
)
ON CONFLICT (page, section_key) DO UPDATE
  SET section_type = EXCLUDED.section_type,
      content      = EXCLUDED.content,
      sort_order   = EXCLUDED.sort_order,
      is_visible   = EXCLUDED.is_visible;
