/**
 * Competitor domain checker.
 * Called directly from the competitor-checks cron — not via dispatchChecker().
 *
 * Checks performed on every run:
 *  1. HTTP reachability + status code
 *  2. Response time
 *  3. Maintenance keyword detection (marks as 'degraded', cause: maintenance)
 *  4. Error keyword detection (marks as 'degraded', cause: error_page)
 *
 * Content is NOT stored — only metadata (status, timing, keyword name).
 * Harvey review: GREEN. See migration 00048 for legal notes.
 */

const TIMEOUT_MS = 10_000

// Keywords checked in the first 8KB of response body (lowercase).
// Kept conservative — only phrases that strongly indicate maintenance/error state.
const MAINTENANCE_KEYWORDS = [
  'under maintenance',
  'scheduled maintenance',
  'planned maintenance',
  'site maintenance',
  'temporarily unavailable',
  'temporarily down',
  "we'll be back",
  'we will be back',
  'back soon',
  'coming back soon',
  'down for maintenance',
  'in maintenance mode',
  'maintenance window',
  'site is currently down',
  'service is temporarily',
]

const ERROR_KEYWORDS = [
  'internal server error',
  'service unavailable',
  'bad gateway',
  'gateway timeout',
  'application error',
  '500 - internal',
  '502 - bad',
  '503 - service',
  '504 - gateway',
  'fatal error',
  'an unexpected error',
]

export interface CompetitorCheckResult {
  status: 'up' | 'down' | 'degraded'
  responseTimeMs: number
  statusCode?: number
  errorMessage?: string
  keywordMatched?: string
  keywordCategory?: 'maintenance' | 'error'
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Legacy adapter — keeps checker.ts dispatchChecker() working for 'competitor' monitor type.
 * The cron uses checkCompetitorDomain() directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function check(monitor: any): Promise<CompetitorCheckResult> {
  return checkCompetitorDomain(
    String(monitor.target ?? monitor.domain ?? ''),
    true
  )
}

export async function checkCompetitorDomain(
  domain: string,
  keywordsEnabled = true
): Promise<CompetitorCheckResult> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`
  const start = Date.now()

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    })

    const responseTimeMs = Date.now() - start

    // Hard down: 4xx/5xx
    if (!response.ok) {
      return {
        status: 'down',
        responseTimeMs,
        statusCode: response.status,
        errorMessage: `HTTP ${response.status}`,
      }
    }

    // Keyword detection — only scan first 8KB to keep it fast
    if (keywordsEnabled) {
      const body = await response.text()
      const snippet = body.toLowerCase().slice(0, 8192)

      const maintenanceHit = MAINTENANCE_KEYWORDS.find(kw => snippet.includes(kw))
      if (maintenanceHit) {
        return {
          status: 'degraded',
          responseTimeMs,
          statusCode: response.status,
          keywordMatched: maintenanceHit,
          keywordCategory: 'maintenance',
          errorMessage: `Maintenance detected: "${maintenanceHit}"`,
        }
      }

      const errorHit = ERROR_KEYWORDS.find(kw => snippet.includes(kw))
      if (errorHit) {
        return {
          status: 'degraded',
          responseTimeMs,
          statusCode: response.status,
          keywordMatched: errorHit,
          keywordCategory: 'error',
          errorMessage: `Error page detected: "${errorHit}"`,
        }
      }
    }

    return {
      status: 'up',
      responseTimeMs,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Failed to reach domain',
    }
  }
}
