-- Migration 00047: add prev_price columns to ecom_products
-- Allows product list and detail pages to show price direction (up/down)

ALTER TABLE ecom_products
  ADD COLUMN IF NOT EXISTS prev_price   NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prev_currency TEXT NOT NULL DEFAULT 'GBP';
