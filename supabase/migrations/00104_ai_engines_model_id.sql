-- Migration 104: Add model_id column to ai_engines
-- =================================================================
-- Makes per-engine model selection admin-configurable. Previously the
-- model name was hardcoded in lib/services/citation-processor.ts:
-- when xAI retired `grok-beta` and Google deprecated `gemini-1.5-flash`,
-- citation runs silently 400/404'd until a code deploy went out.
--
-- After this migration, admin can update the model ID for any engine
-- from the AI Engines edit page without a code change. The citation
-- processor and the engine key tester both read engine.model_id at
-- runtime.
--
-- Search-only engines (exa, copilot — Bing) do not take a model
-- parameter. Their model_id stays NULL.
-- =================================================================

ALTER TABLE public.ai_engines
  ADD COLUMN IF NOT EXISTS model_id TEXT;

COMMENT ON COLUMN public.ai_engines.model_id IS
  'Provider-side model identifier (e.g. claude-haiku-4-5-20251001, gpt-4o-mini). NULL for search-only engines (exa, copilot). Admin-editable so model rotations do not require a code deploy.';

-- Backfill cheap/fast defaults per provider as of 2026-05-10.
-- Admin can change these any time from /admin/ai-engines/[id]/edit.
UPDATE public.ai_engines SET model_id = 'claude-haiku-4-5-20251001' WHERE slug = 'claude'     AND model_id IS NULL;
UPDATE public.ai_engines SET model_id = 'gpt-4o-mini'              WHERE slug = 'chatgpt'    AND model_id IS NULL;
UPDATE public.ai_engines SET model_id = 'gemini-2.0-flash'         WHERE slug = 'gemini'     AND model_id IS NULL;
UPDATE public.ai_engines SET model_id = 'grok-2-1212'              WHERE slug = 'grok'       AND model_id IS NULL;
UPDATE public.ai_engines SET model_id = 'sonar'                    WHERE slug = 'perplexity' AND model_id IS NULL;
