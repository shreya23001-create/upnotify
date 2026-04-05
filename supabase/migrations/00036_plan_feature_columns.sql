-- Add missing feature columns to plans table (single source of truth)
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS has_email_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_slack_teams BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_webhooks BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_status_pages BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status_page_limit INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_report_limit INTEGER NOT NULL DEFAULT 0;

-- Set defaults per plan
-- Free: email only, no slack/teams/webhooks/status pages/AI
UPDATE plans SET has_email_alerts = true, has_slack_teams = false, has_webhooks = false, has_status_pages = false, status_page_limit = 0, ai_report_limit = 0 WHERE slug = 'free';

-- Lite: email + slack/teams + webhooks + 1 status page, no AI
UPDATE plans SET has_email_alerts = true, has_slack_teams = true, has_webhooks = true, has_status_pages = true, status_page_limit = 1, ai_report_limit = 0 WHERE slug = 'lite';

-- Builder: all alerts + 5 status pages + 5 AI reports/mo
UPDATE plans SET has_email_alerts = true, has_slack_teams = true, has_webhooks = true, has_status_pages = true, has_status_page_custom_domain = true, status_page_limit = 5, ai_report_limit = 5 WHERE slug = 'builder';

-- Scale: everything unlimited
UPDATE plans SET has_email_alerts = true, has_slack_teams = true, has_webhooks = true, has_status_pages = true, has_status_page_custom_domain = true, status_page_limit = 0, ai_report_limit = 0 WHERE slug = 'scale';
