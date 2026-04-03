-- Migration 18: Trial subscriptions + Referral system
-- =================================================================

-- =================================================================
-- 1. Add trial_ends_at to subscriptions
-- =================================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- =================================================================
-- 2. Referrals table
-- =================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referrer_org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  referred_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  referred_org_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  referral_code   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'completed', 'expired')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they created
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid());

-- Service role can manage all referrals (for webhooks, cron)
CREATE POLICY "Service role can manage referrals"
  ON public.referrals FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =================================================================
-- 3. Add referral_code to users table for quick lookup
-- =================================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code) WHERE referral_code IS NOT NULL;
