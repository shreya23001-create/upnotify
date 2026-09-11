-- =============================================================================
-- Migration 00092: Seller Entities (DB-driven invoice header)
--
-- Replaces the hardcoded SELLER_GBP / SELLER_INR constants in
-- components/billing/invoice-print.tsx with a database table so that:
--
--   1. Boss can update GST/VAT numbers, addresses, registration numbers
--      without a code deploy.
--   2. Adding a third entity (e.g. US LLC) is a row insert, not a code change.
--   3. Single source of truth — invoice page fetches the row at render time.
--
-- One row per currency. Currently:
--   gbp → Crozent Techlabs Private Limited (India)
--   inr → Crozent TechLabs Private Limited (India)
--
-- Public read access — sellers appear on customer invoices. Service role
-- handles writes (no admin UI in V1; admin updates via SQL).
-- =============================================================================

CREATE TABLE IF NOT EXISTS seller_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lookup key. The invoice page picks the entity by invoice.currency.
  currency_code text NOT NULL UNIQUE,

  -- Legal & display
  legal_name text NOT NULL,
  address_lines text[] NOT NULL DEFAULT '{}',

  -- Optional identifiers — render conditionally based on presence.
  registration_number text,           -- e.g. "Company No. 02710980" or CIN
  tax_label text,                      -- 'VAT' or 'GST'
  tax_number text,                     -- e.g. 'GB 573 253 734' or '09AAMCC8947M1ZP'

  -- India-specific compliance identifiers. NULL for non-India entities.
  pan text,                            -- Permanent Account Number (10 char)
  tan text,                            -- Tax Deduction & Collection Account Number (10 char)

  -- Contact
  email text NOT NULL,
  website text,

  -- Lifecycle
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seller_entities ENABLE ROW LEVEL SECURITY;

-- Public read — these details appear on every customer invoice.
CREATE POLICY seller_entities_public_read ON seller_entities
  FOR SELECT USING (true);

-- Auto-touch updated_at on edit
CREATE OR REPLACE FUNCTION trg_seller_entities_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_entities_touch_updated_at
  BEFORE UPDATE ON seller_entities
  FOR EACH ROW EXECUTE FUNCTION trg_seller_entities_touch_updated_at();

-- ----------------------------------------------------------------------------
-- Seed: Crozent Techlabs Private Limited (India / GBP)
--   Entity migrated from Vision Software Solutions Limited (UK) to Crozent
--   Techlabs Private Limited (India). No company registration number is
--   displayed for the new entity; GST/PAN/TAN mirror the INR seed row below.
-- ----------------------------------------------------------------------------
INSERT INTO seller_entities (
  currency_code, legal_name, address_lines, registration_number, tax_label, tax_number, pan, tan, email, website
)
VALUES (
  'gbp',
  'Crozent Techlabs Private Limited',
  ARRAY['B-59, B-Block, Chipyana', 'Noida – 201009', 'Uttar Pradesh, India'],
  NULL,
  'GST',
  '09AAMCC8947M1ZP',
  'AAMCC8947M',
  'MRTC07685G',
  'shreya23001@gmail.com',
  'crozent.com'
)
ON CONFLICT (currency_code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Seed: Crozent TechLabs Private Limited (India / INR)
--   GST registration received 30 Apr 2026; CIN/PAN/TAN supplied by Boss 03 May 2026.
-- ----------------------------------------------------------------------------
INSERT INTO seller_entities (
  currency_code, legal_name, address_lines, registration_number, tax_label, tax_number, pan, tan, email, website
)
VALUES (
  'inr',
  'Crozent TechLabs Private Limited',
  ARRAY['B-59, B-Block, Chipyana', 'Noida – 201009', 'Uttar Pradesh, India'],
  'CIN: U62012UP2025PTC227766',
  'GST',
  '09AAMCC8947M1ZP',
  'AAMCC8947M',
  'MRTC07685G',
  'shreya23001@gmail.com',
  'crozent.com'
)
ON CONFLICT (currency_code) DO NOTHING;

COMMENT ON TABLE seller_entities IS
  'Issuing-entity details (legal name, address, tax number) per currency. Replaces hardcoded constants in invoice-print.tsx so updates do not require a code deploy.';
