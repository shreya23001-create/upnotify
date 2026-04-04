-- Remove all trialing subscriptions — no free trials offered
-- Users start on Free plan, upgrade via Stripe checkout
UPDATE subscriptions SET status = 'canceled', canceled_at = now()
WHERE status = 'trialing';
