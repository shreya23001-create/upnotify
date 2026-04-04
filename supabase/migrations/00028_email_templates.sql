-- =============================================================
-- Migration 00028: Email Templates
-- Admin-managed email templates for nurture sequences
-- =============================================================

-- ---------------------------------------------------------------------------
-- Table: email_templates
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key    text NOT NULL UNIQUE,
  name            text NOT NULL,
  subject         text NOT NULL,
  body_text       text NOT NULL DEFAULT '',
  body_html       text NOT NULL DEFAULT '',
  is_active       boolean NOT NULL DEFAULT true,
  category        text NOT NULL DEFAULT 'system'
                    CHECK (category IN ('onboarding', 'billing', 'engagement', 'system')),
  variables       jsonb NOT NULL DEFAULT '[]'::jsonb,
  send_count      bigint NOT NULL DEFAULT 0,
  last_sent_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index on template_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates (template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates (category);

-- ---------------------------------------------------------------------------
-- RLS: admin only
-- ---------------------------------------------------------------------------

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by admin API)
CREATE POLICY "Service role full access on email_templates"
  ON email_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- No policies for authenticated users — admin API uses service role client

-- ---------------------------------------------------------------------------
-- Auto-update updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- ---------------------------------------------------------------------------
-- Seed: current hardcoded templates from email-nurture.ts
-- ---------------------------------------------------------------------------

INSERT INTO email_templates (template_key, name, subject, body_text, body_html, is_active, category, variables) VALUES

(
  'welcome',
  'Welcome Email',
  'Your first monitor is 30 seconds away',
  'Welcome to Uptrue, {{first_name}}! Your account is ready. Setting up your first monitor takes about 30 seconds. Here''s what you get with your 14-day Builder trial: 10 monitors with 1-minute check intervals, 10 check types, multi-channel alerts, public status pages, and AI-powered reports. No credit card required.',
  '<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">Welcome to Uptrue, {{first_name}}!</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Your account is ready. Setting up your first monitor takes about 30 seconds &mdash; just enter a URL and we''ll start watching it immediately.</p>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">Here''s what you get with your 14-day Builder trial:</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
  <li><strong>10 monitors</strong> with 1-minute check intervals</li>
  <li><strong>10 check types</strong> &mdash; HTTP, SSL, DNS, keyword, port, ping &amp; more</li>
  <li><strong>Multi-channel alerts</strong> &mdash; email, Slack, Teams, webhooks</li>
  <li><strong>Public status pages</strong> with custom branding</li>
  <li><strong>AI-powered reports</strong> with executive summaries</li>
</ul>
<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">No credit card required. After your trial, you''ll move to our Free plan unless you upgrade.</p>
{{cta_button}}',
  true,
  'onboarding',
  '["first_name", "app_url", "cta_button"]'::jsonb
),

(
  'trial_ending_4d',
  'Trial Ending (4 Days)',
  'Your Builder trial ends in 4 days',
  '{{first_name}}, your trial ends in 4 days. Your 14-day Builder trial is coming to an end. When it expires, your account will move to our Free plan. Upgrade now to keep all your current features and monitors active.',
  '<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">{{first_name}}, your trial ends in 4 days</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Your 14-day Builder trial is coming to an end. When it expires, your account will move to our Free plan.</p>
<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Upgrade now to keep all your current features and monitors active.</p>
{{cta_button}}',
  true,
  'billing',
  '["first_name", "app_url", "cta_button", "days_left"]'::jsonb
),

(
  'trial_ending_2d',
  'Trial Ending (2 Days)',
  'Your Builder trial ends in 2 days',
  '{{first_name}}, your trial ends in 2 days. Your 14-day Builder trial is coming to an end. When it expires, your account will move to our Free plan. Upgrade now to keep all your current features and monitors active.',
  '<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">{{first_name}}, your trial ends in 2 days</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Your 14-day Builder trial is coming to an end. When it expires, your account will move to our Free plan.</p>
<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Upgrade now to keep all your current features and monitors active.</p>
{{cta_button}}',
  true,
  'billing',
  '["first_name", "app_url", "cta_button", "days_left"]'::jsonb
),

(
  'trial_ending_today',
  'Trial Ending (Today)',
  'Your Builder trial ends today',
  '{{first_name}}, your trial ends today. Your 14-day Builder trial is coming to an end. When it expires, your account will move to our Free plan. Upgrade now to keep all your current features and monitors active.',
  '<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">{{first_name}}, your trial ends today</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Your 14-day Builder trial is coming to an end. When it expires, your account will move to our Free plan.</p>
<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Upgrade now to keep all your current features and monitors active.</p>
{{cta_button}}',
  true,
  'billing',
  '["first_name", "app_url", "cta_button", "days_left"]'::jsonb
),

(
  'welcome_to_free',
  'Welcome to Free Plan',
  'You''re on Free -- here''s what you''ve got',
  'You''re on the Free plan now, {{first_name}}. Your Builder trial has ended. Don''t worry -- your monitors are still running. You get 3 monitors with 5-minute check intervals, email alerts, 1 public status page, and 24-hour data retention. Plans start from just 19 pounds per month.',
  '<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">You''re on the Free plan now, {{first_name}}</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Your Builder trial has ended and your account has moved to our Free plan. Don''t worry &mdash; your monitors are still running. Here''s what you''ve got:</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
  <li><strong>3 monitors</strong> with 5-minute check intervals</li>
  <li><strong>Email alerts</strong> for downtime notifications</li>
  <li><strong>1 public status page</strong></li>
  <li><strong>24-hour data retention</strong> for check results</li>
</ul>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">If you had more than 3 monitors, only the 3 most recently created will remain active. You can upgrade anytime to restore all your monitors and unlock advanced features.</p>
<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Plans start from just &pound;19/month.</p>
{{cta_button}}',
  true,
  'billing',
  '["first_name", "app_url", "cta_button"]'::jsonb
),

(
  'monthly_digest',
  'Monthly Digest',
  '{{month_name}} report: {{total_checks}} checks, {{uptime_percent}}% uptime',
  'Hi {{first_name}}, here''s how your infrastructure performed this month. Monitors: {{total_monitors}}. Total Checks: {{total_checks}}. Uptime: {{uptime_percent}}%. Incidents: {{incident_count}}.',
  '<h1 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">Your {{month_name}} Report</h1>
<p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">Hi {{first_name}}, here''s how your infrastructure performed this month.</p>
{{stats_table}}
{{performance_note}}
{{cta_button}}',
  true,
  'engagement',
  '["first_name", "app_url", "cta_button", "month_name", "total_monitors", "total_checks", "uptime_percent", "incident_count", "stats_table", "performance_note"]'::jsonb
)

ON CONFLICT (template_key) DO NOTHING;
