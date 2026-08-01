-- Migration 121: Seed missing Stripe price IDs for all plans
-- Root cause: builder/lite/scale monthly price IDs were never set,
-- causing checkout to 500 with "No Stripe price ID configured for plan".
--
-- HOW TO FILL THESE IN:
-- 1. Go to Stripe Dashboard → Products
-- 2. For each plan, click the product → copy the Price ID (starts with price_1...)
-- 3. Replace the placeholder strings below with the real IDs
-- 4. Run: npx supabase db push  (or apply via Supabase dashboard SQL editor)
-- =========================================================================

-- Lite — annual only (monthly not sold)
UPDATE public.plans
SET stripe_price_id_annual   = 'price_REPLACE_LITE_ANNUAL'
WHERE slug = 'lite';

-- Builder — monthly + annual
UPDATE public.plans
SET stripe_price_id_monthly  = 'price_REPLACE_BUILDER_MONTHLY',
    stripe_price_id_annual   = 'price_REPLACE_BUILDER_ANNUAL'
WHERE slug = 'builder';

-- Scale — monthly + annual (annual already set in migration 61, update if needed)
UPDATE public.plans
SET stripe_price_id_monthly  = 'price_REPLACE_SCALE_MONTHLY'
WHERE slug = 'scale'
  AND stripe_price_id_monthly IS NULL;
