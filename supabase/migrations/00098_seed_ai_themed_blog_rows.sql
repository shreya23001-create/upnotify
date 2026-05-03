-- =============================================================================
-- Migration 00098 — Seed 7 AI-themed blog rows into content_calendar
-- =============================================================================
-- Adds 7 calendar rows targeting the monitoring × AI intersection — the
-- shortlist locked after May 3 keyword research from
-- keyword-research/AI-SEO_broad-match_us_2026-05-01.csv.
--
-- These are NOT for the AI Visibility subdomain (aivisibility.uptrue.io)
-- — they sit on the main /blog/* surface and target searches like
-- "AI crawlers slowing site" / "monitor AI search visibility" — areas
-- where Uptrue's monitoring USP gives a unique angle.
--
-- Author distribution preserves the byline_policy.md ratio:
--   Aradhna 2 (troubleshooting)
--   Steve   2 (deep guides)
--   Krithi  3 (informational explainers)
--   Sachin  0 (he's already at ~10% cap on the existing 133 rows)
--
-- Publish dates spread May 6–12 so the cron picks them up over the
-- week without overwhelming the daily Boss Digest. Idempotent —
-- ON CONFLICT (url_path) DO NOTHING.
-- =============================================================================

INSERT INTO content_calendar (
  publish_date, post_type, hub, primary_keyword, secondary_keywords,
  search_volume, kd, url_path, title_draft, author, brand_prefix_required
) VALUES
  -- Steve / hub guide / 70 vol / KD 17 — highest signal of the batch
  ('2026-05-06', 'hub_foundational', 'response-time',
    'the technical seo debt that will destroy your ai visibility',
    ARRAY['ai crawler access', 'ai seo monitoring', 'robots txt ai crawlers']::text[],
    70, 17,
    '/blog/technical-seo-debt-ai-visibility',
    'The Technical SEO Debt That Will Destroy Your AI Visibility',
    'Steve', false),

  -- Aradhna / troubleshooting / 40 vol / KD 15
  ('2026-05-07', 'troubleshooting', 'response-time',
    'monitor ai generated website traffic',
    ARRAY['ai crawler traffic', 'ai bot traffic monitoring', 'detect ai bots']::text[],
    40, 15,
    '/blog/ai-crawlers-slowing-website',
    'Are AI Crawlers Slowing Down Your Website?',
    'Aradhna', false),

  -- Krithi / informational / 10 vol / KD 12
  ('2026-05-08', 'informational', 'http-uptime',
    'tools to monitor website visibility in ai search engines',
    ARRAY['monitor ai search results', 'ai search visibility', 'track ai citations']::text[],
    10, 12,
    '/blog/monitor-ai-search-visibility',
    'How to Monitor Website Visibility in AI Search Engines',
    'Krithi', false),

  -- Steve / commercial-but-deep / 20 vol / KD 18
  ('2026-05-09', 'hub_foundational', 'response-time',
    'best ai search performance monitoring tools for b2b websites',
    ARRAY['ai search ranking', 'b2b ai monitoring', 'ai search analytics']::text[],
    20, 18,
    '/blog/ai-search-performance-monitoring',
    'Monitor AI Search Performance: Your New Ranking Metric',
    'Steve', false),

  -- Aradhna / troubleshooting / 10 vol / KD 20
  ('2026-05-10', 'troubleshooting', 'http-uptime',
    'ai website uptime and speed monitoring for marketing campaigns',
    ARRAY['chatgpt depends on uptime', 'ai dependency monitoring', 'monitor ai integrations']::text[],
    10, 20,
    '/blog/chatgpt-depends-on-your-uptime',
    'ChatGPT Depends On Your Uptime: Why AI Tool Dependencies Change Monitoring',
    'Aradhna', false),

  -- Krithi / informational / 10 vol / KD 14
  ('2026-05-11', 'informational', 'keyword',
    'tools for continuous ai search performance monitoring large websites',
    ARRAY['ai content freshness', 'ai crawler reindex', 'monitor ai content updates']::text[],
    10, 14,
    '/blog/monitor-content-freshness-for-ai',
    'Monitor Content Freshness for AI: How to Track What Crawlers Actually See',
    'Krithi', false),

  -- Krithi / informational / 10 vol / KD 16
  ('2026-05-12', 'informational', 'http-uptime',
    'importance of monitoring ai agents on websites',
    ARRAY['monitor ai agents', 'ai agent traffic', 'autonomous ai web access']::text[],
    10, 16,
    '/blog/monitoring-ai-agents-on-websites',
    'How AI Agents Impact Your Website Monitoring: From Bots to Automation Workflows',
    'Krithi', false)

ON CONFLICT (url_path) DO NOTHING;
