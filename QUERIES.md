# Uptrue — SQL Query Reference

Run all queries in **Supabase → SQL Editor**.
Admin client bypasses RLS — all queries here are safe to run as superadmin.

---

## Table of Contents

1. [Blog Posts](#blog-posts)
2. [PMB — Public Monitor Blogging](#pmb--public-monitor-blogging)
3. [Public Monitors](#public-monitors)
4. [Autoblog / Topic Runner](#autoblog--topic-runner)
5. [Cron Health](#cron-health)
6. [Users & Organisations](#users--organisations)
7. [Billing & Plans](#billing--plans)
8. [Incidents](#incidents)

---

## Blog Posts

### View all posts by status
```sql
SELECT id, title, slug, status, category, created_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 50;
```

### Publish a specific post manually
```sql
UPDATE blog_posts
SET status = 'published', published_at = now()
WHERE slug = 'your-slug-here';
```

### Archive a post
```sql
UPDATE blog_posts SET status = 'archived' WHERE slug = 'your-slug-here';
```

### Find posts pending approval (PMB-generated)
```sql
SELECT id, title, slug, category, created_at
FROM blog_posts
WHERE status = 'pending_approval'
ORDER BY created_at DESC;
```

### Delete a blog post (irreversible)
```sql
DELETE FROM blog_posts WHERE slug = 'your-slug-here';
```

### Fix duplicate slug — append suffix
```sql
UPDATE blog_posts
SET slug = slug || '-2'
WHERE slug = 'duplicate-slug-here'
  AND id = (SELECT id FROM blog_posts WHERE slug = 'duplicate-slug-here' ORDER BY created_at DESC LIMIT 1);
```

---

## PMB — Public Monitor Blogging

### View this week's run queue
```sql
SELECT id, post_type, category_slug, scheduled_for, status, word_count, error_message, blog_post_id
FROM pmb_runs
ORDER BY scheduled_for DESC, id DESC
LIMIT 50;
```

### Check failed runs with error messages
```sql
SELECT id, post_type, category_slug, scheduled_for, status, error_message
FROM pmb_runs
WHERE status = 'failed'
ORDER BY id DESC
LIMIT 20;
```

### Re-queue a failed run by ID
```sql
UPDATE pmb_runs
SET status = 'queued', error_message = null, blog_post_id = null
WHERE id = 5;  -- replace with actual ID
```

### Re-queue ALL failed runs for today
```sql
UPDATE pmb_runs
SET status = 'queued', error_message = null, blog_post_id = null
WHERE status = 'failed'
  AND scheduled_for = CURRENT_DATE;
```

### Delete a week's plan (to re-plan from scratch)
```sql
DELETE FROM pmb_runs WHERE period_start = '2026-04-13';  -- replace with week start date
```

### Delete all PMB runs (full reset)
```sql
TRUNCATE pmb_runs;
```

### View all PMB categories
```sql
SELECT id, slug, display_name, emoji, is_active,
       array_length(default_keywords, 1) AS keyword_count
FROM pmb_categories
ORDER BY display_name;
```

### Add new PMB categories
```sql
INSERT INTO pmb_categories (slug, display_name, emoji, default_keywords, is_active)
VALUES
  ('saas-tools',   'SaaS Tools',          '🛠️', ARRAY['salesforce', 'hubspot', 'zendesk', 'intercom', 'freshdesk', 'pipedrive', 'zoho'], true),
  ('social-media', 'Social Media',        '📱', ARRAY['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'snapchat', 'discord'], true),
  ('gaming',       'Gaming Platforms',    '🎮', ARRAY['steam', 'xbox', 'playstation', 'epic games', 'roblox', 'twitch', 'riot'], true),
  ('financial',    'Financial Services',  '💰', ARRAY['plaid', 'coinbase', 'binance', 'robinhood', 'revolut', 'monzo', 'crypto', 'bank'], true),
  ('logistics',    'Logistics & Shipping','📦', ARRAY['fedex', 'ups', 'dhl', 'usps', 'shippo', 'shipbob', 'aftership', 'freight'], true),
  ('hr-tools',     'HR & Workforce',      '👥', ARRAY['workday', 'bamboohr', 'gusto', 'rippling', 'deel', 'greenhouse', 'adp', 'payroll'], true)
ON CONFLICT (slug) DO NOTHING;
```

### Disable a PMB category (stops new runs being created)
```sql
UPDATE pmb_categories SET is_active = false WHERE slug = 'your-category-slug';
```

### Fix bad auto-categorization (reset wrongly assigned monitors)
```sql
-- Reset monitors wrongly assigned to ai-tools
UPDATE public_monitors
SET pmb_category = NULL
WHERE pmb_category = 'ai-tools'
  AND NOT (
    domain     ILIKE ANY(ARRAY['%openai%','%anthropic%','%gemini%','%mistral%','%cohere%','%claude%','%gpt%','%deepmind%','%xai%'])
    OR display_name ILIKE ANY(ARRAY['%openai%','%anthropic%','%gemini%','%claude%','%perplexity%'])
  );
```

### View monitors assigned to each PMB category
```sql
SELECT pmb_category, COUNT(*) AS monitor_count
FROM public_monitors
WHERE pmb_enabled = true AND is_active = true
GROUP BY pmb_category
ORDER BY monitor_count DESC;
```

### Enable PMB for a specific monitor
```sql
UPDATE public_monitors
SET pmb_enabled = true, pmb_category = 'ai-tools'  -- set correct category
WHERE domain = 'openai.com';
```

### Disable PMB for a specific monitor
```sql
UPDATE public_monitors SET pmb_enabled = false WHERE domain = 'example.com';
```

---

## Public Monitors

### View all public monitors with PMB status
```sql
SELECT id, domain, display_name, category, pmb_enabled, pmb_category, is_active
FROM public_monitors
ORDER BY display_name
LIMIT 100;
```

### View monitors with no PMB category assigned
```sql
SELECT id, domain, display_name, category
FROM public_monitors
WHERE pmb_category IS NULL AND pmb_enabled = true
ORDER BY display_name;
```

### Count monitors per category
```sql
SELECT category, COUNT(*) AS total
FROM public_monitors
WHERE is_active = true
GROUP BY category
ORDER BY total DESC;
```

### Monitor health summary (are all sites being checked?)
```sql
SELECT
  COUNT(*)                                                             AS total_active,
  COUNT(*) FILTER (WHERE last_checked_at IS NULL)                      AS never_checked,
  COUNT(*) FILTER (WHERE last_checked_at < now() - interval '10 min') AS stale_over_10min,
  COUNT(*) FILTER (WHERE last_checked_at < now() - interval '1 hour') AS stale_over_1h,
  COUNT(*) FILTER (WHERE last_status = 'down')                         AS currently_down,
  COUNT(*) FILTER (WHERE last_status = 'degraded')                     AS currently_degraded,
  COUNT(*) FILTER (WHERE last_status = 'unknown')                      AS unknown_status
FROM public_monitors
WHERE is_active = true;
```

### Monitors stale (not checked in 10 min) — find laggards
```sql
SELECT id, domain, display_name, last_checked_at, last_status
FROM public_monitors
WHERE is_active = true
  AND (last_checked_at IS NULL OR last_checked_at < now() - interval '10 minutes')
ORDER BY last_checked_at ASC NULLS FIRST;
```

### Open public incidents
```sql
SELECT pi.id, pm.domain, pm.display_name, pi.started_at, pi.cause,
       pi.blog_generated_at, pi.blog_eligible_after
FROM public_incidents pi
JOIN public_monitors pm ON pm.id = pi.monitor_id
WHERE pi.resolved_at IS NULL
ORDER BY pi.started_at DESC;
```

### Incidents stuck in blog retry loop (eligible but never generated)
```sql
SELECT pi.id, pm.domain, pi.started_at, pi.blog_eligible_after, pi.blog_generated_at
FROM public_incidents pi
JOIN public_monitors pm ON pm.id = pi.monitor_id
WHERE pi.blog_generated_at IS NULL
  AND pi.blog_eligible_after IS NOT NULL
  AND pi.blog_eligible_after < now()
ORDER BY pi.blog_eligible_after ASC;
```

### Manually stamp blog_generated_at to stop retry for a stuck incident
```sql
UPDATE public_incidents
SET blog_generated_at = now()
WHERE id = 'incident-uuid-here';
```

---

## Autoblog / Topic Runner

### View all autoblog channels and status
```sql
SELECT id, key, name, is_enabled, cron_path FROM autoblog_channels;
```

### View recent autoblog runs (all channels)
```sql
SELECT r.id, r.channel_key, r.title, r.status, r.error_message, r.ran_at,
       r.sources_count, bp.title AS post_title, bp.status AS post_status
FROM autoblog_runs r
LEFT JOIN blog_posts bp ON bp.id = r.blog_post_id
ORDER BY r.ran_at DESC
LIMIT 20;
```

### View runs for a specific channel (e.g. llm_launches)
```sql
SELECT r.id, r.channel_key, r.title, r.status, r.error_message, r.ran_at,
       bp.title AS post_title, bp.status AS post_status, bp.published_at
FROM autoblog_runs r
LEFT JOIN blog_posts bp ON bp.id = r.blog_post_id
WHERE r.channel_key = 'llm_launches'
ORDER BY r.ran_at DESC
LIMIT 20;
```

### View queued items waiting to be generated
```sql
SELECT id, channel_key, status, ran_at
FROM autoblog_runs
WHERE status = 'queued'
ORDER BY ran_at ASC;
```

### View feed items fetched for autoblog
```sql
SELECT id, title, url, published_at, is_processed, fetched_at
FROM autoblog_feed_items
ORDER BY fetched_at DESC
LIMIT 20;
```

---

## Cron Health

### View last 20 cron runs across all jobs
```sql
SELECT cron_path, status, triggered_by, duration_ms, result_summary, error_message, ran_at
FROM cron_run_log
ORDER BY ran_at DESC
LIMIT 20;
```

### View last runs per cron (one per path)
```sql
SELECT DISTINCT ON (cron_path)
  cron_path, status, duration_ms, result_summary, error_message, ran_at
FROM cron_run_log
ORDER BY cron_path, ran_at DESC;
```

### View only failed cron runs
```sql
SELECT cron_path, error_message, ran_at
FROM cron_run_log
WHERE status = 'error'
ORDER BY ran_at DESC
LIMIT 20;
```

### Clear old cron logs (keep last 30 days)
```sql
DELETE FROM cron_run_log
WHERE ran_at < now() - INTERVAL '30 days';
```

---

## Users & Organisations

### Find a user by email
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';
```

### Find an org and its plan
```sql
SELECT o.id, o.name, o.plan_slug, o.is_active, u.email
FROM organisations o
LEFT JOIN auth.users u ON u.id = o.owner_id
WHERE u.email = 'user@example.com';
```

### Deactivate a user's org
```sql
UPDATE organisations SET is_active = false WHERE id = 'org-uuid-here';
```

### View all orgs on a specific plan
```sql
SELECT o.id, o.name, o.plan_slug, u.email
FROM organisations o
LEFT JOIN auth.users u ON u.id = o.owner_id
WHERE o.plan_slug = 'builder'
ORDER BY o.created_at DESC;
```

---

## Billing & Plans

### View all plans
```sql
SELECT slug, display_name, price_monthly, price_annual, is_active
FROM plans
ORDER BY price_monthly;
```

### Change an org's plan manually
```sql
UPDATE organisations
SET plan_slug = 'scale'
WHERE id = 'org-uuid-here';
```

---

## Incidents

### View open incidents
```sql
SELECT id, monitor_id, started_at, severity
FROM incidents
WHERE resolved_at IS NULL
ORDER BY started_at DESC;
```

### Manually resolve a stuck incident
```sql
UPDATE incidents
SET resolved_at = now()
WHERE id = 'incident-uuid-here' AND resolved_at IS NULL;
```

---

*Last updated: 17 April 2026*
*Add new queries here as the product grows — keep them organised by module.*
