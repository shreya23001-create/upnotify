import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApprovalTokens } from '@/lib/db/blog-approval-tokens'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import type { FeedItem } from './feed-fetcher'
import type { DetectedLLM } from './llm-detector'

// =============================================================================
// Types
// =============================================================================

export interface TrackerContext {
  totalSites: number
  currentlyDown: number
  currentlyDegraded: number
  topUnreliable: Array<{ domain: string; displayName: string; category: string; uptimePct: number }>
  recentIncidents: Array<{ domain: string; displayName: string; startedAt: string; resolvedAt: string | null }>
  categoryCounts: Record<string, number>
}

export interface AutoblogInput {
  type: 'llm_launch' | 'custom_topic'
  // LLM launch
  llm?: DetectedLLM
  // Custom topic
  topicName?: string
  topicPrompt?: string
  topicId?: string
  // Shared
  sourceItems?: FeedItem[]
  trackerContext?: TrackerContext | null
  postToSocial?: boolean
}

export interface AutoblogDraft {
  blogPostId: string
  title: string
  slug: string
  excerpt: string
  bodyMarkdown: string
  metaDescription: string
  primaryKeyword: string
  confidenceScore: number
  sourcesCount: number
  approveToken: string
  rejectToken: string
}

// =============================================================================
// Editorial system prompt — applied to every single generation
// =============================================================================

const EDITORIAL_SYSTEM_PROMPT = `You are a staff writer for Uptrue (uptrue.io), a website monitoring and uptime intelligence platform.
You write for technically literate readers — developers, startup founders, SaaS product teams, IT managers, and anyone who cares about keeping their web presence healthy and visible.

=== VOICE & TONE ===
- Write like a knowledgeable journalist who is genuinely curious — not a content marketer, not a press release rewriter
- Be direct, slightly opinionated, and human. Use "you" to speak directly to the reader
- Mix short punchy sentences with longer ones. Vary the rhythm
- Opinions are welcome: "This is significant because...", "What's interesting here is...", "Don't get too excited yet though..."
- React authentically: if something is genuinely exciting, say so. If something is vague and overhyped, call it out
- Acknowledge uncertainty naturally: "We don't know yet whether...", "Nobody's confirmed this but...", "Take this with a pinch of salt for now"
- No hollow openers. Never start with "In today's..." or "As the world of X continues to..." or a dictionary definition

=== BANNED WORDS (never use any of these) ===
leverage, utilise, empower, cutting-edge, revolutionary, game-changing, seamlessly, robust, scalable, delve, realm, landscape, groundbreaking, transformative, pioneering, disruptive, paradigm, synergy, holistic, comprehensive, dynamic, innovative

=== ACCURACY (non-negotiable) ===
- Every factual claim must come from the provided source material only
- Use suggestive language for anything not 100% confirmed: "appears to", "reportedly", "seems to", "suggests", "may", "according to [source]"
- If information is unavailable or unverifiable: write "we couldn't confirm this" or "no official documentation exists yet" — NEVER fabricate
- Never invent user agent strings, API endpoints, submission URLs, or technical specs
- Never invent statistics or figures without a cited source
- If fewer than 3 verifiable facts exist, open with: "There isn't much official information about [X] yet. This post reflects what's publicly known at time of writing — we'll update it as more details emerge."
- Every source reference must link to a real URL from the provided source material

=== POST STRUCTURE ===
Every post must follow this structure exactly:
1. HOOK (2-3 sentences) — A question, a surprising fact, a contradiction, or a bold direct statement. Never a definition. Never generic.
2. WHAT WE KNOW — Verified facts from sources, clearly attributed with inline Markdown links
3. WHAT'S STILL UNCLEAR — Honest gaps, unconfirmed details, things worth watching
4. WHAT THIS MEANS FOR YOU — Practical, actionable implications for the reader's work
5. FAQ (3-5 questions) — Plain language questions a real person would actually ask, with direct answers
6. SOURCES — Numbered list of all referenced URLs with descriptive names

=== SEO ===
- Title: Primary keyword near the front, under 60 characters, catchy and specific — not generic
- First paragraph: Contains primary keyword naturally (not stuffed)
- H2 headings: Natural keyword variations, scannable
- FAQ answers: Write as standalone sentences that an AI engine could extract and cite independently
- Include at least 2 natural internal links to Uptrue pages: https://uptrue.io, https://uptrue.io/tracker, https://uptrue.io/tools, https://uptrue.io/score

=== AI SEO (citations) ===
- State key facts as clear, attributable sentences that AI engines can extract
- Example: "As of [date], [Model Name] does not appear to have a public submission process for website indexing."
- Include the post date context so AI engines know the freshness

=== SELF-CHECK BEFORE FINISHING ===
Before you finalise your response:
1. Does this sound like a human journalist wrote it? If not, rewrite the weakest sections
2. Does the first paragraph directly answer the implied search query?
3. Are key facts in standalone sentences an AI engine could cite independently?
4. Have you used any banned words? Remove them
5. Would a smart, slightly opinionated tech writer put their name on this?`

// =============================================================================
// Slug + date helpers
// =============================================================================

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function dateSlug(): string {
  const d = new Date()
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  return `${d.getFullYear()}-${months[d.getMonth()]}-${String(d.getDate()).padStart(2, '0')}`
}

// =============================================================================
// Build user prompt per generation type
// =============================================================================

function buildLLMPrompt(llm: DetectedLLM): string {
  const sourceLines = llm.sourceItems
    .slice(0, 10)
    .map((item, i) =>
      `[${i + 1}] ${item.sourceName}\nTitle: ${item.title}\nURL: ${item.url}\n${item.summary ? `Summary: ${item.summary.slice(0, 300)}` : ''}`
    )
    .join('\n\n')

  return `A new AI model has been detected across our news feeds.

Model name: ${llm.name}
Company / lab: ${llm.company}
Detection confidence: ${llm.confidence}/100
What we found: ${llm.summary}

SOURCE ARTICLES (use ONLY these — do not invent additional information):
${sourceLines}

Write a blog post aimed at website owners, developers, and SEO professionals.

The post should answer these questions — but ONLY if the source articles confirm them:
1. What is ${llm.name}? (keep it brief — 2-3 sentences)
2. Does it crawl the web? What user agent does it use? (cite official docs only — say "we couldn't confirm this" if not in sources)
3. Does it support LLMs.txt? (cite if found — say "no information available yet" if not)
4. Is there a submission or website indexing process? (cite official docs only)
5. What type of content does it appear to favour or cite? (cite if found)
6. What should website owners do right now to optimise for it?

Include a natural mention of Uptrue's AI Visibility feature for tracking citations: https://uptrue.io

Primary keyword for SEO: "how to get cited by ${llm.name}" or "is ${llm.name} crawling the web" or similar

Today's date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

Return your response in EXACTLY this format (include the delimiters):
---TITLE---
[catchy title under 60 chars]
---META---
[meta description 150-160 chars]
---KEYWORD---
[primary keyword phrase]
---BODY---
[full post in Markdown, 600-900 words]
---EXCERPT---
[one sentence excerpt, max 160 chars]`
}

function buildTopicPrompt(
  topicName: string,
  topicPrompt: string,
  sourceItems: FeedItem[],
  trackerContext: TrackerContext | null
): string {
  const sourceLines = sourceItems
    .slice(0, 12)
    .map((item, i) =>
      `[${i + 1}] ${item.sourceName}\nTitle: ${item.title}\nURL: ${item.url}\n${item.summary ? `Summary: ${item.summary.slice(0, 300)}` : ''}`
    )
    .join('\n\n')

  let trackerBlock = ''
  if (trackerContext) {
    trackerBlock = `
LIVE UPTRUE TRACKER DATA (public data only — safe to reference):
- Total sites monitored: ${trackerContext.totalSites}
- Currently down: ${trackerContext.currentlyDown}
- Currently degraded: ${trackerContext.currentlyDegraded}
${trackerContext.topUnreliable.length > 0 ? `- Most unreliable sites (last 30 days):\n${trackerContext.topUnreliable.slice(0, 5).map(s => `  • ${s.displayName} (${s.category}): ${s.uptimePct}% uptime`).join('\n')}` : ''}
${trackerContext.recentIncidents.length > 0 ? `- Recent notable incidents:\n${trackerContext.recentIncidents.slice(0, 5).map(i => `  • ${i.displayName}: down at ${new Date(i.startedAt).toLocaleDateString('en-GB')}${i.resolvedAt ? ` (resolved)` : ` (still ongoing)`}`).join('\n')}` : ''}
`
  }

  return `Topic: ${topicName}

Your instructions:
${topicPrompt}

${sourceLines ? `RELEVANT SOURCE ARTICLES (use these to inform and cite the post — only reference what is confirmed):\n${sourceLines}` : 'No source articles found for this topic. Write based on established knowledge only — clearly flag anything that cannot be cited.'}

${trackerBlock}

Today's date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

Return your response in EXACTLY this format (include the delimiters):
---TITLE---
[catchy title under 60 chars]
---META---
[meta description 150-160 chars]
---KEYWORD---
[primary keyword phrase]
---BODY---
[full post in Markdown, following the required structure]
---EXCERPT---
[one sentence excerpt, max 160 chars]`
}

// =============================================================================
// Parse Claude response
// =============================================================================

interface ParsedResponse {
  title: string
  metaDescription: string
  primaryKeyword: string
  body: string
  excerpt: string
}

function parseResponse(text: string): ParsedResponse | null {
  const title = text.match(/---TITLE---\n([\s\S]*?)---META---/)?.[1]?.trim() ?? ''
  const metaDescription = text.match(/---META---\n([\s\S]*?)---KEYWORD---/)?.[1]?.trim() ?? ''
  const primaryKeyword = text.match(/---KEYWORD---\n([\s\S]*?)---BODY---/)?.[1]?.trim() ?? ''
  const body = text.match(/---BODY---\n([\s\S]*?)---EXCERPT---/)?.[1]?.trim() ?? ''
  const excerpt = text.match(/---EXCERPT---\n([\s\S]*?)$/)?.[1]?.trim() ?? ''

  if (!title || !body) return null
  return { title, metaDescription, primaryKeyword, body, excerpt }
}

// =============================================================================
// Fetch public tracker context for topic runner
// =============================================================================

export async function getTrackerContext(): Promise<TrackerContext | null> {
  try {
    const supabase = createAdminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [totalRes, downRes, degradedRes, incidentRes] = await Promise.all([
      supabase.from('public_monitors').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('public_monitors').select('id', { count: 'exact', head: true }).eq('last_status', 'down').eq('is_active', true),
      supabase.from('public_monitors').select('id', { count: 'exact', head: true }).eq('last_status', 'degraded').eq('is_active', true),
      supabase.from('public_incidents').select('id, monitor_id, started_at, resolved_at').gte('started_at', thirtyDaysAgo).order('started_at', { ascending: false }).limit(20),
    ])

    // Get top unreliable sites by incident count
    const { data: monitorsData } = await supabase
      .from('public_monitors')
      .select('id, domain, display_name, category, last_status')
      .eq('is_active', true)
      .limit(200)

    // Count incidents per monitor
    const incidentCounts = new Map<string, number>()
    for (const incident of (incidentRes.data ?? [])) {
      const key = incident.monitor_id
      incidentCounts.set(key, (incidentCounts.get(key) ?? 0) + 1)
    }

    const monitors = (monitorsData ?? []) as Array<{
      id: string; domain: string; display_name: string; category: string; last_status: string
    }>

    const topUnreliable = monitors
      .filter(m => (incidentCounts.get(m.id) ?? 0) > 0)
      .sort((a, b) => (incidentCounts.get(b.id) ?? 0) - (incidentCounts.get(a.id) ?? 0))
      .slice(0, 10)
      .map(m => ({
        domain: m.domain,
        displayName: m.display_name,
        category: m.category,
        uptimePct: 100 - Math.min((incidentCounts.get(m.id) ?? 0) * 2, 20), // rough estimate
      }))

    // Get monitor map for incident display names
    const monitorMap = new Map(monitors.map(m => [m.id, m]))
    const recentIncidents = (incidentRes.data ?? []).slice(0, 10).map(i => ({
      domain: monitorMap.get(i.monitor_id)?.domain ?? 'unknown',
      displayName: monitorMap.get(i.monitor_id)?.display_name ?? 'Unknown Site',
      startedAt: i.started_at,
      resolvedAt: i.resolved_at,
    }))

    // Category counts
    const categoryCounts: Record<string, number> = {}
    for (const m of monitors) {
      categoryCounts[m.category] = (categoryCounts[m.category] ?? 0) + 1
    }

    return {
      totalSites: totalRes.count ?? 0,
      currentlyDown: downRes.count ?? 0,
      currentlyDegraded: degradedRes.count ?? 0,
      topUnreliable,
      recentIncidents,
      categoryCounts,
    }
  } catch (err) {
    logger.error('Failed to fetch tracker context', { error: err instanceof Error ? err.message : 'Unknown' })
    return null
  }
}

// =============================================================================
// Main generation function
// =============================================================================

export async function generateAutoblogPost(input: AutoblogInput): Promise<AutoblogDraft | null> {
  const config = getServerConfig()
  if (!config.anthropic.apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set — skipping autoblog generation')
    return null
  }

  // Build the user prompt
  let userPrompt: string
  let category: string
  let tags: string[]
  let sourceCount: number
  let confidenceScore: number

  if (input.type === 'llm_launch' && input.llm) {
    userPrompt = buildLLMPrompt(input.llm)
    category = 'ai-visibility'
    tags = ['ai', 'llm', 'ai-seo', input.llm.name.toLowerCase().replace(/\s+/g, '-'), 'citation']
    sourceCount = input.llm.sourceItems.length
    confidenceScore = input.llm.confidence
  } else if (input.type === 'custom_topic' && input.topicName && input.topicPrompt) {
    userPrompt = buildTopicPrompt(
      input.topicName,
      input.topicPrompt,
      input.sourceItems ?? [],
      input.trackerContext ?? null
    )
    category = 'insights'
    tags = ['monitoring', 'uptime', input.topicName.toLowerCase().replace(/\s+/g, '-')]
    sourceCount = input.sourceItems?.length ?? 0
    confidenceScore = sourceCount > 0 ? 75 : 50
  } else {
    logger.error('Invalid autoblog input', { type: input.type })
    return null
  }

  // Call Claude
  const client = new Anthropic({ apiKey: config.anthropic.apiKey })
  let parsed: ParsedResponse | null = null

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: EDITORIAL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content.find(b => b.type === 'text')?.text ?? ''
    parsed = parseResponse(text)

    if (!parsed) {
      logger.error('Autoblog generator returned unparseable response', { type: input.type })
      return null
    }
  } catch (err) {
    logger.error('Autoblog Claude API call failed', {
      type: input.type,
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return null
  }

  // Build unique slug
  const baseSlug = input.type === 'llm_launch' && input.llm
    ? `how-to-get-cited-by-${toSlug(input.llm.name)}-${dateSlug()}`
    : `${toSlug(parsed.title)}-${dateSlug()}`

  const supabase = createAdminClient()
  const { count: slugCount } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('slug', baseSlug)

  const slug = (slugCount ?? 0) > 0 ? `${baseSlug}-${Date.now()}` : baseSlug

  const content = {
    body: parsed.body,
    midCta: {
      heading: 'Keep your website visible and reliable',
      buttonLabel: 'Try Uptrue Free',
      buttonUrl: 'https://uptrue.io',
    },
    endCta: {
      heading: 'Monitor your website — and your AI citations',
      buttonLabel: 'Start Free',
      buttonUrl: 'https://uptrue.io',
    },
    sources: (input.sourceItems ?? input.llm?.sourceItems ?? []).map(s => ({
      title: s.title,
      url: s.url,
      source: s.sourceName,
    })),
    autogenerated: true,
    autoblogType: input.type,
  }

  // Save to blog_posts as pending_approval
  const { data: post, error: insertError } = await supabase
    .from('blog_posts')
    .insert({
      title: parsed.title,
      slug,
      content,
      excerpt: parsed.excerpt || parsed.title,
      category,
      tags,
      status: 'pending_approval',
      seo_title: parsed.title,
      seo_description: parsed.metaDescription || parsed.excerpt,
      auto_generated: true,
    })
    .select('id, title, slug')
    .single()

  if (insertError || !post) {
    logger.error('Failed to save autoblog post', { error: insertError?.message, type: input.type })
    return null
  }

  logger.info('Autoblog post saved as pending_approval', { id: post.id, slug: post.slug, type: input.type })

  const tokens = await createApprovalTokens(post.id)
  if (!tokens) {
    logger.error('Failed to create autoblog approval tokens', { blogPostId: post.id })
    return null
  }

  return {
    blogPostId: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: parsed.excerpt,
    bodyMarkdown: parsed.body,
    metaDescription: parsed.metaDescription,
    primaryKeyword: parsed.primaryKeyword,
    confidenceScore,
    sourcesCount: sourceCount,
    approveToken: tokens.approveToken,
    rejectToken: tokens.rejectToken,
  }
}
