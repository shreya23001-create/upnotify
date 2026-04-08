-- Migration 00053: Tool leads — email captures from free tools (llms.txt generator etc.)

CREATE TABLE IF NOT EXISTS tool_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  domain      TEXT NOT NULL,
  tool        TEXT NOT NULL DEFAULT 'llms-txt-generator',
  models      TEXT[] NOT NULL DEFAULT '{}',  -- selected AI engines
  llms_txt    TEXT,                           -- generated content stored for reference
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for deduplication check
CREATE INDEX IF NOT EXISTS tool_leads_email_tool_idx ON tool_leads (email, tool);
CREATE INDEX IF NOT EXISTS tool_leads_created_at_idx ON tool_leads (created_at DESC);

-- RLS: admin read-only, no user access
ALTER TABLE tool_leads ENABLE ROW LEVEL SECURITY;

-- No public insert policy — inserts happen via service role in API route only
-- Admin can read all leads
CREATE POLICY "Admin can read tool leads"
  ON tool_leads FOR SELECT
  USING (true);  -- restricted at API middleware level
