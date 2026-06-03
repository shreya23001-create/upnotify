-- Migration 105: AI Profile feature — introspection runs and editable prompts
-- =================================================================
-- Adds two tables for the new "AI Profile" feature on AI Visibility:
--
--   1. ai_profile_prompts — admin-managed library of introspection
--      prompts. Each prompt may include the placeholder {domain},
--      which the introspector substitutes at run time. Seeded with 5
--      defaults; admin can add/edit/disable from /admin/ai-profile-prompts.
--
--   2. ai_profile_runs — one row per profile run. Stores the responses
--      from each (prompt × engine) combination as a JSONB array. Mirrors
--      the citation_check_runs design but simpler — there's no separate
--      results table because individual responses are not queried by ID.
--
-- Quota note (per Boss 2026-05-10): a profile run consumes one slot of
-- the existing `plans.citation_check_monthly_limit`. The combined count
-- (citation_check_runs + ai_profile_runs created this calendar month)
-- is what `canRunAiVisibilityCheck()` checks against the limit. The
-- column name in plans stays as-is for now to avoid touching every
-- billing/admin reference; semantics evolve to "AI Visibility runs/mo".
-- =================================================================

-- ---------------------------------------------------------------------------
-- ai_profile_prompts — admin-managed prompt library
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_profile_prompts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text  TEXT NOT NULL,                        -- may contain {domain} placeholder
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  admin_notes  TEXT,                                 -- internal-only context
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_profile_prompts_active_idx
  ON public.ai_profile_prompts (is_active, sort_order);

COMMENT ON COLUMN public.ai_profile_prompts.prompt_text IS
  'Introspection prompt sent to AI engines. The literal placeholder {domain} is substituted with the run target at execution time.';

-- ---------------------------------------------------------------------------
-- ai_profile_runs — one run = N prompts × M engines, results as JSONB
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_profile_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organisations (id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  domain         TEXT NOT NULL,
  engine_ids     UUID[] NOT NULL DEFAULT '{}',
  prompt_ids     UUID[] NOT NULL DEFAULT '{}',           -- snapshot of which prompts ran
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  -- results: array of { prompt_id, engine_id, prompt_text, response_text, recognised, error }
  -- recognised = engine returned a substantive response that mentioned the domain or its category
  results        JSONB NOT NULL DEFAULT '[]',
  -- summary: { recognised_by: [engine_slug], not_recognised_by: [engine_slug], total: n }
  summary        JSONB,
  error_message  TEXT,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_profile_runs_org_idx
  ON public.ai_profile_runs (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_profile_runs_status_idx
  ON public.ai_profile_runs (status);

-- ---------------------------------------------------------------------------
-- RLS — same shape as citation_check_runs
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_profile_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_profile_prompts ENABLE ROW LEVEL SECURITY;

-- Profile runs: users see only their own org's runs
CREATE POLICY "ai_profile_runs_own_org"
  ON public.ai_profile_runs FOR ALL
  USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1));

-- Prompts: any authenticated user can read active prompts (so introspector
-- works for their org). Writes are admin-only via service role.
CREATE POLICY "ai_profile_prompts_read_active"
  ON public.ai_profile_prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ---------------------------------------------------------------------------
-- Seed default prompts — admin can edit/disable/add more in admin UI
-- ---------------------------------------------------------------------------
INSERT INTO public.ai_profile_prompts (prompt_text, sort_order, admin_notes) VALUES
  ('What is {domain}?',                                                    1, 'Baseline awareness check — does the AI know the site exists?'),
  ('Who is {domain} for?',                                                 2, 'Audience / customer-fit perception'),
  ('What does {domain} do best?',                                          3, 'Differentiator / strength perception'),
  ('When would you recommend {domain} over similar sites?',                4, 'Competitive positioning'),
  ('What category or industry does {domain} belong to?',                   5, 'Category placement — surfaces miscategorisations')
ON CONFLICT DO NOTHING;
