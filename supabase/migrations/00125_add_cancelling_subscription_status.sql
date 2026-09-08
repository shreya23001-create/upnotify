-- lib/services/plan-enforcement.ts cancelSubscription() writes status =
-- 'cancelling' when an active (non-paused) subscription is scheduled to
-- cancel at period end, but the original status check constraint never
-- included that value. The UPDATE silently violated the constraint,
-- leaving subscriptions stuck on 'active' with no canceled_at timestamp
-- even though Stripe correctly received cancel_at_period_end: true.
alter table public.subscriptions drop constraint subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status = any (array['active'::text, 'past_due'::text, 'canceled'::text, 'cancelling'::text, 'trialing'::text, 'incomplete'::text, 'paused'::text]));
