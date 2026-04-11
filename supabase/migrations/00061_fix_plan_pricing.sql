-- Migration 61: Fix plan pricing
-- Scale annual GBP was 34700 (£347) — corrected to 37400 (£374)
-- Lite monthly GBP was 0 — corrected to 100 (£1/mo)
-- Scale stripe_price_id_annual updated to correct Stripe price ID

UPDATE public.plans
SET price_annual_gbp = 37400,
    stripe_price_id_annual = 'price_1TKumxAfL3tHhpwKZ7HIzKXy'
WHERE slug = 'scale';

UPDATE public.plans
SET price_monthly_gbp = 100
WHERE slug = 'lite';
