-- =============================================================
-- 00027: Sale detection + enhanced price history columns
-- =============================================================

-- Add sale/discount columns to price history
ALTER TABLE ecom_price_history
  ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_price_pence INTEGER,
  ADD COLUMN IF NOT EXISTS discount_pct NUMERIC(5,2);

-- Add last extraction metadata to products
ALTER TABLE ecom_products
  ADD COLUMN IF NOT EXISTS last_extraction_method TEXT,
  ADD COLUMN IF NOT EXISTS last_confidence NUMERIC(3,2);
