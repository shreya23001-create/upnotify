/**
 * Citation check processor — shared logic used by both the API route
 * and the internal process-run endpoint.
 * Keeping it here avoids HTTP-to-self calls that die on Vercel serverless.
 */

import { acquireEngineKey, getActiveEngines } from '@/lib/db/ai-engines'
import {
  getCitationRunById, updateCitationRunStatus,
  saveCitationResults, type CitationSummary,
} from '@/lib/db/ai-visibility'
import { getUserById } from '@/lib/db/users'
import { sendCitationReportEmail } from '@/lib/services/email'
import { logger } from '@/lib/utils/logger'

// ---------------------------------------------------------------------------
// Engine query functions
// ---------------------------------------------------------------------------
async function queryPerplexity(apiKey: string, keyword: string, domain: string): Promise<{
  cited: boolean; confidence: 'high' | 'medium' | 'indicative'; responseText: string; sourceUrls: string[]
}> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: keyword }],
      return_citations: true,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Perplexity API error: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[]; citations?: string[] }
  const responseText = data.choices?.[0]?.message?.content ?? ''
  const sourceUrls   = (data.citations ?? []).filter((u): u is string => typeof u === 'string')
  const cited        = sourceUrls.some(u => u.includes(domain))
  return { cited, confidence: 'high', responseText: responseText.slice(0, 500), sourceUrls }
}

async function queryGenericLlm(
  apiKey: string, endpoint: string, model: string, keyword: string, domain: string,
): Promise<{ cited: boolean; confidence: 'high' | 'medium' | 'indicative'; responseText: string; sourceUrls: string[] }> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant. When you reference external sources, always mention the domain name explicitly.' },
        { role: 'user', content: keyword },
      ],
      max_tokens: 400,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`LLM API error: ${res.status} ${endpoint}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  const responseText = data.choices?.[0]?.message?.content ?? ''
  const cited = responseText.toLowerCase().includes(domain.toLowerCase())
  return { cited, confidence: 'medium', responseText: responseText.slice(0, 500), sourceUrls: [] }
}

async function queryExa(apiKey: string, keyword: string, domain: string): Promise<{
  cited: boolean; confidence: 'high' | 'medium' | 'indicative'; responseText: string; sourceUrls: string[]
}> {
  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: keyword, numResults: 10, contents: { text: { maxCharacters: 200 } } }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Exa API error: ${res.status}`)
  const data = await res.json() as { results: { url: string; title?: string }[] }
  const sourceUrls   = (data.results ?? []).map(r => r.url).filter(Boolean)
  const cited        = sourceUrls.some(u => u.toLowerCase().includes(domain.toLowerCase()))
  const responseText = (data.results ?? []).slice(0, 3).map(r => `${r.title ?? ''} — ${r.url}`).join('\n')
  return { cited, confidence: 'high', responseText: responseText.slice(0, 500), sourceUrls }
}

async function queryBingCopilot(apiKey: string, keyword: string, domain: string): Promise<{
  cited: boolean; confidence: 'high' | 'medium' | 'indicative'; responseText: string; sourceUrls: string[]
}> {
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(keyword)}&count=10`
  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Bing API error: ${res.status}`)
  const data = await res.json() as { webPages?: { value: { url: string; name: string }[] } }
  const sourceUrls   = (data.webPages?.value ?? []).map(r => r.url).filter(Boolean)
  const cited        = sourceUrls.some(u => u.toLowerCase().includes(domain.toLowerCase()))
  const responseText = (data.webPages?.value ?? []).slice(0, 3).map(r => `${r.name} — ${r.url}`).join('\n')
  return { cited, confidence: 'high', responseText: responseText.slice(0, 500), sourceUrls }
}

const ENGINE_QUERY_MAP: Record<string, (key: string, keyword: string, domain: string) => Promise<{
  cited: boolean; confidence: 'high' | 'medium' | 'indicative'; responseText: string; sourceUrls: string[]
}>> = {
  perplexity: (key, kw, domain) => queryPerplexity(key, kw, domain),
  chatgpt:    (key, kw, domain) => queryGenericLlm(key, 'https://api.openai.com/v1/chat/completions', 'gpt-4o-mini', kw, domain),
  claude:     (key, kw, domain) => queryGenericLlm(key, 'https://api.anthropic.com/v1/messages', 'claude-haiku-4-5-20251001', kw, domain),
  gemini:     (key, kw, domain) => queryGenericLlm(key, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', 'gemini-1.5-flash', kw, domain),
  grok:       (key, kw, domain) => queryGenericLlm(key, 'https://api.x.ai/v1/chat/completions', 'grok-beta', kw, domain),
  exa:        (key, kw, domain) => queryExa(key, kw, domain),
  copilot:    (key, kw, domain) => queryBingCopilot(key, kw, domain),
}

// ---------------------------------------------------------------------------
// Main processor — call this directly, no HTTP self-call needed
// ---------------------------------------------------------------------------
export async function processCitationRun(runId: string): Promise<{
  ok: boolean; score?: number; citedBy?: string[]; error?: string
}> {
  const run = await getCitationRunById(runId)
  if (!run) return { ok: false, error: 'Run not found.' }
  if (run.status !== 'pending') return { ok: true }

  await updateCitationRunStatus(runId, 'running')

  const allEngines = await getActiveEngines()
  const runEngines = allEngines.filter(e => run.engine_ids.includes(e.id))

  const results: Parameters<typeof saveCitationResults>[0] = []
  const citedBySlugs: string[]    = []
  const notCitedBySlugs: string[] = []

  for (const engine of runEngines) {
    const queryFn = ENGINE_QUERY_MAP[engine.slug]
    if (!queryFn) {
      logger.error('No query function for engine', { slug: engine.slug })
      continue
    }

    const apiKey = await acquireEngineKey(engine.id)
    if (!apiKey) {
      logger.error('No API key available', { engineId: engine.id, slug: engine.slug })
      continue
    }

    let engineCited = false
    for (const keyword of run.keywords) {
      try {
        const result = await queryFn(apiKey, keyword, run.domain)
        results.push({
          run_id: runId, engine_id: engine.id, keyword,
          cited: result.cited, confidence: result.confidence,
          response_text: result.responseText, source_urls: result.sourceUrls,
        })
        if (result.cited) engineCited = true
      } catch (err) {
        logger.error('Engine query failed', { engine: engine.slug, keyword, error: String(err) })
        results.push({
          run_id: runId, engine_id: engine.id, keyword,
          cited: null, confidence: null, response_text: `Error: ${String(err)}`, source_urls: [],
        })
      }
    }

    if (engineCited) citedBySlugs.push(engine.slug)
    else notCitedBySlugs.push(engine.slug)
  }

  if (results.length === 0) {
    await updateCitationRunStatus(
      runId, 'failed', undefined,
      'No API keys are configured for the selected engines. Add keys in Admin → AI Engines.',
    )
    return { ok: false, error: 'No engine keys available.' }
  }

  await saveCitationResults(results)

  const score = runEngines.length > 0 ? Math.round((citedBySlugs.length / runEngines.length) * 100) : 0
  const summary: CitationSummary = {
    cited_by:     citedBySlugs,
    not_cited_by: notCitedBySlugs,
    score,
    total_checks: results.length,
  }

  await updateCitationRunStatus(runId, 'complete', summary)

  // Email notification — non-blocking failure
  try {
    const user = await getUserById(run.user_id)
    if (user?.email) {
      await sendCitationReportEmail({
        to: user.email, domain: run.domain, score, citedBy: citedBySlugs,
        runUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ai-visibility/runs/${runId}`,
      })
    }
  } catch (err) {
    logger.error('Citation report email failed', { error: String(err), runId })
  }

  return { ok: true, score, citedBy: citedBySlugs }
}
