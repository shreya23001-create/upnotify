-- Migration 21: Add monthly pricing for Lite plan
-- =================================================================
-- Lite now supports both monthly (GBP1/mo) and annual (GBP10/yr).
-- Previously Lite was annual-only with price_monthly_gbp = 0.
-- =================================================================

UPDATE public.plans
SET
  price_monthly_gbp = 100,
  price_monthly_usd = 129,
  price_monthly_inr = 9900
WHERE slug = 'lite';
