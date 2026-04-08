-- Migration 00057: AOE AI SEO campaign
-- Adds llms.txt detection to site discovery + AI SEO campaign toggle

-- Add has_llms_txt flag to site discovery pipeline
ALTER TABLE aoe_site_discovery
  ADD COLUMN IF NOT EXISTS has_llms_txt BOOLEAN;

-- Index for fast querying of sites without llms.txt
CREATE INDEX IF NOT EXISTS aoe_site_discovery_no_llms_txt_idx
  ON aoe_site_discovery (has_llms_txt)
  WHERE has_llms_txt = false;

-- Add AI SEO campaign toggle — default OFF until Harvey signs off
INSERT INTO aoe_settings (key, value, updated_at, updated_by)
VALUES ('campaign_ai_seo', 'false', NOW(), 'system')
ON CONFLICT (key) DO NOTHING;
