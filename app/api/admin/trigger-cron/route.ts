import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerConfig } from '@/lib/utils/config'

export const dynamic = 'force-dynamic'

// Whitelist of cron paths that can be triggered on demand.
// Must match the paths in vercel.json exactly.
const ALLOWED_CRON_PATHS = new Set([
  '/api/cron/check-runner',
  '/api/cron/public-checks',
  '/api/cron/nurture-emails',
  '/api/cron/health-scores',
  '/api/cron/compete-checks',
  '/api/cron/compete-brief',
  '/api/cron/aoe/quota-manager',
  '/api/cron/aoe/site-discovery',
  '/api/cron/aoe/outreach-checker',
  '/api/cron/aoe/outreach-emailer',
  '/api/cron/aoe/last-day-burst',
  '/api/cron/aoe/daily-snapshot',
  '/api/cron/competitor-checks',
  '/api/cron/public-incident-cleanup',
  '/api/cron/autoblog/feed-fetcher',
  '/api/cron/autoblog/llm-detector',
  '/api/cron/autoblog/topic-runner',
  '/api/cron/autoblog/post-generator',
])

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { path?: string }
  try {
    body = await request.json() as { path?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const cronPath = body.path
  if (!cronPath || !ALLOWED_CRON_PATHS.has(cronPath)) {
    return NextResponse.json({ error: 'Unknown or disallowed cron path' }, { status: 400 })
  }

  const { cron } = getServerConfig()
  const cronSecret = cron.secret

  // Build the absolute URL to the cron endpoint within this deployment
  const host = request.headers.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const targetUrl = `${protocol}://${host}${cronPath}`

  const headers: Record<string, string> = {
    'x-cron-trigger': 'manual',
  }
  if (cronSecret) {
    headers['Authorization'] = `Bearer ${cronSecret}`
  }

  try {
    const res = await fetch(targetUrl, { method: 'GET', headers })
    const text = await res.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = text }
    return NextResponse.json({ success: res.ok, status: res.status, data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
