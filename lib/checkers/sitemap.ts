import type { Monitor } from '@/lib/types'
import type { CheckerResult } from './types'
import { isSafeUrl } from './ssrf-guard'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const base = monitor.target.startsWith('http') ? monitor.target : `https://${monitor.target}`
  const sitemapUrl = new URL('/sitemap.xml', base).toString()
  if (!isSafeUrl(sitemapUrl)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(sitemapUrl, { signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)

    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `sitemap.xml not found (HTTP ${response.status})` }
    }

    const text = await response.text()
    const isXml = text.trimStart().startsWith('<?xml') || text.includes('<urlset') || text.includes('<sitemapindex')

    if (!isXml) {
      return { status: 'degraded', responseTimeMs, errorMessage: 'Response is not valid XML sitemap' }
    }

    const urlCount = (text.match(/<url>/g) || []).length
    const sitemapCount = (text.match(/<sitemap>/g) || []).length

    return {
      status: 'up',
      responseTimeMs,
      metadata: { urlCount, sitemapCount, isSitemapIndex: sitemapCount > 0, sizeBytes: text.length },
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Sitemap check failed',
    }
  }
}
