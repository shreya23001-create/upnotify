-- Migration 11: Pricing update — multi-currency, team members, credit system
-- =================================================================

-- =================================================================
-- 1. Add multi-currency columns to plans
-- =================================================================
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS price_monthly_usd INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_annual_usd INTEGER,
  ADD COLUMN IF NOT EXISTS price_monthly_inr INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_annual_inr INTEGER,
  ADD COLUMN IF NOT EXISTS max_team_members INTEGER NOT NULL DEFAULT 0;

-- =================================================================
-- 2. Clear existing seed data and re-seed with new pricing
-- =================================================================
DELETE FROM public.plans;

INSERT INTO public.plans (
  name, slug, type,
  price_monthly_gbp, price_annual_gbp,
  price_monthly_usd, price_annual_usd,
  price_monthly_inr, price_annual_inr,
  onboarding_fee_gbp,
  monitor_limit, check_interval_seconds,
  client_workspace_limit, max_team_members,
  data_retention_days,
  has_api_access, has_ai_predictive,
  has_status_page_custom_domain, has_white_label,
  has_voice_calls, voice_call_monthly_limit,
  is_visible
) VALUES
-- Free: no cost, 3 monitors, 10-min intervals, 1 workspace, 0 team members
(
  'Free', 'free', 'direct',
  0, NULL,
  0, NULL,
  0, NULL,
  0,
  3, 600,
  1, 0,
  30,
  false, false,
  false, false,
  false, 0,
  true
),
-- Lite: annual only (monthly = 0), 5 monitors, 1-min intervals, 1 workspace, 2 team
(
  'Lite', 'lite', 'direct',
  0, 1000,
  0, 1299,
  0, 99900,
  0,
  5, 60,
  1, 2,
  90,
  false, false,
  false, false,
  false, 0,
  true
),
-- Builder: full pricing, 25 monitors, 1-min intervals, 3 workspaces, 10 team
(
  'Builder', 'builder', 'direct',
  1500, 14400,
  1900, 18900,
  149900, 1499900,
  0,
  25, 60,
  3, 10,
  NULL,
  true, false,
  true, false,
  false, 0,
  true
),
-- Scale: full pricing, 100 monitors, 30s intervals, 10 workspaces, 20 team
(
  'Scale', 'scale', 'direct',
  3900, 37400,
  4900, 47900,
  399900, 3999900,
  0,
  100, 30,
  10, 20,
  NULL,
  true, true,
  true, true,
  true, 100,
  true
);

-- =================================================================
-- 3. Credit rules table
-- =================================================================
CREATE TABLE IF NOT EXISTS public.credit_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key                  TEXT UNIQUE NOT NULL,
  display_name              TEXT NOT NULL,
  credit_amount_pence       INTEGER NOT NULL,
  credit_type               TEXT NOT NULL CHECK (credit_type IN ('recurring', 'one_time')),
  max_per_user              INTEGER NOT NULL,
  max_credit_per_month_pence INTEGER DEFAULT 1000,
  is_active                 BOOLEAN DEFAULT true,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER credit_rules_updated_at
  BEFORE UPDATE ON public.credit_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.credit_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active credit rules"
  ON public.credit_rules FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Anon can view active credit rules"
  ON public.credit_rules FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Super admin can manage credit rules"
  ON public.credit_rules FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Seed credit rules
INSERT INTO public.credit_rules (rule_key, display_name, credit_amount_pence, credit_type, max_per_user, max_credit_per_month_pence) VALUES
  ('badge_embed',     'Badge Embed',          200,  'recurring', 1, 1000),
  ('referral',        'Referral',             500,  'one_time',  5, 1000),
  ('review_g2',       'G2 Review',            1000, 'one_time',  1, 1000),
  ('review_capterra', 'Capterra Review',      1000, 'one_time',  1, 1000),
  ('bug_report',      'Bug Report',           500,  'one_time',  3, 1000);

-- =================================================================
-- 4. User credits table
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  rule_key    TEXT NOT NULL,
  amount_pence INTEGER NOT NULL,
  earned_at   TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ,
  applied     BOOLEAN DEFAULT false,
  applied_at  TIMESTAMPTZ
);

CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_user_credits_org_id ON public.user_credits(org_id);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can manage user credits"
  ON public.user_credits FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
