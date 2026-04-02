/**
 * In-memory sliding window rate limiter.
 *
 * Uses a Map keyed by IP address. Each entry stores an array of
 * request timestamps within the current window. Expired entries
 * are cleaned up automatically every 60 seconds.
 *
 * This is suitable for single-instance deployments (Vercel serverless
 * functions share memory within a single invocation but NOT across
 * instances). For multi-instance deployments, swap the in-memory
 * store for a shared backend (e.g. Supabase table with TTL).
 *
 * Zero external dependencies — no Redis, no Upstash, no paid services.
 */

import { logger } from './logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number
  /** Window duration in milliseconds. */
  windowMs: number
}

interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean
  /** How many requests remain before hitting the limit. */
  remaining: number
  /** Unix timestamp (ms) when the oldest entry in the window expires. */
  resetAt: number
}

interface WindowEntry {
  /** Sorted array of request timestamps (ms) within the window. */
  timestamps: number[]
}

// ---------------------------------------------------------------------------
// Presets — use these in route handlers for consistency
// ---------------------------------------------------------------------------

/** Auth endpoints: 10 requests per 15 minutes per IP. */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
}

/** Webhook endpoints: 100 requests per minute per IP. */
export const WEBHOOK_RATE_LIMIT: RateLimitOptions = {
  maxRequests: 100,
  windowMs: 60 * 1000,
}

/** API v1 endpoints: 60 requests per minute per IP. */
export const API_V1_RATE_LIMIT: RateLimitOptions = {
  maxRequests: 60,
  windowMs: 60 * 1000,
}

/** Public subscribe endpoints: 5 requests per minute per IP (abuse-prone). */
export const PUBLIC_SUBSCRIBE_RATE_LIMIT: RateLimitOptions = {
  maxRequests: 5,
  windowMs: 60 * 1000,
}

/** Public unsubscribe endpoints: 10 requests per minute per IP. */
export const PUBLIC_UNSUBSCRIBE_RATE_LIMIT: RateLimitOptions = {
  maxRequests: 10,
  windowMs: 60 * 1000,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Global store keyed by `${routePrefix}:${ip}`.
 * Using a composite key allows different rate limits on different routes
 * for the same IP address.
 */
const store = new Map<string, WindowEntry>()

// ---------------------------------------------------------------------------
// Cleanup — runs every 60 s to evict stale entries
// ---------------------------------------------------------------------------

let cleanupStarted = false

function startCleanup(): void {
  if (cleanupStarted) return
  cleanupStarted = true

  const CLEANUP_INTERVAL_MS = 60_000

  setInterval((): void => {
    const now = Date.now()
    let evicted = 0

    for (const [key, entry] of store) {
      // If every timestamp in the entry is older than the largest
      // possible window (15 min — the longest preset), evict the key.
      const newest = entry.timestamps[entry.timestamps.length - 1]
      if (newest === undefined || now - newest > 15 * 60 * 1000) {
        store.delete(key)
        evicted++
      }
    }

    if (evicted > 0) {
      logger.debug('Rate limiter cleanup', { evicted, remaining: store.size })
    }
  }, CLEANUP_INTERVAL_MS).unref()
}

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

/**
 * Extract the client IP from standard proxy headers.
 * Falls back to 'unknown' — this means all requests without a
 * recognisable IP share a single bucket, which is still safe.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; first is the client
    const first = forwarded.split(',')[0]
    if (first) return first.trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

// ---------------------------------------------------------------------------
// Core — sliding window check
// ---------------------------------------------------------------------------

/**
 * Check whether a request is allowed under the given rate limit.
 *
 * @param request  - The incoming Request object (used to extract IP).
 * @param options  - `{ maxRequests, windowMs }` for this route.
 * @param routeKey - Optional route identifier to scope the bucket
 *                   (defaults to 'global'). Use a short prefix like
 *                   'auth', 'webhook', 'api-v1'.
 *
 * @example
 * ```ts
 * import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/utils/rate-limiter'
 *
 * export async function POST(request: Request): Promise<Response> {
 *   const rateLimit = checkRateLimit(request, AUTH_RATE_LIMIT, 'auth')
 *   if (!rateLimit.allowed) {
 *     return Response.json({ error: 'Too many requests' }, {
 *       status: 429,
 *       headers: {
 *         'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
 *       },
 *     })
 *   }
 *   // ... handler logic
 * }
 * ```
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
  routeKey: string = 'global',
): RateLimitResult {
  // Lazy-start the cleanup timer on first call
  startCleanup()

  const ip = getClientIp(request)
  const key = `${routeKey}:${ip}`
  const now = Date.now()
  const windowStart = now - options.windowMs

  // Get or create entry
  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Slide the window: drop timestamps older than windowStart
  entry.timestamps = entry.timestamps.filter(
    (ts: number): boolean => ts > windowStart,
  )

  // Determine reset time: when the oldest request in the window expires
  const oldest = entry.timestamps[0]
  const resetAt = oldest !== undefined ? oldest + options.windowMs : now + options.windowMs

  // Check limit
  if (entry.timestamps.length >= options.maxRequests) {
    logger.warn('Rate limit exceeded', { ip, routeKey, count: entry.timestamps.length })
    return { allowed: false, remaining: 0, resetAt }
  }

  // Record this request
  entry.timestamps.push(now)
  const remaining = options.maxRequests - entry.timestamps.length

  return { allowed: true, remaining, resetAt }
}
