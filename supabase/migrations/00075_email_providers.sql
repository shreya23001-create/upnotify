-- Email providers: store multiple email service configurations
CREATE TABLE email_providers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('resend', 'sendgrid', 'smtp')),
  config        jsonb NOT NULL DEFAULT '{}',
  from_email    text NOT NULL,
  from_name     text NOT NULL DEFAULT 'Uptrue',
  is_active     boolean NOT NULL DEFAULT true,
  test_last_at  timestamptz,
  test_status   text CHECK (test_status IN ('ok', 'error')),
  test_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Email routing: map each email type to a provider
CREATE TABLE email_routing (
  email_type          text PRIMARY KEY CHECK (email_type IN ('monitor_alert', 'incident_notification', 'blog_approval', 'team_invite', 'citation_report', 'system')),
  provider_id         uuid REFERENCES email_providers(id) ON DELETE SET NULL,
  fallback_provider_id uuid REFERENCES email_providers(id) ON DELETE SET NULL,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Seed default routing rows so every type always has a row
INSERT INTO email_routing (email_type) VALUES
  ('monitor_alert'),
  ('incident_notification'),
  ('blog_approval'),
  ('team_invite'),
  ('citation_report'),
  ('system');

-- RLS: no user-level access — service role only
ALTER TABLE email_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_routing   ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_email_providers_active ON email_providers(is_active);
CREATE INDEX idx_email_routing_provider ON email_routing(provider_id);
