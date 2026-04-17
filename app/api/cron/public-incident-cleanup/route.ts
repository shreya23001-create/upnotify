// =============================================================================
// Cron: public-incident-cleanup
// Schedule: Every 30 minutes
// Purpose:
//   1. Auto-close stale incidents — any public incident open > 2 hours
//      where the site is now responding normally
//   2. Trigger blog generation for incidents that have passed the 15-min
//      eligibility window and haven't had a blog generated yet
// =============================================================================

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig, getConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { generateOutageBlogPost } from '@/lib/services/blog-generator'
import { researchOutage } from '@/lib/services/outage-researcher'
import { sendBlogApprovalEmail } from '@/lib/services/email'
import { sendBlogApprovalTelegram } from '@/lib/services/telegram'
import type { PublicMonitor } from '@/lib/db/public-monitors'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Domains known to block Vercel/AWS IPs — never generate blogs for these
const BLOCKED_DOMAINS = new Set([
  'netflix.com', 'spotify.com', 'disneyplus.com', 'hulu.com',
  'primevideo.com', 'peacocktv.com', 'tiktok.com', 'airbnb.com',
  'amazon.com', 'youtube.com',
])

async function checkSiteUp(domain: string): Promise<boolean> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'UptruePulse/1.0 (+https://uptrue.io/about)' },
    })
    clearTimeout(timeout)
    return res.status < 500
  } catch {
    return false
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const { cron } = getServerConfig()

  if (cron.secret && authHeader !== `Bearer ${cron.secret}`) {
    const isVercelCron = request.headers.get('x-vercel-cron')
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/public-incident-cleanup', getTriggeredBy(request))

  const supabase = createAdminClient()
  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()

  let autoClosed = 0
  let blogsTriggered = 0
  let blogsFailed = 0
  let blogsSkipped = 0

  try {
    // -------------------------------------------------------------------------
    // 1. Auto-close stale incidents (open > 2 hours)
    // -------------------------------------------------------------------------
    const { data: staleIncidents } = await supabase
      .from('public_incidents')
      .select('id, monitor_id, started_at')
      .is('resolved_at', null)
      .lt('started_at', twoHoursAgo)

    if (staleIncidents && staleIncidents.length > 0) {
      // Get monitor domains for these incidents
      const monitorIds = [...new Set(staleIncidents.map(i => i.monitor_id))]
      const { data: monitors } = await supabase
        .from('public_monitors')
        .select('id, domain, display_name')
        .in('id', monitorIds)

      const monitorMap = new Map((monitors ?? []).map(m => [m.id, m]))

      await Promise.allSettled(
        staleIncidents.map(async (incident) => {
          const monitor = monitorMap.get(incident.monitor_id)
          if (!monitor) return

          // Re-check if the site is actually still down
          const stillDown = !(await checkSiteUp(monitor.domain))

          if (!stillDown) {
            await supabase
              .from('public_incidents')
              .update({ resolved_at: now.toISOString() })
              .eq('id', incident.id)

            await supabase
              .from('public_monitors')
              .update({ last_status: 'up', last_checked_at: now.toISOString() })
              .eq('id', monitor.id)

            autoClosed++
            logger.info('Auto-closed stale public incident', {
              domain: monitor.domain,
              incidentId: incident.id,
            })
          }
        })
      )
    }

    // -------------------------------------------------------------------------
    // 2. Generate blogs for eligible incidents (15-min window passed, no blog yet)
    // -------------------------------------------------------------------------
    // Fetch incidents eligible for blog generation:
    // - eligibility window has passed (15-min confirmation)
    // - no blog generated yet
    // - either still open OR resolved within the last 2 hours (catches the common case where
    //   a short outage resolves before the next cron run but was real enough to blog about)
    const twoHoursAgoForBlog = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eligibleIncidents } = await (supabase as unknown as any)
      .from('public_incidents')
      .select(`
        id, monitor_id, cause, status_code, started_at, resolved_at,
        blog_eligible_after, blog_generated_at
      `)
      .is('blog_generated_at', null)
      .not('blog_eligible_after', 'is', null)
      .lte('blog_eligible_after', now.toISOString())
      .or(`resolved_at.is.null,resolved_at.gte.${twoHoursAgoForBlog}`) as {
        data: Array<{
          id: string
          monitor_id: string
          cause: string | null
          status_code: number | null
          started_at: string
          resolved_at: string | null
          blog_eligible_after: string | null
          blog_generated_at: string | null
        }> | null
      }

    if (eligibleIncidents && eligibleIncidents.length > 0) {
      const monitorIds = [...new Set(eligibleIncidents.map(i => i.monitor_id))]
      const { data: monitors } = await supabase
        .from('public_monitors')
        .select('id, domain, display_name, category')
        .in('id', monitorIds)

      const monitorMap = new Map((monitors ?? []).map(m => [m.id, m]))

      // Process one at a time to avoid hammering Claude API + Resend simultaneously
      for (const incident of eligibleIncidents) {
        const monitor = monitorMap.get(incident.monitor_id) as PublicMonitor | undefined
        if (!monitor) continue

        // Skip known IP-blocked domains
        if (BLOCKED_DOMAINS.has(monitor.domain)) {
          logger.info('Skipping blog for IP-blocked domain', { domain: monitor.domain })
          // Mark as generated to prevent retrying
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as unknown as any)
            .from('public_incidents')
            .update({ blog_generated_at: now.toISOString() })
            .eq('id', incident.id)
          continue
        }

        // For ongoing incidents: re-confirm site is still down before generating blog.
        // For already-resolved incidents: skip the live check — the outage was real, blog it.
        if (!incident.resolved_at) {
          const stillDown = !(await checkSiteUp(monitor.domain))
          if (!stillDown) {
            logger.info('Site recovered before blog generation — skipping', { domain: monitor.domain })
            await supabase
              .from('public_incidents')
              .update({ resolved_at: now.toISOString() })
              .eq('id', incident.id)
            await supabase
              .from('public_monitors')
              .update({ last_status: 'up', last_checked_at: now.toISOString() })
              .eq('id', monitor.id)
            autoClosed++
            continue
          }
        }

        try {
          const research = await researchOutage(monitor.display_name, monitor.domain)
          const draft = await generateOutageBlogPost({
            siteDisplayName: monitor.display_name,
            siteDomain: monitor.domain,
            siteCategory: monitor.category ?? 'other',
            errorMessage: incident.cause ?? 'Site unreachable',
            statusCode: incident.status_code ?? null,
            startedAt: incident.started_at,
            incidentId: incident.id,
            monitorId: monitor.id,
            research,
          })

          if (!draft) {
            // null = dedup/skip — blog-generator already stamped blog_generated_at to stop retrying
            blogsSkipped++
            continue
          }

          // Stamp only after blog post successfully created — prevents permanent lock on timeout
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as unknown as any)
            .from('public_incidents')
            .update({ blog_generated_at: now.toISOString() })
            .eq('id', incident.id)

          // Send approval notifications
          const { app, admin } = getConfig()
          const approveUrl = `${app.url}/api/admin/blog-approve?token=${draft.approveToken}`
          const rejectUrl  = `${app.url}/api/admin/blog-approve?token=${draft.rejectToken}`

          await Promise.allSettled([
            ...admin.emails.map(to => sendBlogApprovalEmail({
              to,
              blogTitle: draft.title,
              blogSlug: draft.slug,
              siteDisplayName: monitor.display_name,
              excerpt: draft.excerpt,
              category: 'down_alert',
              bodyMarkdown: draft.bodyMarkdown,
              sourcesCount: draft.sourcesCount,
              sources: draft.sources,
              approveUrl,
              rejectUrl,
            })),
            sendBlogApprovalTelegram({
              blogTitle: draft.title,
              siteDisplayName: monitor.display_name,
              excerpt: draft.excerpt,
              sourcesCount: draft.sourcesCount,
              hasOfficialStatus: !!research.officialStatus,
              approveUrl,
              rejectUrl,
            }),
          ])

          blogsTriggered++
          logger.info('Blog generated via cleanup cron', {
            domain: monitor.domain,
            incidentId: incident.id,
            blogId: draft.blogPostId,
          })
        } catch (err) {
          blogsFailed++
          logger.error('Blog generation failed in cleanup cron', {
            domain: monitor.domain,
            error: err instanceof Error ? err.message : 'Unknown',
          })
          // Give up after 2 hours of retrying — stamp to prevent infinite loop
          const eligibleAt = new Date(incident.blog_eligible_after!).getTime()
          if (Date.now() - eligibleAt > 2 * 60 * 60 * 1000) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as unknown as any)
              .from('public_incidents')
              .update({ blog_generated_at: now.toISOString() })
              .eq('id', incident.id)
            logger.warn('Blog generation gave up after 2h — stamping to stop retry', { domain: monitor.domain, incidentId: incident.id })
          }
        }
      }
    }

    const summary = `auto_closed: ${autoClosed}, blogs_triggered: ${blogsTriggered}, blogs_skipped: ${blogsSkipped}, blogs_failed: ${blogsFailed}`
    logger.info('public-incident-cleanup completed', { autoClosed, blogsTriggered, blogsSkipped, blogsFailed })
    await endCronRun(runId, cronStart, 'ok', { summary })
    return NextResponse.json({ ok: true, autoClosed, blogsTriggered, blogsSkipped, blogsFailed })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('public-incident-cleanup error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
