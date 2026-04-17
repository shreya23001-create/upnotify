// =============================================================================
// PMB Generator
// Generates a single blog post for a pmb_run row.
// Pulls monitoring data, builds inline SVG charts, calls Claude API for prose,
// saves to blog_posts, returns the post ID.
// =============================================================================

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { createBlogPost } from '@/lib/db/blog-posts'
import { calculatePublicUptime, getPublicMonitorAvgResponseTime, getPublicMonitorIncidentCount } from '@/lib/db/public-monitors'
import type { PmbRun, PmbCategory } from '@/lib/db/pmb'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

// =============================================================================
// Types
// =============================================================================

interface MonitorStats {
  id: string
  domain: string
  display_name: string
  uptime_pct: number
  avg_response_ms: number | null
  incident_count: number
  total_downtime_min: number
}

export interface PmbGenerateResult {
  success: boolean
  blog_post_id: string | null
  word_count: number | null
  error?: string
}

// =============================================================================
// Data fetching
// =============================================================================

async function getMonitorStats(monitorId: string, domain: string, displayName: string, days = 7): Promise<MonitorStats> {
  const [uptime, avgResponse, incidentCount] = await Promise.all([
    calculatePublicUptime(monitorId, days),
    getPublicMonitorAvgResponseTime(monitorId, days),
    getPublicMonitorIncidentCount(monitorId, days),
  ])

  // Get total downtime from incidents
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data: incidents } = await db()
    .from('public_incidents')
    .select('started_at, resolved_at')
    .eq('monitor_id', monitorId)
    .gte('started_at', since.toISOString())

  let totalDowntimeMin = 0
  for (const inc of (incidents ?? []) as Array<{ started_at: string; resolved_at: string | null }>) {
    const start = new Date(inc.started_at).getTime()
    const end = inc.resolved_at ? new Date(inc.resolved_at).getTime() : Date.now()
    totalDowntimeMin += Math.round((end - start) / 60000)
  }

  return { id: monitorId, domain, display_name: displayName, uptime_pct: uptime, avg_response_ms: avgResponse, incident_count: incidentCount, total_downtime_min: totalDowntimeMin }
}

// =============================================================================
// Inline SVG chart builders
// =============================================================================

function buildUptimeChart(monitors: MonitorStats[]): string {
  const barH = 28
  const labelW = 110
  const trackW = 320
  const gap = 10
  const totalH = monitors.length * (barH + gap) + 30

  const bars = monitors.map((m, i) => {
    const y = i * (barH + gap)
    const pct = Math.max(0, Math.min(100, m.uptime_pct))
    const fillW = Math.round((pct / 100) * trackW)
    const color = pct >= 99.9 ? '#10b981' : pct >= 99 ? '#f59e0b' : '#ef4444'
    const label = m.display_name.length > 14 ? m.display_name.slice(0, 13) + '…' : m.display_name
    return `
    <text x="${labelW - 6}" y="${y + barH / 2 + 1}" text-anchor="end" font-size="12" fill="#94a3b8" font-family="system-ui,sans-serif" dominant-baseline="middle">${label}</text>
    <rect x="${labelW}" y="${y}" width="${trackW}" height="${barH}" rx="4" fill="#1e2535"/>
    <rect x="${labelW}" y="${y}" width="${fillW}" height="${barH}" rx="4" fill="${color}" opacity="0.85"/>
    <text x="${labelW + fillW - 6}" y="${y + barH / 2 + 1}" text-anchor="end" font-size="11" font-weight="700" fill="white" font-family="system-ui,sans-serif" dominant-baseline="middle">${pct.toFixed(2)}%</text>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${labelW + trackW + 10} ${totalH}" style="width:100%;max-width:500px;display:block;margin:0 auto">
  ${bars}
  <text x="${labelW}" y="${totalH - 4}" font-size="10" fill="#475569" font-family="system-ui,sans-serif">HTTP checks every 5 min · 7-day period · Uptrue independent monitoring</text>
</svg>`
}

function buildResponseTimeChart(monitors: MonitorStats[]): string {
  const withTime = monitors.filter(m => m.avg_response_ms !== null)
  if (withTime.length === 0) return ''

  const maxMs = Math.max(...withTime.map(m => m.avg_response_ms!))
  const barH = 28
  const labelW = 110
  const trackW = 320
  const gap = 10
  const totalH = withTime.length * (barH + gap) + 30

  const bars = withTime
    .sort((a, b) => (a.avg_response_ms ?? 0) - (b.avg_response_ms ?? 0))
    .map((m, i) => {
      const y = i * (barH + gap)
      const fillW = Math.round(((m.avg_response_ms ?? 0) / maxMs) * trackW)
      const label = m.display_name.length > 14 ? m.display_name.slice(0, 13) + '…' : m.display_name
      const color = i === 0 ? '#10b981' : '#3b82f6'
      return `
    <text x="${labelW - 6}" y="${y + barH / 2 + 1}" text-anchor="end" font-size="12" fill="#94a3b8" font-family="system-ui,sans-serif" dominant-baseline="middle">${label}</text>
    <rect x="${labelW}" y="${y}" width="${trackW}" height="${barH}" rx="4" fill="#1e2535"/>
    <rect x="${labelW}" y="${y}" width="${fillW}" height="${barH}" rx="4" fill="${color}" opacity="0.85"/>
    <text x="${labelW + fillW + 6}" y="${y + barH / 2 + 1}" font-size="11" font-weight="700" fill="${color}" font-family="system-ui,sans-serif" dominant-baseline="middle">${m.avg_response_ms}ms</text>`
    }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${labelW + trackW + 60} ${totalH}" style="width:100%;max-width:500px;display:block;margin:0 auto">
  ${bars}
  <text x="${labelW}" y="${totalH - 4}" font-size="10" fill="#475569" font-family="system-ui,sans-serif">Lower is better · Median TTFB · Excludes model inference time</text>
</svg>`
}

function buildIncidentChart(monitors: MonitorStats[]): string {
  const maxInc = Math.max(...monitors.map(m => m.total_downtime_min), 1)
  const barH = 28
  const labelW = 110
  const trackW = 320
  const gap = 10
  const totalH = monitors.length * (barH + gap) + 30

  const bars = monitors.map((m, i) => {
    const y = i * (barH + gap)
    const fillW = Math.round((m.total_downtime_min / maxInc) * trackW)
    const color = m.incident_count === 0 ? '#10b981' : m.incident_count === 1 ? '#f59e0b' : '#ef4444'
    const label = m.display_name.length > 14 ? m.display_name.slice(0, 13) + '…' : m.display_name
    const text = m.incident_count === 0 ? 'No incidents' : `${m.incident_count} incident${m.incident_count > 1 ? 's' : ''} · ${m.total_downtime_min} min`
    return `
    <text x="${labelW - 6}" y="${y + barH / 2 + 1}" text-anchor="end" font-size="12" fill="#94a3b8" font-family="system-ui,sans-serif" dominant-baseline="middle">${label}</text>
    <rect x="${labelW}" y="${y}" width="${trackW}" height="${barH}" rx="4" fill="#1e2535"/>
    ${fillW > 0 ? `<rect x="${labelW}" y="${y}" width="${Math.max(fillW, 4)}" height="${barH}" rx="4" fill="${color}" opacity="0.85"/>` : ''}
    <text x="${labelW + 8}" y="${y + barH / 2 + 1}" font-size="11" fill="white" font-family="system-ui,sans-serif" dominant-baseline="middle">${text}</text>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${labelW + trackW + 10} ${totalH}" style="width:100%;max-width:500px;display:block;margin:0 auto">
  ${bars}
  <text x="${labelW}" y="${totalH - 4}" font-size="10" fill="#475569" font-family="system-ui,sans-serif">Incident = 2+ consecutive failed checks · 7-day window</text>
</svg>`
}

// =============================================================================
// Feature image SVG (reusable for all PMB post types)
// =============================================================================

function buildFeatureImageSvg(categoryEmoji: string, categoryName: string, label: string, periodLabel: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 260" style="width:100%;display:block">
  <defs>
    <linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <pattern id="pdots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.06)"/>
    </pattern>
  </defs>
  <rect width="900" height="260" fill="url(#pg1)"/>
  <rect width="900" height="260" fill="url(#pdots)"/>
  <text x="450" y="80" text-anchor="middle" font-size="48" font-family="system-ui,sans-serif">${categoryEmoji}</text>
  <text x="450" y="142" text-anchor="middle" font-size="28" font-weight="800" fill="white" font-family="system-ui,sans-serif">${label}</text>
  <rect x="0" y="210" width="900" height="50" fill="rgba(0,0,0,0.4)"/>
  <text x="24" y="241" font-size="11" font-weight="700" fill="rgba(255,255,255,0.55)" font-family="system-ui,sans-serif" letter-spacing="0.5">${categoryName.toUpperCase()} · UPTRUE.IO RELIABILITY DATA</text>
  <text x="876" y="241" text-anchor="end" font-size="11" fill="rgba(255,255,255,0.4)" font-family="system-ui,sans-serif">${periodLabel}</text>
</svg>`
}

// =============================================================================
// Slug builder
// =============================================================================

function buildSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Date.now().toString(36)
}

// =============================================================================
// Claude API call
// =============================================================================

async function callClaude(prompt: string, systemPrompt: string, model: 'haiku' | 'sonnet' = 'haiku'): Promise<string> {
  const config = getServerConfig()
  const client = new Anthropic({ apiKey: config.anthropic?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '' })

  const modelId = model === 'sonnet' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'

  const message = await client.messages.create({
    model: modelId,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  return (message.content[0] as { type: string; text: string }).text ?? ''
}

// =============================================================================
// HTML assembler
// =============================================================================

function buildPostHtml(sections: {
  featureSvg: string
  category: PmbCategory
  title: string
  periodLabel: string
  intro: string
  tldr: string[]
  uptimeChartSvg: string
  uptimeAnalysis: string
  responseChartSvg: string
  responseAnalysis: string
  incidentChartSvg: string
  incidentAnalysis: string
  historicalContext: string
  recommendation: string
  relatedLinks: Array<{ href: string; text: string }>
  faqs: Array<{ q: string; a: string }>
}): string {
  const relatedHtml = sections.relatedLinks.map(l =>
    `<li><a href="${l.href}">${l.text}</a></li>`
  ).join('\n')

  const faqHtml = sections.faqs.map(f => `
    <div class="pmb-faq-item">
      <div class="pmb-faq-q">${f.q}</div>
      <div class="pmb-faq-a">${f.a}</div>
    </div>`).join('\n')

  const tldrHtml = sections.tldr.map(t => `<li>${t}</li>`).join('\n')

  return `<div class="pmb-post">

<div class="pmb-feature-image">${sections.featureSvg}</div>

<div class="pmb-meta">
  <span class="pmb-badge pmb-badge-category">${sections.category.emoji} ${sections.category.display_name}</span>
  <span class="pmb-badge pmb-badge-period">Weekly Comparison</span>
</div>

<p class="pmb-intro">${sections.intro}</p>

<div class="pmb-tldr">
  <div class="pmb-tldr-label">TL;DR</div>
  <ul>${tldrHtml}</ul>
</div>

<hr class="pmb-divider"/>

<h2>Uptime This Week</h2>
<div class="pmb-chart">${sections.uptimeChartSvg}</div>
<p>${sections.uptimeAnalysis}</p>

<h2>Response Time</h2>
<div class="pmb-chart">${sections.responseChartSvg || '<p><em>Response time data not available for this period.</em></p>'}</div>
<p>${sections.responseAnalysis}</p>

<h2>Incidents &amp; Downtime</h2>
<div class="pmb-chart">${sections.incidentChartSvg}</div>
<p>${sections.incidentAnalysis}</p>

<div class="pmb-context">
  <div class="pmb-context-label">Historical Context</div>
  ${sections.historicalContext}
</div>

<h2>Which Should You Choose?</h2>
<p>${sections.recommendation}</p>

<div class="pmb-related">
  <div class="pmb-related-label">Related Reports</div>
  <ul>${relatedHtml}</ul>
</div>

<div class="pmb-methodology">
  <strong>About This Data</strong><br/>
  All uptime, response time, and incident data is collected by Uptrue's independent monitoring infrastructure.
  HTTP checks run every 5 minutes. An incident is recorded only after 2+ consecutive failed checks.
  Uptrue is not affiliated with any monitored service. For corrections: <a href="mailto:reports@uptrue.io">reports@uptrue.io</a>
</div>

<h2>Frequently Asked Questions</h2>
<div class="pmb-faqs">${faqHtml}</div>

<div class="pmb-subscribe-cta">
  <div class="pmb-cta-title">Get weekly reliability reports in your inbox</div>
  <div class="pmb-cta-sub">Every Monday: uptime rankings, incident summaries, and response time trends across 200 monitored providers.</div>
</div>

</div>`
}

// =============================================================================
// Main generator — pairwise
// =============================================================================

async function generatePairwisePost(run: PmbRun, category: PmbCategory): Promise<PmbGenerateResult> {
  const monitorA = await db().from('public_monitors').select('id, domain, display_name').eq('id', run.monitor_id).single()
  const monitorB = await db().from('public_monitors').select('id, domain, display_name').eq('id', run.compare_monitor_id).single()

  if (monitorA.error || monitorB.error || !monitorA.data || !monitorB.data) {
    return { success: false, blog_post_id: null, word_count: null, error: 'Monitor not found' }
  }

  const mA = monitorA.data as { id: string; domain: string; display_name: string }
  const mB = monitorB.data as { id: string; domain: string; display_name: string }

  const [statsA, statsB] = await Promise.all([
    getMonitorStats(mA.id, mA.domain, mA.display_name),
    getMonitorStats(mB.id, mB.domain, mB.display_name),
  ])

  const periodLabel = `Week of ${new Date(run.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  const title = `${mA.display_name} vs ${mB.display_name} Uptime — ${periodLabel}`

  const dataContext = `
Provider A: ${mA.display_name} (${mA.domain})
- Uptime: ${statsA.uptime_pct}%
- Avg response: ${statsA.avg_response_ms ?? 'N/A'}ms
- Incidents: ${statsA.incident_count}, total downtime: ${statsA.total_downtime_min} min

Provider B: ${mB.display_name} (${mB.domain})
- Uptime: ${statsB.uptime_pct}%
- Avg response: ${statsB.avg_response_ms ?? 'N/A'}ms
- Incidents: ${statsB.incident_count}, total downtime: ${statsB.total_downtime_min} min

Category: ${category.display_name}
Period: ${periodLabel}
`

  const systemPrompt = `You are a technical writer producing reliability comparison reports for Uptrue, an independent uptime monitoring service.
Write in a clear, factual, analytical tone. Target audience: engineers, CTOs, and technical decision-makers.
Never mention yourself. Never use phrases like "In this report" or "In conclusion".
All data comes from Uptrue's independent monitoring — state this clearly.
Keep sentences concise. Use specific numbers from the data provided.`

  const prose = await callClaude(`
Given this monitoring data, write 5 short prose sections for a blog post. Return ONLY a JSON object with these exact keys:
- intro: 2-3 sentence overview paragraph (mention both providers and key numbers)
- tldr: array of 4 bullet strings (key findings, include numbers)
- uptime_analysis: 2-3 sentences analysing the uptime data
- response_analysis: 2-3 sentences analysing response time (if N/A, say data was unavailable)
- incident_analysis: 2-3 sentences analysing incidents and downtime
- historical_note: 1-2 sentences about reliability trends in the ${category.display_name} space (general insight, not specific historical data)
- recommendation: 2-3 sentences on which provider to choose and when
- faq_1_q, faq_1_a: FAQ about which is more reliable
- faq_2_q, faq_2_a: FAQ about how often one of them goes down
- faq_3_q, faq_3_a: FAQ about how the data is collected

Data:
${dataContext}
`, systemPrompt)

  let parsed: Record<string, string | string[]>
  try {
    const jsonMatch = prose.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
  } catch {
    return { success: false, blog_post_id: null, word_count: null, error: 'Failed to parse Claude response' }
  }

  const monitors = [statsA, statsB]
  const uptimeSvg  = buildUptimeChart(monitors)
  const responseSvg = buildResponseTimeChart(monitors)
  const incidentSvg = buildIncidentChart(monitors)
  const featureSvg  = buildFeatureImageSvg(category.emoji, category.display_name, `${mA.display_name} vs ${mB.display_name}`, periodLabel)

  const content = buildPostHtml({
    featureSvg,
    category,
    title,
    periodLabel,
    intro:           String(parsed.intro ?? ''),
    tldr:            Array.isArray(parsed.tldr) ? parsed.tldr : [],
    uptimeChartSvg:  uptimeSvg,
    uptimeAnalysis:  String(parsed.uptime_analysis ?? ''),
    responseChartSvg: responseSvg,
    responseAnalysis: String(parsed.response_analysis ?? ''),
    incidentChartSvg: incidentSvg,
    incidentAnalysis: String(parsed.incident_analysis ?? ''),
    historicalContext: String(parsed.historical_note ?? ''),
    recommendation:  String(parsed.recommendation ?? ''),
    relatedLinks: [
      { href: `/blog/${category.slug}-reliability-leaderboard`, text: `${category.display_name} Reliability Leaderboard — ${periodLabel}` },
      { href: `/tracker/${mA.domain}`, text: `${mA.display_name} Uptime — Live Status & History` },
      { href: `/tracker/${mB.domain}`, text: `${mB.display_name} Uptime — Live Status & History` },
    ],
    faqs: [
      { q: String(parsed.faq_1_q ?? `Which is more reliable — ${mA.display_name} or ${mB.display_name}?`), a: String(parsed.faq_1_a ?? '') },
      { q: String(parsed.faq_2_q ?? `How often does ${mA.display_name} go down?`),                         a: String(parsed.faq_2_a ?? '') },
      { q: String(parsed.faq_3_q ?? 'How does Uptrue collect this data?'),                                  a: String(parsed.faq_3_a ?? '') },
    ],
  })

  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length

  const post = await createBlogPost({
    title,
    slug: buildSlug(title),
    excerpt: String(parsed.intro ?? '').slice(0, 200),
    content: { html: content },
    category: category.slug,
    status: 'pending_approval',
    seo_title: title,
    seo_description: String(parsed.intro ?? '').slice(0, 160),
    tags: ['pmb', 'weekly', category.slug, mA.domain, mB.domain, 'uptime-comparison'],
    published_at: null,
  })

  if (!post) return { success: false, blog_post_id: null, word_count: null, error: 'Failed to save blog post' }

  logger.info('PMB pairwise post generated', { runId: run.id, postId: post.id, title })
  return { success: true, blog_post_id: post.id, word_count: wordCount }
}

// =============================================================================
// Main generator — leaderboard (category-level ranking)
// =============================================================================

async function generateLeaderboardPost(run: PmbRun, category: PmbCategory): Promise<PmbGenerateResult> {
  const { data: monitors } = await db()
    .from('public_monitors')
    .select('id, domain, display_name')
    .eq('pmb_enabled', true)
    .eq('pmb_category', category.slug)
    .eq('is_active', true)
    .order('display_name')

  if (!monitors || monitors.length < 2) {
    return { success: false, blog_post_id: null, word_count: null, error: 'Not enough monitors for leaderboard' }
  }

  const stats = await Promise.all(
    (monitors as Array<{ id: string; domain: string; display_name: string }>).map(m =>
      getMonitorStats(m.id, m.domain, m.display_name)
    )
  )

  const ranked = stats.sort((a, b) => b.uptime_pct - a.uptime_pct)
  const periodLabel = `Week of ${new Date(run.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  const title = `${category.display_name} Reliability Leaderboard — ${periodLabel}`

  const dataContext = ranked.map((m, i) =>
    `#${i + 1} ${m.display_name}: ${m.uptime_pct}% uptime, ${m.avg_response_ms ?? 'N/A'}ms, ${m.incident_count} incidents`
  ).join('\n')

  const systemPrompt = `You are a technical writer for Uptrue, an independent uptime monitoring service. Write a factual leaderboard summary.`

  const prose = await callClaude(`
Given this ${category.display_name} reliability ranking data for ${periodLabel}, write a JSON object with:
- intro: 2-3 sentence overview of the leaderboard results
- tldr: array of 4 bullet strings with key findings
- analysis: 3-4 sentences analysing the rankings, who leads and why it matters
- historical_note: 1-2 sentences about reliability trends in this space
- recommendation: 2 sentences on what to consider when choosing a provider in this category
- faq_1_q, faq_1_a: FAQ about the most reliable provider in this category
- faq_2_q, faq_2_a: FAQ about how the ranking is determined
- faq_3_q, faq_3_a: FAQ about how to get alerted when a provider goes down

Rankings:
${dataContext}
`, systemPrompt, 'sonnet')

  let parsed: Record<string, string | string[]>
  try {
    const jsonMatch = prose.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
  } catch {
    return { success: false, blog_post_id: null, word_count: null, error: 'Failed to parse Claude response' }
  }

  const uptimeSvg   = buildUptimeChart(ranked.slice(0, 10))
  const responseSvg = buildResponseTimeChart(ranked.slice(0, 10))
  const incidentSvg = buildIncidentChart(ranked.slice(0, 10))
  const featureSvg  = buildFeatureImageSvg(category.emoji, category.display_name, `${category.display_name} Reliability Leaderboard`, periodLabel)

  const content = buildPostHtml({
    featureSvg,
    category,
    title,
    periodLabel,
    intro:           String(parsed.intro ?? ''),
    tldr:            Array.isArray(parsed.tldr) ? parsed.tldr : [],
    uptimeChartSvg:  uptimeSvg,
    uptimeAnalysis:  String(parsed.analysis ?? ''),
    responseChartSvg: responseSvg,
    responseAnalysis: 'Response time comparison across all ranked providers.',
    incidentChartSvg: incidentSvg,
    incidentAnalysis: 'Incident frequency and total downtime across the ranking period.',
    historicalContext: String(parsed.historical_note ?? ''),
    recommendation:  String(parsed.recommendation ?? ''),
    relatedLinks: ranked.slice(0, 5).map(m => ({
      href: `/tracker/${m.domain}`,
      text: `${m.display_name} — Live Status & Uptime History`,
    })),
    faqs: [
      { q: String(parsed.faq_1_q ?? `Which ${category.display_name} provider has the best uptime?`), a: String(parsed.faq_1_a ?? '') },
      { q: String(parsed.faq_2_q ?? 'How is the reliability ranking determined?'),                    a: String(parsed.faq_2_a ?? '') },
      { q: String(parsed.faq_3_q ?? 'How can I get alerted when a provider goes down?'),              a: String(parsed.faq_3_a ?? '') },
    ],
  })

  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length

  const post = await createBlogPost({
    title,
    slug: buildSlug(title),
    excerpt: String(parsed.intro ?? '').slice(0, 200),
    content: { html: content },
    category: category.slug,
    status: 'pending_approval',
    seo_title: title,
    seo_description: String(parsed.intro ?? '').slice(0, 160),
    tags: ['pmb', 'weekly', 'leaderboard', category.slug],
    published_at: null,
  })

  if (!post) return { success: false, blog_post_id: null, word_count: null, error: 'Failed to save blog post' }

  logger.info('PMB leaderboard post generated', { runId: run.id, postId: post.id, title })
  return { success: true, blog_post_id: post.id, word_count: wordCount }
}

// =============================================================================
// Entry point
// =============================================================================

export async function generatePmbPost(run: PmbRun): Promise<PmbGenerateResult> {
  try {
    // Load category
    const { data: catData } = await db()
      .from('pmb_categories')
      .select('*')
      .eq('slug', run.category_slug)
      .single()

    if (!catData) {
      return { success: false, blog_post_id: null, word_count: null, error: `Category not found: ${run.category_slug}` }
    }

    const category = catData as PmbCategory

    switch (run.post_type) {
      case 'pairwise':
        return await generatePairwisePost(run, category)
      case 'leaderboard':
        return await generateLeaderboardPost(run, category)
      default:
        return { success: false, blog_post_id: null, word_count: null, error: `Unsupported post_type: ${run.post_type}` }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('PMB generator error', { runId: run.id, error: msg })
    return { success: false, blog_post_id: null, word_count: null, error: msg }
  }
}
