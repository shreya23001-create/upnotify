-- Add INR pricing columns to plans table for Indian market (Razorpay)
-- Prices stored in paise (smallest INR unit, like pence for GBP)
-- e.g. ₹999 = 99900 paise

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS price_monthly_inr integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_annual_inr integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS razorpay_monthly_plan_id text,
  ADD COLUMN IF NOT EXISTS razorpay_annual_plan_id text;

-- Set INR prices (in paise) for each plan
-- Lite:    ₹399/mo = 39900 paise | ₹4,788/yr = 478800 paise
-- Builder: ₹999/mo = 99900 paise | ₹11,988/yr = 1198800 paise
-- Scale:   ₹2,499/mo = 249900 paise | ₹29,988/yr = 2998800 paise

UPDATE plans SET price_monthly_inr = 39900,  price_annual_inr = 478800  WHERE slug = 'lite';
UPDATE plans SET price_monthly_inr = 99900,  price_annual_inr = 1198800 WHERE slug = 'builder';
UPDATE plans SET price_monthly_inr = 249900, price_annual_inr = 2998800 WHERE slug = 'scale';
