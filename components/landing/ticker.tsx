import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

interface TickerMonitor {
  domain: string
  display_name: string
  last_status: string
  last_checked_at: string | null
  last_response_time_ms: number | null
}

function statusToMsg(status: string): string {
  if (status === 'down') return 'down'
  if (status === 'degraded') return 'elevated latency'
  return 'operational'
}

function statusToType(status: string): string {
  if (status === 'down') return 'down'
  if (status === 'degraded') return 'down'
  return 'up'
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'just now'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1m ago'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  return `${hrs}h ago`
}

async function fetchTickerEvents(): Promise<TickerMonitor[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('public_monitors')
      .select('domain, display_name, last_status, last_checked_at, last_response_time_ms')
      .eq('is_active', true)
      .not('last_checked_at', 'is', null)
      .order('last_checked_at', { ascending: false })
      .limit(30)

    if (error) {
      logger.warn('Ticker: failed to fetch public monitors', { error: error.message })
      return []
    }
    return (data ?? []) as TickerMonitor[]
  } catch (err) {
    logger.warn('Ticker: unexpected error', { error: String(err) })
    return []
  }
}

export async function Ticker(): Promise<React.ReactElement> {
  const monitors = await fetchTickerEvents()

  // Fallback static events if DB is empty or not yet populated
  const FALLBACK = [
    { domain: 'github.com',       display_name: 'GitHub',       last_status: 'up',       last_checked_at: null, last_response_time_ms: 120 },
    { domain: 'stripe.com',       display_name: 'Stripe',       last_status: 'degraded', last_checked_at: null, last_response_time_ms: null },
    { domain: 'shopify.com',      display_name: 'Shopify',      last_status: 'up',       last_checked_at: null, last_response_time_ms: 98  },
    { domain: 'vercel.com',       display_name: 'Vercel',       last_status: 'up',       last_checked_at: null, last_response_time_ms: 44  },
    { domain: 'cloudflare.com',   display_name: 'Cloudflare',   last_status: 'up',       last_checked_at: null, last_response_time_ms: 61  },
    { domain: 'notion.so',        display_name: 'Notion',       last_status: 'down',     last_checked_at: null, last_response_time_ms: null },
    { domain: 'figma.com',        display_name: 'Figma',        last_status: 'up',       last_checked_at: null, last_response_time_ms: 110 },
    { domain: 'slack.com',        display_name: 'Slack',        last_status: 'up',       last_checked_at: null, last_response_time_ms: 82  },
    { domain: 'aws.amazon.com',   display_name: 'AWS',          last_status: 'degraded', last_checked_at: null, last_response_time_ms: null },
    { domain: 'openai.com',       display_name: 'OpenAI',       last_status: 'up',       last_checked_at: null, last_response_time_ms: 135 },
  ]

  const events = monitors.length >= 6 ? monitors : FALLBACK

  // Double for seamless infinite scroll
  const doubled = [...events, ...events]

  return (
    <div className="pub-ticker">
      <div className="ticker-badge">LIVE</div>
      <div className="ticker-track-wrap">
        <div className="ticker-track">
          {doubled.map((ev, i) => {
            const type = statusToType(ev.last_status)
            const msg = statusToMsg(ev.last_status)
            const when = timeAgo(ev.last_checked_at)
            return (
              <div key={i} className={`ticker-event ${type}`}>
                <span className={`ticker-dot ${type}`} />
                <strong>{ev.display_name}</strong>
                {' — '}
                {msg}
                {' '}
                <span className="ticker-time">{when}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
