-- =============================================================
-- 00029: Agency waitlist with AI company validation
-- =============================================================

CREATE TABLE IF NOT EXISTS agency_waitlist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  country         TEXT,
  city            TEXT,
  business_name   TEXT NOT NULL,
  website         TEXT,
  num_clients     INTEGER,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  ai_report       JSONB,
  ai_score        INTEGER,
  notes           TEXT,
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_waitlist_status ON agency_waitlist(status);
CREATE INDEX idx_agency_waitlist_created ON agency_waitlist(created_at DESC);
