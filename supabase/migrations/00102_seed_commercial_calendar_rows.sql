-- Migration: Seed 16 commercial/comparison pages into content_calendar
-- These are gated: post_type='commercial' rows skip the boss-digest email
-- flow and route to /admin/legal-review before publication.
-- Author: Sachin (byline for all 16 pages per Content Strategy v1).
-- Idempotent: ON CONFLICT (url_path) DO NOTHING.

INSERT INTO content_calendar (
  publish_date,
  post_type,
  hub,
  primary_keyword,
  secondary_keywords,
  search_volume,
  kd,
  url_path,
  title_draft,
  author,
  brand_prefix_required,
  status
) VALUES

-- Head-to-head comparisons (5)
(
  '2026-05-29', 'commercial', 'comparisons',
  'uptrue vs uptimerobot',
  ARRAY['uptimerobot alternative', 'uptimerobot comparison', 'best uptime monitor', 'uptime monitoring tools'],
  2400, 42,
  '/blog/uptrue-vs-uptimerobot',
  'Uptrue vs UptimeRobot: Which Uptime Monitor Is Right for You?',
  'Sachin', true, 'planned'
),
(
  '2026-05-30', 'commercial', 'comparisons',
  'uptrue vs pingdom',
  ARRAY['pingdom alternative', 'pingdom comparison', 'website monitoring comparison', 'synthetic monitoring tools'],
  1800, 48,
  '/blog/uptrue-vs-pingdom',
  'Uptrue vs Pingdom: Full Comparison for 2026',
  'Sachin', true, 'planned'
),
(
  '2026-05-30', 'commercial', 'comparisons',
  'uptrue vs betterstack',
  ARRAY['better uptime alternative', 'betterstack comparison', 'betterstack better uptime', 'status page monitoring'],
  1200, 38,
  '/blog/uptrue-vs-betterstack-better-uptime',
  'Uptrue vs BetterStack (Better Uptime): 2026 Comparison',
  'Sachin', true, 'planned'
),
(
  '2026-05-30', 'commercial', 'comparisons',
  'uptrue vs statuscake',
  ARRAY['statuscake alternative', 'statuscake comparison', 'uptime monitoring uk', 'website monitoring free'],
  900, 35,
  '/blog/uptrue-vs-statuscake',
  'Uptrue vs Statuscake: Which Should You Choose in 2026?',
  'Sachin', true, 'planned'
),
(
  '2026-05-31', 'commercial', 'comparisons',
  'uptrue vs site24x7',
  ARRAY['site24x7 alternative', 'site24x7 comparison', 'network monitoring tools', 'infrastructure monitoring'],
  1100, 44,
  '/blog/uptrue-vs-site24x7',
  'Uptrue vs Site24x7: Full Feature and Pricing Comparison',
  'Sachin', true, 'planned'
),

-- Listicles & alternatives (11)
(
  '2026-05-31', 'commercial', 'best-of',
  'best uptime monitoring tools',
  ARRAY['uptime monitoring software', 'website monitoring tools 2026', 'server monitoring tools', 'free uptime monitor'],
  8900, 55,
  '/blog/best-uptime-monitoring-tools-2026',
  'Best Uptime Monitoring Tools 2026: Reviewed and Ranked',
  'Sachin', false, 'planned'
),
(
  '2026-05-31', 'commercial', 'best-of',
  'best ssl certificate monitoring tools',
  ARRAY['ssl monitor free', 'ssl expiry monitoring', 'certificate monitoring software', 'ssl checker tool'],
  3200, 40,
  '/blog/best-ssl-certificate-monitoring-tools-2026',
  'Best SSL Certificate Monitoring Tools 2026',
  'Sachin', false, 'planned'
),
(
  '2026-06-01', 'commercial', 'best-of',
  'best dns monitoring tools',
  ARRAY['dns monitoring software', 'dns record monitoring', 'dns uptime monitor', 'dns change detection'],
  2100, 38,
  '/blog/best-dns-monitoring-tools-2026',
  'Best DNS Monitoring Tools 2026: Free and Paid Options',
  'Sachin', false, 'planned'
),
(
  '2026-06-01', 'commercial', 'best-of',
  'best api monitoring tools',
  ARRAY['api uptime monitoring', 'rest api monitoring', 'api response time monitor', 'api health check'],
  4500, 52,
  '/blog/best-api-monitoring-tools-2026',
  'Best API Monitoring Tools 2026: Compared for Developers',
  'Sachin', false, 'planned'
),
(
  '2026-06-01', 'commercial', 'best-of',
  'best wordpress security plugins',
  ARRAY['wordpress monitoring plugin', 'wordpress uptime plugin', 'wordpress health check', 'wp security tools'],
  6800, 58,
  '/blog/best-wordpress-security-plugins-2026',
  'Best WordPress Security Plugins 2026: Monitoring, Uptime, and Health',
  'Sachin', false, 'planned'
),
(
  '2026-06-02', 'commercial', 'best-of',
  'best free website monitoring tools',
  ARRAY['free uptime monitoring', 'free website monitor', 'free server monitor', 'website downtime checker free'],
  7200, 50,
  '/blog/best-free-website-monitoring-tools',
  'Best Free Website Monitoring Tools in 2026',
  'Sachin', false, 'planned'
),
(
  '2026-06-02', 'commercial', 'best-of',
  'best status page providers',
  ARRAY['status page software', 'hosted status page', 'statuspage alternative', 'public status page'],
  2900, 45,
  '/blog/best-status-page-providers-2026',
  'Best Status Page Providers 2026: Compared by Features and Price',
  'Sachin', false, 'planned'
),
(
  '2026-06-02', 'commercial', 'comparisons',
  'uptimerobot alternatives',
  ARRAY['alternative to uptimerobot', 'free uptime robot alternative', 'uptimerobot vs', 'uptime monitoring free plan'],
  5400, 47,
  '/blog/uptimerobot-alternatives-2026',
  'UptimeRobot Alternatives 2026: 8 Tools Worth Switching To',
  'Sachin', false, 'planned'
),
(
  '2026-06-03', 'commercial', 'comparisons',
  'pingdom alternatives',
  ARRAY['alternative to pingdom', 'pingdom replacement', 'website monitoring like pingdom', 'synthetic monitoring alternative'],
  3700, 50,
  '/blog/pingdom-alternatives-2026',
  'Pingdom Alternatives 2026: Better Options for Every Budget',
  'Sachin', false, 'planned'
),
(
  '2026-06-03', 'commercial', 'best-of',
  'best blacklist monitoring services',
  ARRAY['email blacklist monitor', 'ip blacklist checker', 'domain blacklist monitoring', 'dnsbl monitoring'],
  1600, 35,
  '/blog/best-blacklist-monitoring-services',
  'Best Blacklist Monitoring Services: Email and IP Reputation Tools',
  'Sachin', false, 'planned'
),
(
  '2026-06-03', 'commercial', 'best-of',
  'best dmarc monitoring services',
  ARRAY['dmarc monitor free', 'dmarc reporting tool', 'dmarc analyser alternative', 'email authentication monitoring'],
  2200, 42,
  '/blog/best-dmarc-monitoring-services-free-and-paid',
  'Best DMARC Monitoring Services: Free and Paid Options for 2026',
  'Sachin', false, 'planned'
)

ON CONFLICT (url_path) DO NOTHING;
