-- One-off backfill for supabase_migrations.schema_migrations
-- =================================================================
-- Records every migration file that exists in supabase/migrations/
-- as "applied". Use ON CONFLICT DO NOTHING so existing rows
-- (00001–00047 and any others already tracked) are left alone.
--
-- After this runs, `select * from supabase_migrations.schema_migrations`
-- becomes the authoritative list of applied migrations and matches
-- the repo file list exactly. Running `npx supabase migration list --linked`
-- will then show clean LOCAL/REMOTE alignment.
--
-- Safety: this only INSERTs into the tracking table. It does NOT
-- execute any migration SQL. The reality checks already confirmed the
-- schema is current (auto_generated, content_calendar, source_calendar_row_id,
-- noindex, legal_review_outcome, blog_posts_content_is_object all present).
-- =================================================================

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('00001', 'extensions_and_helpers',          ARRAY['']),
  ('00002', 'core_tenancy',                    ARRAY['']),
  ('00003', 'billing_and_plans',               ARRAY['']),
  ('00004', 'monitoring',                      ARRAY['']),
  ('00005', 'alerting',                        ARRAY['']),
  ('00006', 'api_keys_audit_reports',          ARRAY['']),
  ('00007', 'status_pages_cms_flags',          ARRAY['']),
  ('00008', 'seed_plans',                      ARRAY['']),
  ('00009', 'auth_trigger',                    ARRAY['']),
  ('00010', 'org_company_details',             ARRAY['']),
  ('00011', 'pricing_update',                  ARRAY['']),
  ('00012', 'public_tracker',                  ARRAY['']),
  ('00013', 'set_super_admin',                 ARRAY['']),
  ('00014', 'fix_super_admin',                 ARRAY['']),
  ('00015', 'email_nurture',                   ARRAY['']),
  ('00016', 'admin_roles',                     ARRAY['']),
  ('00017', 'team_invites',                    ARRAY['']),
  ('00018', 'trial_and_referrals',             ARRAY['']),
  ('00019', 'keyword_suggestions',             ARRAY['']),
  ('00020', 'compete',                         ARRAY['']),
  ('00021', 'lite_monthly',                    ARRAY['']),
  ('00022', 'seed_public_monitors',            ARRAY['']),
  ('00023', 'user_messages',                   ARRAY['']),
  ('00024', 'compete_addon_plans',             ARRAY['']),
  ('00025', 'more_public_monitors',            ARRAY['']),
  ('00026', 'pricing_rules_engine',            ARRAY['']),
  ('00027', 'compete_sale_detection',          ARRAY['']),
  ('00028', 'email_templates',                 ARRAY['']),
  ('00029', 'agency_waitlist',                 ARRAY['']),
  ('00030', 'seed_blog_posts',                 ARRAY['']),
  ('00031', 'fix_org_slug',                    ARRAY['']),
  ('00032', 'org_switch',                      ARRAY['']),
  ('00033', 'user_deactivation',               ARRAY['']),
  ('00034', 'remove_trials',                   ARRAY['']),
  ('00035', 'kill_remaining_trials',           ARRAY['']),
  ('00036', 'plan_feature_columns',            ARRAY['']),
  ('00037', 'cancellation_and_pause',          ARRAY['']),
  ('00038', 'aoe',                             ARRAY['']),
  ('00039', 'blog_auto_publish',               ARRAY['']),
  -- 00040 intentionally skipped — file does not exist in repo
  ('00041', 'public_tracker_batch2',           ARRAY['']),
  ('00042', 'public_tracker_batch3',           ARRAY['']),
  ('00043', 'public_tracker_batch4',           ARRAY['']),
  ('00044', 'invoice_currency',                ARRAY['']),
  ('00045', 'health_score',                    ARRAY['']),
  ('00046', 'competitor_monitors',             ARRAY['']),
  ('00047', 'ecom_prev_price',                 ARRAY['']),
  ('00048', 'competitor_checks',               ARRAY['']),
  ('00049', 'aoe_rls',                         ARRAY['']),
  ('00050', 'cron_run_log',                    ARRAY['']),
  ('00051', 'support_tickets',                 ARRAY['']),
  ('00052', 'watchdog_limit',                  ARRAY['']),
  ('00053', 'tool_leads',                      ARRAY['']),
  ('00054', 'ai_engines',                      ARRAY['']),
  ('00055', 'ai_visibility_usage',             ARRAY['']),
  ('00056', 'plans_ai_visibility',             ARRAY['']),
  ('00057', 'aoe_ai_seo',                      ARRAY['']),
  ('00058', 'plans_inr_pricing',               ARRAY['']),
  ('00059', 'razorpay_fields',                 ARRAY['']),
  ('00060', 'razorpay_annual_upgrades',        ARRAY['']),
  ('00061', 'fix_plan_pricing',                ARRAY['']),
  ('00062', 'public_monitors_refresh',         ARRAY['']),
  ('00063', 'public_incidents_blog_delay',     ARRAY['']),
  ('00064', 'autoblog_system',                 ARRAY['']),
  ('00065', 'autoblog_queue',                  ARRAY['']),
  ('00066', 'add_dev_super_admin',             ARRAY['']),
  ('00067', 'admin_full_access',               ARRAY['']),
  ('00068', 'landing_cms',                     ARRAY['']),
  ('00069', 'blog_subscribers',                ARRAY['']),
  ('00070', 'pmb_categories_expand',           ARRAY['']),
  ('00071', 'new_monitor_types',               ARRAY['']),
  ('00072', 'plan_monitor_limits',             ARRAY['']),
  ('00073', 'fix_monitor_intervals',           ARRAY['']),
  ('00074', 'org_monitor_limit_override',      ARRAY['']),
  ('00075', 'email_providers',                 ARRAY['']),
  ('00076', 'contact_messages',                ARRAY['']),
  ('00077', 'public_monitors_status_page_urls', ARRAY['']),
  ('00078', 'aoe_rls_fix',                     ARRAY['']),
  ('00079', 'security_hardening',              ARRAY['']),
  ('00080', 'wordpress_monitor',               ARRAY['']),
  ('00081', 'fix_wp_monitor_limits',           ARRAY['']),
  ('00082', 'check_results_retention_and_indexes', ARRAY['']),
  ('00083', 'analyze_public_check_results',    ARRAY['']),
  ('00084', 'outage_blog_config',              ARRAY['']),
  ('00085', 'calendar_blog_digest',            ARRAY['']),
  ('00086', 'seed_content_calendar',           ARRAY['']),
  ('00087', 'autoblog_topic_sources',          ARRAY['']),
  ('00088', 'paywalled_domains',               ARRAY['']),
  ('00089', 'pmb',                             ARRAY['']),
  ('00090', 'cms_extra_sections',              ARRAY['']),
  ('00091', 'smart_digest_alerts',             ARRAY['']),
  ('00092', 'seller_entities',                 ARRAY['']),
  ('00093', 'ai_visibility_teaser_section',    ARRAY['']),
  ('00094', 'nav_six_items_d4_pilot',          ARRAY['']),
  ('00095', 'blog_noindex_column',             ARRAY['']),
  ('00096', 'noindex_tier3_permutation_blogs', ARRAY['']),
  ('00097', 'blog_post_calendar_idempotency',  ARRAY['']),
  ('00098', 'seed_ai_themed_blog_rows',        ARRAY['']),
  ('00099', 'smart_digest_default_on',         ARRAY['']),
  ('00100', 'backfill_blog_content_shape',     ARRAY['']),
  ('00101', 'blog_posts_legal_review_columns', ARRAY['']),
  ('00102', 'seed_commercial_calendar_rows',   ARRAY['']),
  ('00103', 'blog_content_constraint',         ARRAY[''])
ON CONFLICT (version) DO NOTHING;

-- Verify: should return 102 (all migrations except retired 00040)
SELECT COUNT(*) AS tracked_migrations
FROM supabase_migrations.schema_migrations;

-- Full list, newest first
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
