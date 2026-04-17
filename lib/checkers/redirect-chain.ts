import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'
import { isSafeUrl } from './ssrf-guard'

interface RedirectStep {
  url: string
  status: number
  location?: string
}

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const url = monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  if (!isSafeUrl(url)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }
  const config = monitor.config as CheckerConfig
  const maxRedirects = config.maxRedirects ?? 5
  const start = Date.now()
  const chain: RedirectStep[] = []
  let currentUrl = url

  try {
    for (let i = 0; i <= maxRedirects; i++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

      const response = await fetch(currentUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual',
      })
      clearTimeout(timeout)

      const location = response.headers.get('location') ?? undefined
      chain.push({ url: currentUrl, status: response.status, location })

      if (response.status < 300 || response.status >= 400) break

      if (!location) break

      currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).toString()

      if (i === maxRedirects) {
        return {
          status: 'degraded',
          responseTimeMs: Date.now() - start,
          errorMessage: `Redirect chain exceeds ${maxRedirects} hops`,
          metadata: { chain, hops: chain.length },
        }
      }
    }

    const responseTimeMs = Date.now() - start
    const finalStatus = chain[chain.length - 1]?.status ?? 0
    const hops = chain.length - 1

    if (finalStatus >= 400) {
      return { status: 'down', responseTimeMs, errorMessage: `Final destination returned HTTP ${finalStatus}`, metadata: { chain, hops } }
    }

    return { status: 'up', responseTimeMs, statusCode: finalStatus, metadata: { chain, hops } }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Redirect chain check failed',
    }
  }
}
