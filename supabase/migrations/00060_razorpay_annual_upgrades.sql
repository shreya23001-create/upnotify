-- =============================================================================
-- 00060_razorpay_annual_upgrades.sql
-- =============================================================================
-- Tracks Razorpay annual plan upgrades for admin credit management.
--
-- In V1 no automatic refunds are issued for mid-year annual upgrades.
-- This table gives the super admin full visibility of:
--   - which customers upgraded mid-year
--   - how many days were remaining on their old plan
--   - the INR credit value they are owed
-- so manual refunds can be processed via the Razorpay dashboard in V1.5.
-- =============================================================================

CREATE TABLE IF NOT EXISTS razorpay_annual_upgrade_log (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                       UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- Customer snapshot (denormalised — survives org data changes)
  org_name                     TEXT        NOT NULL,
  user_email                   TEXT        NOT NULL,

  -- Old plan (the annual subscription that was cancelled on upgrade)
  old_razorpay_subscription_id TEXT        NOT NULL,
  old_plan_id                  UUID        REFERENCES plans(id),
  old_plan_name                TEXT        NOT NULL,
  old_plan_slug                TEXT        NOT NULL,
  old_plan_price_annual_inr    INTEGER     NOT NULL, -- paise (e.g. ₹4,788/yr = 478800)
  old_subscription_started_at  TIMESTAMPTZ NOT NULL,
  old_subscription_period_end  TIMESTAMPTZ NOT NULL,

  -- New plan (the annual subscription that was just activated)
  new_razorpay_subscription_id TEXT        NOT NULL,
  new_plan_id                  UUID        REFERENCES plans(id),
  new_plan_name                TEXT        NOT NULL,
  new_plan_slug                TEXT        NOT NULL,
  new_plan_price_annual_inr    INTEGER     NOT NULL, -- paise

  -- Credit calculation (computed at upgrade time, immutable)
  upgraded_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  days_remaining               INTEGER     NOT NULL, -- days left on old annual period
  credit_amount_inr            INTEGER     NOT NULL, -- paise: floor(days_remaining / 365 × old_price)

  -- Refund tracking (V1.5 workflow)
  refund_status                TEXT        NOT NULL DEFAULT 'pending'
                                           CHECK (refund_status IN ('pending', 'refunded', 'waived')),
  refunded_at                  TIMESTAMPTZ,
  refunded_amount_inr          INTEGER,              -- actual paise refunded (may differ from credit_amount_inr)
  refund_notes                 TEXT,

  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rzp_annual_upg_org_id
  ON razorpay_annual_upgrade_log(org_id);

CREATE INDEX IF NOT EXISTS idx_rzp_annual_upg_upgraded_at
  ON razorpay_annual_upgrade_log(upgraded_at DESC);

CREATE INDEX IF NOT EXISTS idx_rzp_annual_upg_refund_status
  ON razorpay_annual_upgrade_log(refund_status);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_rzp_annual_upgrade_log_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rzp_annual_upgrade_log_updated_at
  BEFORE UPDATE ON razorpay_annual_upgrade_log
  FOR EACH ROW EXECUTE FUNCTION set_rzp_annual_upgrade_log_updated_at();

-- ── RLS: admin-only (service-role client bypasses RLS) ────────────────────────
ALTER TABLE razorpay_annual_upgrade_log ENABLE ROW LEVEL SECURITY;

-- No direct user access — all reads/writes go through the admin client (service-role)
CREATE POLICY "no_direct_user_access" ON razorpay_annual_upgrade_log
  USING (false)
  WITH CHECK (false);
