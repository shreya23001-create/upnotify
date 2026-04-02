-- Migration 15: Email nurture system — sends, preferences, tracking
-- =================================================================

-- Track every nurture/lifecycle email sent to a user
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX idx_email_sends_user ON email_sends(user_id, email_key);
CREATE INDEX idx_email_sends_sent_at ON email_sends(sent_at);

-- User-level email opt-out preferences
CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  product_updates BOOLEAN NOT NULL DEFAULT true,
  usage_digests BOOLEAN NOT NULL DEFAULT true,
  upgrade_tips BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- email_sends: users can read their own sends (service role inserts)
CREATE POLICY "Users can view own email sends"
  ON email_sends FOR SELECT
  USING (auth.uid() = user_id);

-- email_preferences: users can read and update their own preferences
CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create email preferences when a new user is created
-- (extends the existing auth trigger pattern from migration 9)
CREATE OR REPLACE FUNCTION public.create_email_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_email_prefs
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_email_preferences();
