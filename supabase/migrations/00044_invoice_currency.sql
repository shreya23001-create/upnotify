-- Migration 44: Add currency tracking to invoices
-- Needed to correctly record and display payments in non-GBP currencies (e.g. INR, USD)

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'gbp';

COMMENT ON COLUMN public.invoices.currency IS
  'ISO 4217 lowercase currency code from Stripe (e.g. gbp, inr, usd). Amount stored in smallest unit of this currency.';

-- Rename the column comment to reflect it holds the smallest currency unit, not necessarily GBP pence
COMMENT ON COLUMN public.invoices.amount_gbp IS
  'Amount in smallest currency unit (pence for GBP, paise for INR, cents for USD). See currency column for the ISO code.';
