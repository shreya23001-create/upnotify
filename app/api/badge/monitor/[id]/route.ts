/**
 * /api/badge/monitor/[id] — Monitoring badge SVG API.
 *
 * Returns a dynamic SVG badge showing monitor uptime status.
 * Public endpoint — no auth required (badges are embedded on external sites).
 *
 * Query params:
 *   ?style=standard  — "Monitored by Uptrue" (default)
 *   ?style=uptime    — "99.97% Uptime — Uptrue"
 *   ?style=shield    — "Uptrue ✓ Verified"
 *
 * Cached for 1 hour via Cache-Control headers.
 * Rate limited: 100 req/min per IP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMonitorUptimePercentage } from '@/lib/db/check-results'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeStyle = 'standard' | 'uptime' | 'shield'

interface BadgeConfig {
  leftText: string
  rightText: string
  leftColor: string
  rightColor: string
  leftWidth: number
  rightWidth: number
}

// ---------------------------------------------------------------------------
// Rate limit config — 100 req/min for badge embeds
// ---------------------------------------------------------------------------

const BADGE_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60_000,
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function getUptimeColor(uptime: number): string {
  if (uptime >= 99.5) return '#22c55e'   // green
  if (uptime >= 99.0) return '#f59e0b'   // amber
  return '#ef4444'                        // red
}

// ---------------------------------------------------------------------------
// SVG generation
// ---------------------------------------------------------------------------

function generateBadgeSvg(config: BadgeConfig): string {
  const { leftText, rightText, leftColor, rightColor, leftWidth, rightWidth } = config
  const totalWidth = leftWidth + rightWidth
  const height = 32

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <defs>
    <linearGradient id="bg" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="${height}" fill="${leftColor}"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#bg)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${leftWidth / 2}" y="21" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="20">${leftText}</text>
    <text aria-hidden="true" x="${leftWidth + rightWidth / 2}" y="21" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="20">${rightText}</text>
  </g>
</svg>`
}

function buildBadgeConfig(style: BadgeStyle, uptime: number): BadgeConfig {
  const uptimeColor = getUptimeColor(uptime)

  switch (style) {
    case 'uptime':
      return {
        leftText: `${uptime.toFixed(2)}% Uptime`,
        rightText: 'Uptrue',
        leftColor: uptimeColor,
        rightColor: '#3b82f6',
        leftWidth: 108,
        rightWidth: 52,
      }

    case 'shield':
      return {
        leftText: 'Uptrue',
        rightText: '\u2713 Verified',
        leftColor: '#3b82f6',
        rightColor: '#22c55e',
        leftWidth: 58,
        rightWidth: 78,
      }

    case 'standard':
    default:
      return {
        leftText: 'Monitored by',
        rightText: 'Uptrue',
        leftColor: '#555',
        rightColor: '#3b82f6',
        leftWidth: 96,
        rightWidth: 64,
      }
  }
}

// ---------------------------------------------------------------------------
// Monitor existence check (public — only verifies monitor exists, no data leak)
// ---------------------------------------------------------------------------

async function monitorExists(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('monitors')
    .select('id')
    .eq('id', id)
    .single()

  if (error || !data) return false
  return true
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Rate limiting
  const rateLimit = checkRateLimit(request, BADGE_RATE_LIMIT, 'badge-monitor')
  if (!rateLimit.allowed) {
    return new NextResponse('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
      },
    })
  }

  const { id } = await params

  // Validate UUID format to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return new NextResponse('Invalid monitor ID', { status: 400 })
  }

  // Parse style parameter
  const url = new URL(request.url)
  const styleParam = url.searchParams.get('style') ?? 'standard'
  const validStyles: BadgeStyle[] = ['standard', 'uptime', 'shield']
  const style: BadgeStyle = validStyles.includes(styleParam as BadgeStyle)
    ? (styleParam as BadgeStyle)
    : 'standard'

  try {
    // Verify monitor exists
    const exists = await monitorExists(id)
    if (!exists) {
      // Return a generic fallback badge rather than 404 to avoid leaking monitor IDs
      const fallbackConfig = buildBadgeConfig('standard', 100)
      const fallbackSvg = generateBadgeSvg({
        ...fallbackConfig,
        leftText: 'Monitor',
        rightText: 'Not Found',
        rightColor: '#999',
      })
      return new NextResponse(fallbackSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
        },
      })
    }

    // Calculate 30-day uptime
    const uptime = await getMonitorUptimePercentage(id, 30)

    // Build and return SVG
    const config = buildBadgeConfig(style, uptime)
    const svg = generateBadgeSvg(config)

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
        'X-Uptrue-Uptime': String(uptime),
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    logger.error('Monitor badge generation failed', {
      monitorId: id,
      error: err instanceof Error ? err.message : String(err),
    })

    // Return fallback badge on error
    const fallbackConfig = buildBadgeConfig(style, 100)
    const fallbackSvg = generateBadgeSvg(fallbackConfig)

    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }
}
