-- =============================================================
-- 00059: Razorpay fields for organisations and subscriptions
-- =============================================================

-- Store Razorpay customer ID on the org (equivalent to stripe_customer_id)
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

-- Store Razorpay subscription ID on the subscription row
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- Index for webhook lookups by razorpay_subscription_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub_id
  ON subscriptions(razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;
