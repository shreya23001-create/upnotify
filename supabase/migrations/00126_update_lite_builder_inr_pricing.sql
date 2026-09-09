-- Update Lite/Builder INR pricing per Boss's instruction: Lite = ₹999/yr,
-- Builder = ₹4999/yr. Monthly derived as annual÷12 (no separate discount).
-- All values in paise (INR minor unit).
UPDATE public.plans SET
  price_monthly_inr = 8325,   -- ₹83.25/mo
  price_annual_inr  = 99900   -- ₹999/yr
WHERE slug = 'lite';

UPDATE public.plans SET
  price_monthly_inr = 41658,  -- ₹416.58/mo
  price_annual_inr  = 499900  -- ₹4999/yr
WHERE slug = 'builder';
