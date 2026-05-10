/**
 * Per-engine API key validity tester.
 *
 * Used by the admin "Test" button next to each AI engine key. Makes a
 * minimal real call to the provider so the test catches:
 *   1. Bad / expired / revoked API key (provider returns 401)
 *   2. Wrong model_id configured in admin (provider returns 400/404)
 *   3. Auth header shape bugs (Anthropic-vs-OpenAI confusion)
 *   4. Provider downtime / network issues
 *
 * Each tester uses the SAME request shape the citation processor uses,
 * so a green test means a real citation run will also authenticate. If
 * a tester here drifts from citation-processor.ts, the test will say
 * "OK" while production keeps failing — keep them in sync.
 *
 * Test cost: ~1 token of completion (or one search result). Sub-cent
 * per click for every provider.
 */

import type { AiEngine } from '@/lib/db/ai-engines'
import { logger } from '@/lib/utils/logger'

export interface KeyTestResult {
  ok:          boolean
  statusCode:  number | null
  message:     string
  latencyMs:   number
}

const TIMEOUT_MS = 8000

async function readBody(res: Response): Promise<string> {
  try {
    const text = await res.text()
    return text.slice(0, 300)
  } catch { return '' }
}

function ok(latencyMs: number, status = 200): KeyTestResult {
  return { ok: true, statusCode: status, message: 'Key authenticated successfully.', latencyMs }
}

function fail(status: number | null, message: string, latencyMs: number): KeyTestResult {
  return { ok: false, statusCode: status, message, latencyMs }
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; latencyMs: number }> {
  const start = Date.now()
  const value = await fn()
  return { value, latencyMs: Date.now() - start }
}

// ---------------------------------------------------------------------------
// Per-provider testers — each mirrors the corresponding citation-processor
// query function shape, but with max_tokens=1 / single result.
// ---------------------------------------------------------------------------

async function testAnthropic(apiKey: string, model: string): Promise<KeyTestResult> {
  try {
    const { value: res, latencyMs } = await timed(() => fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }))
    if (res.ok) return ok(latencyMs, res.status)
    return fail(res.status, `${res.statusText}: ${await readBody(res)}`, latencyMs)
  } catch (err) {
    return fail(null, `Network/timeout: ${String(err)}`, 0)
  }
}

async function testOpenAiCompat(apiKey: string, endpoint: string, model: string): Promise<KeyTestResult> {
  try {
    const { value: res, latencyMs } = await timed(() => fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }))
    if (res.ok) return ok(latencyMs, res.status)
    return fail(res.status, `${res.statusText}: ${await readBody(res)}`, latencyMs)
  } catch (err) {
    return fail(null, `Network/timeout: ${String(err)}`, 0)
  }
}

async function testPerplexity(apiKey: string, model: string): Promise<KeyTestResult> {
  try {
    const { value: res, latencyMs } = await timed(() => fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }))
    if (res.ok) return ok(latencyMs, res.status)
    return fail(res.status, `${res.statusText}: ${await readBody(res)}`, latencyMs)
  } catch (err) {
    return fail(null, `Network/timeout: ${String(err)}`, 0)
  }
}

async function testExa(apiKey: string): Promise<KeyTestResult> {
  try {
    const { value: res, latencyMs } = await timed(() => fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'test', numResults: 1 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }))
    if (res.ok) return ok(latencyMs, res.status)
    return fail(res.status, `${res.statusText}: ${await readBody(res)}`, latencyMs)
  } catch (err) {
    return fail(null, `Network/timeout: ${String(err)}`, 0)
  }
}

async function testBingCopilot(apiKey: string): Promise<KeyTestResult> {
  try {
    const { value: res, latencyMs } = await timed(() => fetch(
      'https://api.bing.microsoft.com/v7.0/search?q=test&count=1',
      {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    ))
    if (res.ok) return ok(latencyMs, res.status)
    return fail(res.status, `${res.statusText}: ${await readBody(res)}`, latencyMs)
  } catch (err) {
    return fail(null, `Network/timeout: ${String(err)}`, 0)
  }
}

// ---------------------------------------------------------------------------
// Public entry point — dispatch by engine slug
// ---------------------------------------------------------------------------

export async function testEngineKey(
  engineSlug: string,
  apiKey: string,
  modelId: string | null,
): Promise<KeyTestResult> {
  const result = await dispatch(engineSlug, apiKey, modelId)
  logger.info('Engine key test', {
    slug: engineSlug, ok: result.ok, statusCode: result.statusCode, latencyMs: result.latencyMs,
  })
  return result
}

async function dispatch(slug: string, apiKey: string, modelId: string | null): Promise<KeyTestResult> {
  // Engines that need a model_id: bail clearly if it's missing rather than
  // sending an empty string and getting a confusing 400 back.
  const needsModel = ['claude', 'chatgpt', 'gemini', 'grok', 'perplexity'].includes(slug)
  if (needsModel && !modelId) {
    return {
      ok: false,
      statusCode: null,
      message: 'No model_id configured for this engine. Set it in /admin/ai-engines/[id]/edit.',
      latencyMs: 0,
    }
  }

  switch (slug) {
    case 'claude':     return testAnthropic(apiKey, modelId as string)
    case 'chatgpt':    return testOpenAiCompat(apiKey, 'https://api.openai.com/v1/chat/completions', modelId as string)
    case 'gemini':     return testOpenAiCompat(apiKey, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', modelId as string)
    case 'grok':       return testOpenAiCompat(apiKey, 'https://api.x.ai/v1/chat/completions', modelId as string)
    case 'perplexity': return testPerplexity(apiKey, modelId as string)
    case 'exa':        return testExa(apiKey)
    case 'copilot':    return testBingCopilot(apiKey)
    default:
      return {
        ok: false,
        statusCode: null,
        message: `No tester defined for engine "${slug}". Add one in lib/services/engine-tester.ts.`,
        latencyMs: 0,
      }
  }
}

// Convenience wrapper for callers that already have the engine row.
export function testEngineKeyForEngine(engine: AiEngine, apiKey: string): Promise<KeyTestResult> {
  return testEngineKey(engine.slug, apiKey, engine.model_id)
}
