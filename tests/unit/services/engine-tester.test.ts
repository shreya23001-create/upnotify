import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { testEngineKey } from '@/lib/services/engine-tester'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function okResponse(body: object = { ok: true }): Response {
  return {
    ok:         true,
    status:     200,
    statusText: 'OK',
    text:       () => Promise.resolve(JSON.stringify(body)),
    json:       () => Promise.resolve(body),
  } as unknown as Response
}

function failResponse(status: number, body = 'invalid api key'): Response {
  return {
    ok:         false,
    status,
    statusText: status === 401 ? 'Unauthorized' : 'Bad Request',
    text:       () => Promise.resolve(body),
    json:       () => Promise.resolve({ error: body }),
  } as unknown as Response
}

interface FetchCall {
  url: string
  init: RequestInit
}

function lastCall(): FetchCall {
  const args = mockFetch.mock.calls.at(-1) as [string, RequestInit] | undefined
  if (!args) throw new Error('fetch was not called')
  return { url: args[0], init: args[1] }
}

function headerOf(init: RequestInit, name: string): string | undefined {
  const h = init.headers as Record<string, string> | undefined
  if (!h) return undefined
  // Case-insensitive lookup
  const found = Object.entries(h).find(([k]) => k.toLowerCase() === name.toLowerCase())
  return found?.[1]
}

function bodyOf(init: RequestInit): Record<string, unknown> {
  return JSON.parse(String(init.body))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('testEngineKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Anthropic — the bug fix this whole test exists to catch
  // -------------------------------------------------------------------------
  describe('claude (Anthropic)', () => {
    it('uses x-api-key header, NOT Authorization Bearer', async () => {
      mockFetch.mockResolvedValue(okResponse({ content: [{ type: 'text', text: 'hi' }] }))

      await testEngineKey('claude', 'sk-ant-test', 'claude-haiku-4-5-20251001')

      const { init } = lastCall()
      expect(headerOf(init, 'x-api-key')).toBe('sk-ant-test')
      expect(headerOf(init, 'authorization')).toBeUndefined()
    })

    it('includes anthropic-version header', async () => {
      mockFetch.mockResolvedValue(okResponse({ content: [] }))

      await testEngineKey('claude', 'sk-ant-test', 'claude-haiku-4-5-20251001')

      expect(headerOf(lastCall().init, 'anthropic-version')).toBe('2023-06-01')
    })

    it('puts system prompt at top level, not in messages array', async () => {
      mockFetch.mockResolvedValue(okResponse({ content: [] }))

      await testEngineKey('claude', 'sk-ant-test', 'claude-haiku-4-5-20251001')

      const body = bodyOf(lastCall().init)
      expect(body.system).toBeUndefined() // tester does not send system, just user message
      const messages = body.messages as { role: string }[]
      expect(messages.every(m => m.role !== 'system')).toBe(true)
    })

    it('targets the Anthropic Messages endpoint', async () => {
      mockFetch.mockResolvedValue(okResponse({ content: [] }))

      await testEngineKey('claude', 'sk-ant-test', 'claude-haiku-4-5-20251001')

      expect(lastCall().url).toBe('https://api.anthropic.com/v1/messages')
    })

    it('passes the configured model through to the request body', async () => {
      mockFetch.mockResolvedValue(okResponse({ content: [] }))

      await testEngineKey('claude', 'sk-ant-test', 'claude-opus-4-7')

      expect(bodyOf(lastCall().init).model).toBe('claude-opus-4-7')
    })

    it('reports failure with status code and response body when 401', async () => {
      mockFetch.mockResolvedValue(failResponse(401, '{"type":"authentication_error","message":"invalid x-api-key"}'))

      const result = await testEngineKey('claude', 'wrong-key', 'claude-haiku-4-5-20251001')

      expect(result.ok).toBe(false)
      expect(result.statusCode).toBe(401)
      expect(result.message).toContain('invalid x-api-key')
    })
  })

  // -------------------------------------------------------------------------
  // OpenAI-shape providers
  // -------------------------------------------------------------------------
  describe('chatgpt (OpenAI)', () => {
    it('uses Authorization Bearer header', async () => {
      mockFetch.mockResolvedValue(okResponse())

      await testEngineKey('chatgpt', 'sk-openai-test', 'gpt-4o-mini')

      expect(headerOf(lastCall().init, 'authorization')).toBe('Bearer sk-openai-test')
      expect(headerOf(lastCall().init, 'x-api-key')).toBeUndefined()
    })

    it('targets OpenAI chat completions endpoint', async () => {
      mockFetch.mockResolvedValue(okResponse())
      await testEngineKey('chatgpt', 'k', 'gpt-4o-mini')
      expect(lastCall().url).toBe('https://api.openai.com/v1/chat/completions')
    })
  })

  describe('gemini (Google OpenAI-compat)', () => {
    it('targets the Gemini OpenAI-compat endpoint', async () => {
      mockFetch.mockResolvedValue(okResponse())
      await testEngineKey('gemini', 'k', 'gemini-2.0-flash')
      expect(lastCall().url).toBe('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions')
    })

    it('passes the configured model through (no hardcoded gemini-1.5-flash)', async () => {
      mockFetch.mockResolvedValue(okResponse())
      await testEngineKey('gemini', 'k', 'gemini-2.0-flash')
      expect(bodyOf(lastCall().init).model).toBe('gemini-2.0-flash')
    })
  })

  describe('grok (xAI)', () => {
    it('targets the xAI chat completions endpoint', async () => {
      mockFetch.mockResolvedValue(okResponse())
      await testEngineKey('grok', 'k', 'grok-2-1212')
      expect(lastCall().url).toBe('https://api.x.ai/v1/chat/completions')
    })

    it('passes the configured model through (no hardcoded grok-beta)', async () => {
      mockFetch.mockResolvedValue(okResponse())
      await testEngineKey('grok', 'k', 'grok-2-1212')
      expect(bodyOf(lastCall().init).model).toBe('grok-2-1212')
    })
  })

  // -------------------------------------------------------------------------
  // Perplexity
  // -------------------------------------------------------------------------
  describe('perplexity', () => {
    it('uses Authorization Bearer header', async () => {
      mockFetch.mockResolvedValue(okResponse())
      await testEngineKey('perplexity', 'pplx-key', 'sonar')
      expect(headerOf(lastCall().init, 'authorization')).toBe('Bearer pplx-key')
    })

    it('targets the Perplexity chat completions endpoint', async () => {
      mockFetch.mockResolvedValue(okResponse())
      await testEngineKey('perplexity', 'k', 'sonar')
      expect(lastCall().url).toBe('https://api.perplexity.ai/chat/completions')
    })
  })

  // -------------------------------------------------------------------------
  // Search engines (no model_id required)
  // -------------------------------------------------------------------------
  describe('exa (search)', () => {
    it('uses x-api-key header', async () => {
      mockFetch.mockResolvedValue(okResponse({ results: [] }))
      await testEngineKey('exa', 'exa-key', null)
      expect(headerOf(lastCall().init, 'x-api-key')).toBe('exa-key')
    })

    it('targets Exa search endpoint', async () => {
      mockFetch.mockResolvedValue(okResponse({ results: [] }))
      await testEngineKey('exa', 'k', null)
      expect(lastCall().url).toBe('https://api.exa.ai/search')
    })

    it('does not require a model_id', async () => {
      mockFetch.mockResolvedValue(okResponse({ results: [] }))
      const result = await testEngineKey('exa', 'k', null)
      expect(result.ok).toBe(true)
    })
  })

  describe('copilot (Bing)', () => {
    it('uses Ocp-Apim-Subscription-Key header', async () => {
      mockFetch.mockResolvedValue(okResponse({ webPages: { value: [] } }))
      await testEngineKey('copilot', 'bing-key', null)
      expect(headerOf(lastCall().init, 'Ocp-Apim-Subscription-Key')).toBe('bing-key')
    })
  })

  // -------------------------------------------------------------------------
  // Error / edge cases
  // -------------------------------------------------------------------------
  describe('missing model_id for LLM engines', () => {
    it('returns clear error without making a network call', async () => {
      const result = await testEngineKey('claude', 'sk-ant', null)
      expect(result.ok).toBe(false)
      expect(result.message).toMatch(/model_id/i)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('unknown engine slug', () => {
    it('returns clear error without making a network call', async () => {
      const result = await testEngineKey('made-up-engine', 'k', 'm')
      expect(result.ok).toBe(false)
      expect(result.message).toMatch(/no tester/i)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('network/timeout error', () => {
    it('returns ok=false with null status code', async () => {
      mockFetch.mockRejectedValue(new Error('AbortError: timed out'))
      const result = await testEngineKey('chatgpt', 'k', 'gpt-4o-mini')
      expect(result.ok).toBe(false)
      expect(result.statusCode).toBeNull()
      expect(result.message).toContain('Network')
    })
  })
})
