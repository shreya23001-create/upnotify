import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

interface KeywordPositiveResult {
  keyword: string
  found: boolean
}

interface KeywordNegativeResult {
  keyword: string
  found: boolean
}

interface KeywordCheckMetadata {
  positiveResults: KeywordPositiveResult[]
  negativeResults: KeywordNegativeResult[]
  missingPositive: string[]
  foundNegative: string[]
}

/**
 * Normalise legacy config (single keyword string) into arrays.
 * Old monitors stored `config.keyword` as a string — treat it as a single positive keyword.
 */
function normaliseConfig(config: CheckerConfig): { positiveKeywords: string[]; negativeKeywords: string[] } {
  const rawPositive = config.positiveKeywords as string[] | undefined
  const rawNegative = config.negativeKeywords as string[] | undefined

  let positiveKeywords: string[] = []
  let negativeKeywords: string[] = []

  if (Array.isArray(rawPositive) && rawPositive.length > 0) {
    positiveKeywords = rawPositive.filter(k => k.trim().length > 0)
  } else if (config.keyword && typeof config.keyword === 'string') {
    // Legacy: single keyword as string
    const shouldExist = config.shouldExist !== false
    if (shouldExist) {
      positiveKeywords = [config.keyword]
    } else {
      negativeKeywords = [config.keyword]
    }
  }

  if (Array.isArray(rawNegative) && rawNegative.length > 0) {
    negativeKeywords = [...negativeKeywords, ...rawNegative.filter(k => k.trim().length > 0)]
  }

  return { positiveKeywords, negativeKeywords }
}

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const config = monitor.config as CheckerConfig
  const { positiveKeywords, negativeKeywords } = normaliseConfig(config)
  const start = Date.now()

  if (positiveKeywords.length === 0 && negativeKeywords.length === 0) {
    return { status: 'down', errorMessage: 'No keywords configured' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(monitor.target, {
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)
    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      return {
        status: 'down',
        responseTimeMs,
        statusCode: response.status,
        errorMessage: `HTTP ${response.status}`,
      }
    }

    const body = await response.text()
    const bodyLower = body.toLowerCase()

    // Check positive keywords — ALL must be present
    const positiveResults: KeywordPositiveResult[] = positiveKeywords.map(keyword => ({
      keyword,
      found: bodyLower.includes(keyword.toLowerCase()),
    }))

    // Check negative keywords — NONE should be present
    const negativeResults: KeywordNegativeResult[] = negativeKeywords.map(keyword => ({
      keyword,
      found: bodyLower.includes(keyword.toLowerCase()),
    }))

    const missingPositive = positiveResults.filter(r => !r.found).map(r => r.keyword)
    const foundNegative = negativeResults.filter(r => r.found).map(r => r.keyword)

    const metadata: Record<string, unknown> = {
      positiveResults,
      negativeResults,
      missingPositive,
      foundNegative,
    }

    // DOWN: any positive keyword missing OR any negative keyword found
    if (missingPositive.length > 0 || foundNegative.length > 0) {
      const errorParts: string[] = []
      if (missingPositive.length > 0) {
        errorParts.push(`Missing: ${missingPositive.map(k => `'${k}'`).join(', ')}`)
      }
      if (foundNegative.length > 0) {
        errorParts.push(`Found: ${foundNegative.map(k => `'${k}'`).join(', ')}`)
      }

      return {
        status: 'down',
        responseTimeMs,
        errorMessage: errorParts.join('. '),
        metadata,
      }
    }

    // UP: all positive found and no negative found
    return {
      status: 'up',
      responseTimeMs,
      metadata,
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Failed to check keywords',
    }
  }
}
