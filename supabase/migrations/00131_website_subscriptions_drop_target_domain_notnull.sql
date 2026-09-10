-- Bug fix: migration 00129 declared target_domain NOT NULL, and 00130
-- introduced the multi-domain `domains` array as the column the app
-- actually writes to going forward — but never relaxed the old column's
-- constraint. Every insert since 00130 (both the real Razorpay webhook and
-- any manual/admin insert) has been failing with
-- "null value in column target_domain violates not-null constraint"
-- because target_domain is no longer populated by any code path.
alter table public.website_subscriptions alter column target_domain drop not null;
