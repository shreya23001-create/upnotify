-- Migration 96: Backfill noindex=true for Tier 3 permutation blog posts
-- =================================================================
-- Rationale: 929 pages flagged in Search Console as "Alternate page
-- with proper canonical tag" (Failed validation). Root cause: auto-
-- generated permutation comparison posts (AI-vs-AI, bank-vs-bank)
-- with thin / duplicate content.
--
-- Strategy from project_seo_audit_ranking.md:
--   "Tier 3 - Noindex (Remove From Index): Permutation-based comparisons,
--    duplicates without unique angle, thin content (< 500 words)."
--
-- Approach in this migration: REGEX matches on title or slug for the
-- AI-engine-permutation and bank-permutation patterns. Only auto-
-- generated posts (auto_generated=true) are touched, so any human-
-- authored "X vs Y" piece is preserved. The renderer + sitemap will
-- pick up the flag automatically.
--
-- Reversible: simply UPDATE noindex=false for any false positives.
-- Counts logged via the SELECT preview at the bottom for review.
-- =================================================================

-- AI-engine permutation comparisons.
-- 21 engines × 21 = 441 possible combos; matches "<engine> vs <engine>"
-- in title or slug, but only when auto_generated=true.
UPDATE public.blog_posts
SET noindex = true
WHERE auto_generated = true
  AND noindex = false
  AND (
    title ~* '\m(claude|chatgpt|mistral|anthropic|deepmind|openai|gemini|perplexity|grok|elevenlabs|jasper|cohere|copy\.?ai|groq|hugging\.?face|runway|civitai|character\.?ai|midjourney|poe|together\.?ai)\M\s+vs\s+\m(claude|chatgpt|mistral|anthropic|deepmind|openai|gemini|perplexity|grok|elevenlabs|jasper|cohere|copy\.?ai|groq|hugging\.?face|runway|civitai|character\.?ai|midjourney|poe|together\.?ai)\M'
    OR slug ~* '^(claude|chatgpt|mistral|anthropic|deepmind|openai|gemini|perplexity|grok|elevenlabs|jasper|cohere|copy-?ai|groq|hugging-?face|runway|civitai|character-?ai|midjourney|poe|together-?ai)-vs-(claude|chatgpt|mistral|anthropic|deepmind|openai|gemini|perplexity|grok|elevenlabs|jasper|cohere|copy-?ai|groq|hugging-?face|runway|civitai|character-?ai|midjourney|poe|together-?ai)'
  );

-- Bank permutation comparisons.
-- Auto-generated bank comparisons are similar thin-content territory.
UPDATE public.blog_posts
SET noindex = true
WHERE auto_generated = true
  AND noindex = false
  AND (
    title ~* '\m(amex|chase|capital\s*one|barclays|hsbc|natwest|lloyds|santander|axis\s*bank|charles\s*schwab|citi|citigroup|wells\s*fargo|monzo|starling|revolut|wise)\M\s+vs\s+\m(amex|chase|capital\s*one|barclays|hsbc|natwest|lloyds|santander|axis\s*bank|charles\s*schwab|citi|citigroup|wells\s*fargo|monzo|starling|revolut|wise)\M'
    OR slug ~* '^(amex|chase|capital-?one|barclays|hsbc|natwest|lloyds|santander|axis-?bank|charles-?schwab|citi|citigroup|wells-?fargo|monzo|starling|revolut|wise)-vs-(amex|chase|capital-?one|barclays|hsbc|natwest|lloyds|santander|axis-?bank|charles-?schwab|citi|citigroup|wells-?fargo|monzo|starling|revolut|wise)'
  );

-- "How to get cited by X" / "X cited me" auto-generated permutations
-- — same Tier 3 thin-content category.
UPDATE public.blog_posts
SET noindex = true
WHERE auto_generated = true
  AND noindex = false
  AND (
    slug ~* '^(how-to-get-cited-by|cited-by|get-cited-by)-(claude|chatgpt|mistral|anthropic|deepmind|openai|gemini|perplexity|grok|elevenlabs|cohere|together-?ai)$'
    OR title ~* '^how to get cited by (claude|chatgpt|mistral|anthropic|deepmind|openai|gemini|perplexity|grok|elevenlabs|cohere|together\.?ai)\M'
  );

-- Preview: how many posts were noindex'd by this migration?
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.blog_posts WHERE noindex = true;
  RAISE NOTICE 'Total blog_posts with noindex=true after migration: %', v_count;
END $$;
