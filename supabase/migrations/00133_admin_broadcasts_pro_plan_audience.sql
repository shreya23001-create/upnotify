-- The admin "Send Message" audience filter used to target legacy plan
-- tiers (free/lite/builder/scale) or "trial" (no legacy subscription).
-- Those no longer match any current customer — the only real plan today
-- is the per-website Pro Plan, tracked in website_subscriptions, not the
-- legacy subscriptions/plans tables. Replace the audience values with
-- 'pro_plan' (active Pro Plan) and 'no_plan' (no active plan at all,
-- legacy or Pro Plan), alongside 'all'.
alter table public.admin_broadcasts
  drop constraint if exists admin_broadcasts_audience_check;

alter table public.admin_broadcasts
  add constraint admin_broadcasts_audience_check
  check (audience in ('all', 'pro_plan', 'no_plan'));
