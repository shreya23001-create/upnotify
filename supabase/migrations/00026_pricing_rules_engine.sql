-- =============================================================
-- 00026: Enhanced pricing rules engine
-- Adds safety limits, auto-update config, execution log
-- =============================================================

-- Extend pricing rules table
ALTER TABLE ecom_pricing_rules
  ADD COLUMN IF NOT EXISTS watch_product_id UUID REFERENCES ecom_products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS my_product_id UUID REFERENCES ecom_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trigger_type TEXT NOT NULL DEFAULT 'price_change' CHECK (trigger_type IN ('price_change', 'price_drop', 'price_increase', 'stock_out', 'stock_back')),
  ADD COLUMN IF NOT EXISTS trigger_threshold_pct NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_action TEXT NOT NULL DEFAULT 'alert' CHECK (response_action IN ('alert', 'auto_update')),
  ADD COLUMN IF NOT EXISTS response_adjust_pct NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_adjust_direction TEXT DEFAULT 'match' CHECK (response_adjust_direction IN ('match', 'undercut', 'above')),
  ADD COLUMN IF NOT EXISTS safety_min_price_pence INTEGER,
  ADD COLUMN IF NOT EXISTS safety_max_price_pence INTEGER,
  ADD COLUMN IF NOT EXISTS safety_max_change_pct NUMERIC(6,2) DEFAULT 20,
  ADD COLUMN IF NOT EXISTS safety_max_changes_per_day INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS auto_update_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_update_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS alert_channels JSONB DEFAULT '["in_app"]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trigger_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Rule execution log (immutable)
CREATE TABLE IF NOT EXISTS pricing_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES ecom_pricing_rules(id) ON DELETE CASCADE,
  watch_product_id UUID REFERENCES ecom_products(id),
  old_price_pence INTEGER,
  new_price_pence INTEGER,
  competitor_price_pence INTEGER,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('alert_sent', 'auto_updated', 'blocked_safety', 'blocked_limit', 'webhook_failed')),
  webhook_response_code INTEGER,
  webhook_response_body TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rule_executions_org ON pricing_rule_executions(org_id);
CREATE INDEX idx_rule_executions_rule ON pricing_rule_executions(rule_id);
CREATE INDEX idx_rule_executions_created ON pricing_rule_executions(created_at DESC);

-- RLS
ALTER TABLE pricing_rule_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rule executions" ON pricing_rule_executions
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
