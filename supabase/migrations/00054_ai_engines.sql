-- Migration 00054: AI Visibility — engine registry and key pool
-- Tables: ai_engines, ai_engine_keys
-- Admin-managed. Users never see API keys. Keys encrypted at application layer.

-- ---------------------------------------------------------------------------
-- ai_engines — registry of AI engines (Perplexity, ChatGPT, Claude, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_engines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                          -- "Perplexity"
  slug            TEXT NOT NULL UNIQUE,                   -- "perplexity"
  description     TEXT NOT NULL DEFAULT '',
  logo_url        TEXT,
  type            TEXT NOT NULL DEFAULT 'both'
                  CHECK (type IN ('llms_txt', 'citation', 'both')),
  is_free         BOOLEAN NOT NULL DEFAULT false,         -- free users can access
  is_active       BOOLEAN NOT NULL DEFAULT true,          -- admin on/off toggle
  signal_quality  TEXT NOT NULL DEFAULT 'medium'
                  CHECK (signal_quality IN ('high', 'medium', 'indicative')),
  signal_note     TEXT NOT NULL DEFAULT '',               -- shown to users e.g. "Returns explicit citation URLs"
  sort_order      INTEGER NOT NULL DEFAULT 0,
  admin_notes     TEXT,                                   -- internal only
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_engines_slug_idx      ON public.ai_engines (slug);
CREATE INDEX IF NOT EXISTS ai_engines_is_active_idx ON public.ai_engines (is_active);
CREATE INDEX IF NOT EXISTS ai_engines_type_idx      ON public.ai_engines (type);

-- ---------------------------------------------------------------------------
-- ai_engine_keys — key pool per engine (multiple keys for quota rotation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_engine_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id       UUID NOT NULL REFERENCES public.ai_engines (id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'Key 1',          -- admin label e.g. "Account 2"
  encrypted_key   TEXT NOT NULL,                          -- AES-256-GCM encrypted
  key_iv          TEXT NOT NULL,                          -- encryption IV (hex)
  key_tag         TEXT NOT NULL,                          -- GCM auth tag (hex)
  monthly_limit   INTEGER NOT NULL DEFAULT 1000,
  current_usage   INTEGER NOT NULL DEFAULT 0,
  reset_date      TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_engine_keys_engine_idx    ON public.ai_engine_keys (engine_id);
CREATE INDEX IF NOT EXISTS ai_engine_keys_active_idx    ON public.ai_engine_keys (engine_id, is_active);

-- ---------------------------------------------------------------------------
-- RLS — admin read/write only via service role. No user access.
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_engines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_engine_keys ENABLE ROW LEVEL SECURITY;

-- Engines are readable by authenticated users (names/descriptions only — not keys)
CREATE POLICY "ai_engines_read_authenticated"
  ON public.ai_engines FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Keys: no user access — service role only (API routes use admin client)
-- No SELECT policy on ai_engine_keys = blocked for all authenticated users

-- ---------------------------------------------------------------------------
-- Seed default engines
-- ---------------------------------------------------------------------------
INSERT INTO public.ai_engines (name, slug, description, type, is_free, signal_quality, signal_note, sort_order)
VALUES
  ('Perplexity',       'perplexity', 'Returns explicit source URLs with every answer — highest citation traffic potential.',    'both',     false, 'high',       'Explicit citation URL returned with each response.',          1),
  ('ChatGPT',          'chatgpt',    'Most widely used AI assistant. Citation format varies by query.',                         'both',     false, 'medium',     'Domain mentioned in response — not always an explicit URL.',   2),
  ('Claude',           'claude',     'Anthropic Claude. References content from training data and web grounding.',              'both',     false, 'medium',     'Domain referenced in response based on indexed content.',      3),
  ('Gemini',           'gemini',     'Powers Google AI Overviews. Strong E-E-A-T and structured data signals.',                 'both',     false, 'medium',     'Domain mentioned in response — optimise for structured data.',  4),
  ('Bing Copilot',     'copilot',    'Microsoft Copilot powered by Bing. Returns source links in responses.',                   'both',     true,  'high',       'Source links returned — free tier via Bing Search API.',       5),
  ('Grok',             'grok',       'xAI Grok. Values recent, factual content indexed from the web.',                         'both',     false, 'medium',     'Domain mentioned in response — values up-to-date content.',    6),
  ('Exa',              'exa',        'Semantic AI search engine. Returns exact source URLs.',                                   'citation', true,  'high',       'Exact source URLs returned — free tier available.',            7)
ON CONFLICT (slug) DO NOTHING;
