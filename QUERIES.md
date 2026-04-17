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

---

## Autoblog / Topic Runner

### View recent autoblog topic runs
```sql
SELECT id, topic, status, error_message, created_at
FROM autoblog_topics
ORDER BY created_at DESC
LIMIT 20;
```

### Re-queue a failed autoblog topic
```sql
UPDATE autoblog_topics
SET status = 'queued', error_message = null
WHERE id = 123;  -- replace with actual ID
```

### View feed items fetched for autoblog
```sql
SELECT id, source_url, title, fetched_at
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

*Last updated: April 2026*
*Add new queries here as the product grows — keep them organised by module.*
