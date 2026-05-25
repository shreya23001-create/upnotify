import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/utils/config'

/**
 * Central authentication gate for every /api/cron/* route.
 *
 * Returns a NextResponse 401 if the request lacks a valid Bearer token
 * matching CRON_SECRET. Returns `null` when the caller is authorised, so
 * the handler pattern is:
 *
 *   const unauth = requireCronAuth(request)
 *   if (unauth) return unauth
 *
 * Why this exists:
 *   The original per-route check (engineering-app#60, SEC-01 CRITICAL)
 *   accepted ANY request that included an `X-Vercel-Cron` header as a
 *   fallback — but that header is just a plain HTTP header that any
 *   attacker can spoof. It is *not* cryptographically signed by Vercel.
 *
 *   The correct contract is: Vercel's native cron scheduler sends
 *   `Authorization: Bearer <CRON_SECRET>` automatically when it invokes
 *   each cron URL. That single check covers every legitimate caller
 *   (Vercel native crons, the cron-job.org dev scheduler, manual ops
 *   curls, admin UI triggers that proxy the secret). No header fallback
 *   is needed, and accepting one is a security regression.
 *
 *   Centralising the gate also means a future new cron route inherits
 *   the fix by default: it just calls requireCronAuth(request) and
 *   cannot accidentally reintroduce the bypass.
 *
 * Returns 401 (not 403) so the response shape matches the rest of the
 * API and standard tooling (e.g. Vercel cron retry logic) treats it as
 * an auth failure rather than a permanent ban.
 */
export function requireCronAuth(request: Request): NextResponse | null {
  const { cron } = getServerConfig()
  const authHeader = request.headers.get('authorization')

  // Hard-fail when CRON_SECRET is missing — preferable to silently
  // accepting unauthenticated invocations if env vars are misconfigured.
  if (!cron.secret || authHeader !== `Bearer ${cron.secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
