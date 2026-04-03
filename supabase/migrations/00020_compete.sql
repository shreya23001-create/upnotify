-- =================================================================
-- Migration 00020: Uptrue Compete — ecommerce price tracking
-- =================================================================

-- Product groups (link your product to competitor equivalents)
CREATE TABLE ecom_product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products being tracked (own + competitor)
CREATE TABLE ecom_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  product_group_id UUID REFERENCES ecom_product_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  is_own_product BOOLEAN DEFAULT false,
  extraction_method TEXT DEFAULT 'auto',
  css_selector TEXT,
  check_interval_minutes INTEGER DEFAULT 60,
  last_price NUMERIC(12,2),
  last_currency TEXT DEFAULT 'GBP',
  last_stock_status TEXT,
  last_checked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Price history (append-only)
CREATE TABLE ecom_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES ecom_products(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  stock_status TEXT,
  extraction_method TEXT,
  confidence NUMERIC(3,2),
  raw_extracted_value TEXT,
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ecom_prices_product ON ecom_price_history(product_id, checked_at DESC);
CREATE INDEX idx_ecom_products_org ON ecom_products(org_id);
CREATE INDEX idx_ecom_product_groups_org ON ecom_product_groups(org_id);

-- Pricing rules (automation triggers)
CREATE TABLE ecom_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  product_group_id UUID REFERENCES ecom_product_groups(id),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  condition JSONB NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'alert',
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ecom_pricing_rules_org ON ecom_pricing_rules(org_id);

-- =================================================================
-- RLS Policies — org_id scoping on all tables
-- =================================================================

ALTER TABLE ecom_product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecom_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecom_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecom_pricing_rules ENABLE ROW LEVEL SECURITY;

-- ecom_product_groups
CREATE POLICY "Users can view own org product groups"
  ON ecom_product_groups FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org product groups"
  ON ecom_product_groups FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org product groups"
  ON ecom_product_groups FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org product groups"
  ON ecom_product_groups FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ecom_products
CREATE POLICY "Users can view own org products"
  ON ecom_products FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org products"
  ON ecom_products FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org products"
  ON ecom_products FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org products"
  ON ecom_products FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ecom_price_history (read-only for users; service role writes)
CREATE POLICY "Users can view own org price history"
  ON ecom_price_history FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Service role bypasses RLS for cron writes

-- ecom_pricing_rules
CREATE POLICY "Users can view own org pricing rules"
  ON ecom_pricing_rules FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org pricing rules"
  ON ecom_pricing_rules FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own org pricing rules"
  ON ecom_pricing_rules FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org pricing rules"
  ON ecom_pricing_rules FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- =================================================================
-- Compete add-on columns on plans table
-- =================================================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS has_compete BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS compete_product_limit INTEGER DEFAULT 0;

-- Enable for Builder and Scale plans only
UPDATE plans SET has_compete = true, compete_product_limit = 100 WHERE slug = 'builder';
UPDATE plans SET has_compete = true, compete_product_limit = 1000 WHERE slug = 'scale';
UPDATE plans SET has_compete = false, compete_product_limit = 0 WHERE slug = 'free';
UPDATE plans SET has_compete = false, compete_product_limit = 0 WHERE slug = 'lite';
