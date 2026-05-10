/**
 * AI Profile introspector — runs admin-managed introspection prompts against
 * the user's active AI engines and captures responses. Inverse of citation
 * tracking: instead of "do AIs cite me for X?", asks "what do AIs say
 * about my site?"
 *
 * Reuses the same per-engine query functions as citation-processor via
 * the shared `runEngineQuery` dispatcher — same auth shapes, same model
 * IDs (engine.model_id), same provider quirks. So a working citation
 * engine is a working profile engine.
 */

import { acquireEngineKey, getActiveEngines } from '@/lib/db/ai-engines'
import {
  getProfileRunById, updateProfileRunStatus,
  getActiveProfilePrompts,
  type ProfileResult, type ProfileSummary,
} from '@/lib/db/ai-profile'
import { runEngineQuery } from '@/lib/services/citation-processor'
import { logger } from '@/lib/utils/logger'

const DOMAIN_PLACEHOLDER = '{domain}'

// Substitute {domain} placeholder in a prompt template. Performs a global
// replace so prompts can reference the domain multiple times if useful.
export function substituteDomain(template: string, domain: string): string {
  return template.split(DOMAIN_PLACEHOLDER).join(domain)
}

export async function processProfileRun(runId: string): Promise<{
  ok: boolean; recognisedBy?: string[]; error?: string
}> {
  const run = await getProfileRunById(runId)
  if (!run) return { ok: false, error: 'Run not found.' }
  if (run.status !== 'pending') return { ok: true }

  await updateProfileRunStatus(runId, 'running')

  // Pull active engines, filter to the ones the user selected for this run
  const allEngines = await getActiveEngines()
  const runEngines = allEngines.filter(e => run.engine_ids.includes(e.id))

  // Pull active prompts (snapshot at run time — admin can change them later
  // without affecting the recorded results since we store the substituted
  // prompt_text on each result row).
  const allPrompts = await getActiveProfilePrompts()
  const runPrompts = run.prompt_ids.length > 0
    ? allPrompts.filter(p => run.prompt_ids.includes(p.id))
    : allPrompts // empty prompt_ids on the run = "use whatever's active now"

  if (runEngines.length === 0 || runPrompts.length === 0) {
    await updateProfileRunStatus(runId, 'failed', {
      error_message: runEngines.length === 0
        ? 'No active engines available for this run.'
        : 'No active prompts configured. Add prompts in Admin → AI Profile Prompts.',
    })
    return { ok: false, error: 'No engines or prompts available.' }
  }

  // Acquire keys for each engine up front (one decryption per engine instead
  // of one per prompt × engine). If a key is missing, that engine is skipped
  // for the entire run.
  const keysByEngine = new Map<string, string>()
  for (const engine of runEngines) {
    const key = await acquireEngineKey(engine.id)
    if (!key) {
      logger.error('processProfileRun: no key for engine', { engineId: engine.id, slug: engine.slug })
      continue
    }
    keysByEngine.set(engine.id, key)
  }

  if (keysByEngine.size === 0) {
    await updateProfileRunStatus(runId, 'failed', {
      error_message: 'No API keys configured for the selected engines. Add keys in Admin → AI Engines.',
    })
    return { ok: false, error: 'No engine keys available.' }
  }

  // Run prompt × engine sequentially per engine to respect provider rate
  // limits (Gemini free tier in particular is stingy). Engines run in
  // parallel so the slowest engine doesn't block the others.
  const results: ProfileResult[] = []
  const recognisedSet: Set<string> = new Set()    // engine slugs that mentioned the domain in any answer
  const querySet:      Set<string> = new Set()    // engine slugs that produced any answer

  await Promise.all(runEngines.map(async engine => {
    const apiKey = keysByEngine.get(engine.id)
    if (!apiKey) return

    for (const prompt of runPrompts) {
      const promptText = substituteDomain(prompt.prompt_text, run.domain)
      try {
        const queryResult = await runEngineQuery(engine, apiKey, promptText, run.domain)
        if (!queryResult) {
          // No dispatcher for this engine slug — record explicit error
          results.push({
            prompt_id:     prompt.id,
            engine_id:     engine.id,
            prompt_text:   promptText,
            response_text: '',
            recognised:    false,
            error:         `No query function configured for engine "${engine.slug}".`,
          })
          continue
        }
        // queryResult.cited reuses the citation logic — for profile mode
        // it correctly means "response or source URLs mention the domain".
        const recognised = queryResult.cited
        results.push({
          prompt_id:     prompt.id,
          engine_id:     engine.id,
          prompt_text:   promptText,
          response_text: queryResult.responseText,
          recognised,
          error:         null,
        })
        querySet.add(engine.slug)
        if (recognised) recognisedSet.add(engine.slug)
      } catch (err) {
        logger.error('processProfileRun: query failed', {
          engine: engine.slug, prompt_id: prompt.id, error: String(err),
        })
        results.push({
          prompt_id:     prompt.id,
          engine_id:     engine.id,
          prompt_text:   promptText,
          response_text: '',
          recognised:    false,
          error:         String(err),
        })
      }
    }
  }))

  const summary: ProfileSummary = {
    recognised_by:     [...recognisedSet],
    not_recognised_by: runEngines.map(e => e.slug).filter(s => !recognisedSet.has(s)),
    total_responses:   results.length,
    failed_responses:  results.filter(r => r.error !== null).length,
  }

  await updateProfileRunStatus(runId, 'complete', { results, summary })

  return { ok: true, recognisedBy: summary.recognised_by }
}

// Re-export for the unit test (avoids round-tripping through the runner)
export type { ProfileResult, ProfileSummary }
