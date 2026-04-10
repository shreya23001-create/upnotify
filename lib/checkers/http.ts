import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

// Block private/internal IP ranges and cloud metadata endpoints to prevent SSRF
const BLOCKED_HOSTS = ['localhost', '0.0.0.0', '169.254.169.254', '100.100.100.200']
const BLOCKED_PREFIXES = [
  '127.', '10.', '192.168.',
  '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.',
  '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.',
  '172.28.', '172.29.', '172.30.', '172.31.',
  '::1', 'fc00:', 'fd',
]

function isSafeUrl(url: string): boolean {
  let parsed: URL
  try { parsed = new URL(url) } catch { return false }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false
  const host = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTS.includes(host)) return false
  if (BLOCKED_PREFIXES.some(p => host.startsWith(p))) return false
  return true
}

// Whitelist of headers a monitor is allowed to send
const ALLOWED_HEADER_NAMES = new Set([
  'accept', 'accept-language', 'authorization', 'cache-control',
  'content-type', 'cookie', 'user-agent', 'x-api-key', 'x-requested-with',
])

function sanitizeHeaders(raw: Record<string, string> | undefined): Record<string, string> {
  if (!raw) return {}
  return Object.fromEntries(
    Object.entries(raw).filter(([k]) => ALLOWED_HEADER_NAMES.has(k.toLowerCase()))
  )
}

export async function check(monitor: Monitor): Promise<CheckerResult> {
  if (!isSafeUrl(monitor.target)) {
    return { status: 'down', responseTimeMs: 0, errorMessage: 'Monitor target URL is not permitted' }
  }

  const config = monitor.config as CheckerConfig
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), monitor.timeout_ms)

    const response = await fetch(monitor.target, {
      method: (config.method || 'GET').toUpperCase(),
      headers: sanitizeHeaders(config.headers as Record<string, string> | undefined),
      body: config.method === 'POST' ? config.body : undefined,
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)
    const responseTimeMs = Date.now() - start
    const expectedStatus = config.expectedStatus || 200

    if (response.status >= 500) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `Server error: ${response.status}` }
    }

    if (config.expectedStatus && response.status !== config.expectedStatus) {
      return { status: 'down', responseTimeMs, statusCode: response.status, errorMessage: `Expected ${expectedStatus}, got ${response.status}` }
    }

    if (response.status >= 400) {
      return { status: 'degraded', responseTimeMs, statusCode: response.status, errorMessage: `Client error: ${response.status}` }
    }

    return { status: 'up', responseTimeMs, statusCode: response.status }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('abort')) {
      return { status: 'down', responseTimeMs, errorMessage: `Timeout after ${monitor.timeout_ms}ms` }
    }
    return { status: 'down', responseTimeMs, errorMessage: message }
  }
}
