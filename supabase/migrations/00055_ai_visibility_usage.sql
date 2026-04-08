-- Migration 00055: AI Visibility — usage tracking
-- Tables: llms_txt_generations, citation_check_runs, citation_check_results

-- ---------------------------------------------------------------------------
-- llms_txt_generations — tracks per-org llms.txt generation (for plan limits)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.llms_txt_generations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organisations (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  domain      TEXT NOT NULL,
  engine_ids  UUID[] NOT NULL DEFAULT '{}',   -- which engines were selected
  content     TEXT NOT NULL,                   -- generated llms.txt content
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS llms_gen_org_idx        ON public.llms_txt_generations (org_id);
CREATE INDEX IF NOT EXISTS llms_gen_created_at_idx ON public.llms_txt_generations (org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- citation_check_runs — one run = one full check across selected engines
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citation_check_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organisations (id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  domain        TEXT NOT NULL,
  keywords      TEXT[] NOT NULL DEFAULT '{}',     -- queries sent to engines
  engine_ids    UUID[] NOT NULL DEFAULT '{}',      -- engines selected for this run
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  summary       JSONB,                             -- { cited_by: [...], not_cited_by: [...], score: n }
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS citation_runs_org_idx        ON public.citation_check_runs (org_id);
CREATE INDEX IF NOT EXISTS citation_runs_status_idx     ON public.citation_check_runs (status);
CREATE INDEX IF NOT EXISTS citation_runs_created_at_idx ON public.citation_check_runs (org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- citation_check_results — individual engine result within a run
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citation_check_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES public.citation_check_runs (id) ON DELETE CASCADE,
  engine_id       UUID NOT NULL REFERENCES public.ai_engines (id) ON DELETE CASCADE,
  keyword         TEXT NOT NULL,
  cited           BOOLEAN,                         -- null = inconclusive
  confidence      TEXT CHECK (confidence IN ('high', 'medium', 'indicative')),
  response_text   TEXT,                            -- snippet of AI response
  source_urls     TEXT[] DEFAULT '{}',             -- explicit URLs returned
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS citation_results_run_idx    ON public.citation_check_results (run_id);
CREATE INDEX IF NOT EXISTS citation_results_engine_idx ON public.citation_check_results (engine_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.llms_txt_generations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_check_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_check_results  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "llms_gen_own_org"
  ON public.llms_txt_generations FOR ALL
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "citation_runs_own_org"
  ON public.citation_check_runs FOR ALL
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "citation_results_own_org"
  ON public.citation_check_results FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM public.citation_check_runs
      WHERE org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1)
    )
  );
