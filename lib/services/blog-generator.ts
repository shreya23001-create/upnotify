import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApprovalTokens } from '@/lib/db/blog-approval-tokens'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import type { OutageResearch } from '@/lib/services/outage-researcher'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OutageContext {
  siteDisplayName: string   // e.g. "GitHub"
  siteDomain: string        // e.g. "github.com"
  siteCategory: string      // e.g. "developer-tools"
  errorMessage: string      // e.g. "Timeout after 15000ms"
  statusCode: number | null // e.g. 503
  startedAt: string         // ISO timestamp
  incidentId: string        // public_incidents.id
  research?: OutageResearch // Optional — enriches the post if available
}

export interface GeneratedBlogDraft {
  blogPostId: string
  title: string
  slug: string
  excerpt: string
  bodyMarkdown: string
  sourcesCount: number
  approveToken: string
  rejectToken: string
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

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

function formatReadableDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

// ---------------------------------------------------------------------------
// Build research context for the prompt
// ---------------------------------------------------------------------------

function buildResearchContext(research: OutageResearch): string {
  const lines: string[] = []

  if (research.officialStatus) {
    lines.push(`== OFFICIAL STATUS PAGE (${research.officialStatusUrl}) ==`)
    lines.push(research.officialStatus.slice(0, 1500))
    lines.push('')
  }

  if (research.articles.length > 0) {
    lines.push('== EXTERNAL SOURCES ==')
    for (const article of research.articles.slice(0, 12)) {
      lines.push(`Source: ${article.source}`)
      lines.push(`Title: ${article.title}`)
      lines.push(`URL: ${article.url}`)
      if (article.snippet) lines.push(`Snippet: ${article.snippet.slice(0, 300)}`)
      if (article.publishedAt) lines.push(`Published: ${article.publishedAt}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Duplicate check
// ---------------------------------------------------------------------------

async function blogExistsForIncident(incidentId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('source_public_incident_id', incidentId)

  return (count ?? 0) > 0
}

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

/**
 * Generates an outage blog post using Claude + real-time research from
 * multiple sources. Saves as pending_approval and creates approval tokens
 * for admin email review. Safe to call multiple times — deduplicates by incident ID.
 */
export async function generateOutageBlogPost(ctx: OutageContext): Promise<GeneratedBlogDraft | null> {
  const exists = await blogExistsForIncident(ctx.incidentId)
  if (exists) {
    logger.info('Blog post already exists for incident — skipping', { incidentId: ctx.incidentId })
    return null
  }

  const config = getServerConfig()
  if (!config.anthropic.apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set — skipping outage blog generation')
    return null
  }

  const client = new Anthropic({ apiKey: config.anthropic.apiKey })
  const detectedAt = formatReadableDate(ctx.startedAt)
  const errorDetail = ctx.statusCode
    ? `HTTP ${ctx.statusCode} — ${ctx.errorMessage}`
    : ctx.errorMessage

  const hasResearch = ctx.research?.hasRealData
  const researchBlock = hasResearch ? buildResearchContext(ctx.research!) : ''

  const prompt = `You are a technical writer for Uptrue, an independent uptime monitoring platform.
Write a blog post sharing Uptrue's perspective on a possible service issue we detected. The tone is calm, helpful, and informational — like a knowledgeable friend sharing what they're seeing, not a news reporter asserting facts. We are not in conflict with anyone.

Site: ${ctx.siteDisplayName} (${ctx.siteDomain})
Our monitors flagged a possible issue at: ${detectedAt}
What our monitor saw: ${errorDetail}

${hasResearch ? `WHAT WE FOUND WHEN WE LOOKED FURTHER (use this to enrich the post):
${researchBlock}` : 'No additional research data — write based on what our monitor detected only.'}

Write the post in Markdown as Uptrue's honest opinion and observation. The post must:
1. Open from Uptrue's perspective — "our monitors picked up what looks like an issue with ${ctx.siteDisplayName}" — frame the whole post as what we are seeing and what we think, not as reported fact. Use natural opinion language throughout: "it looks like", "from what we can see", "our monitors suggest", "it appears that", "based on what we're observing".
2. Include a "What Our Monitors Are Showing" section — share what Uptrue detected (error type, time, what it could mean) in plain language. If the official status page has useful information, summarise it and link to it. If things are unclear, say so honestly — "we don't have a full picture yet".
3. Include a "What People Are Saying" section if there are social/Reddit mentions — paraphrase naturally, do NOT copy verbatim. Credit generically: [reports on Reddit](url) or [posts on X](url). Do NOT include Reddit usernames, X/Twitter handles, or any personal identifiers whatsoever.
4. Include a "What You Can Do in the Meantime" section with practical workarounds — helpful, not alarmist
5. Include a "Keep an Eye on ${ctx.siteDisplayName} with Uptrue" section — a natural, low-key mention that Uptrue monitors services like this and readers can add their own for free at https://uptrue.io
6. Close by noting that this is Uptrue's view based on what we detected at the time, that the situation may have already changed, and pointing readers to ${ctx.siteDisplayName}'s official status page for the authoritative update
7. Be between 500–700 words
8. Warm, human tone — conversational, helpful, never alarmist or sensational
9. Do NOT include a title at the top (it is added separately)
10. Cite sources with Markdown links: [source name](url)
11. Do NOT fabricate anything. Do NOT include any personal usernames or social media handles.
12. We have no connection to ${ctx.siteDisplayName} — mention this lightly and naturally if it fits ("as an independent monitoring service, all we can share is what our own checks detected")

Also provide:
- EXCERPT: One sentence (max 160 chars) from Uptrue's perspective — e.g. "Our monitors picked up a possible issue with ${ctx.siteDisplayName} — here's what we're seeing."
- SEO_TITLE: (max 60 chars) — opinion framing e.g. "Is GitHub Down? What Our Monitors Are Showing — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}"
- SEO_DESCRIPTION: (max 160 chars) — helpful, opinion-based framing

Format your response EXACTLY like this:
---BODY---
[markdown body here]
---EXCERPT---
[excerpt here]
---SEO_TITLE---
[seo title here]
---SEO_DESCRIPTION---
[seo description here]`

  let body = ''
  let excerpt = ''
  let seoTitle = ''
  let seoDescription = ''

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.find(b => b.type === 'text')?.text ?? ''

    body = text.match(/---BODY---\n([\s\S]*?)---EXCERPT---/)?.[1]?.trim() ?? ''
    excerpt = text.match(/---EXCERPT---\n([\s\S]*?)---SEO_TITLE---/)?.[1]?.trim() ?? ''
    seoTitle = text.match(/---SEO_TITLE---\n([\s\S]*?)---SEO_DESCRIPTION---/)?.[1]?.trim() ?? ''
    seoDescription = text.match(/---SEO_DESCRIPTION---\n([\s\S]*?)$/)?.[1]?.trim() ?? ''

    if (!body) {
      logger.error('Blog generator returned empty body', { incidentId: ctx.incidentId })
      return null
    }
  } catch (error) {
    logger.error('Blog generation failed', {
      incidentId: ctx.incidentId,
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return null
  }

  // Build slug — unique by site + date
  const baseSlug = `is-${toSlug(ctx.siteDisplayName)}-down-${dateSlug()}`
  let slug = baseSlug
  const supabase = createAdminClient()

  const { count: slugCount } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)

  if ((slugCount ?? 0) > 0) {
    slug = `${baseSlug}-${Date.now()}`
  }

  const title = seoTitle || `Is ${ctx.siteDisplayName} Down? What Our Monitors Are Showing — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  const postExcerpt = excerpt || `Our monitors picked up a possible issue with ${ctx.siteDisplayName} at ${detectedAt}. Here's what we're seeing — check the official status page for the latest.`

  const content = {
    body,
    midCta: {
      heading: `Is ${ctx.siteDisplayName} affecting your work?`,
      buttonLabel: 'Monitor Your Sites Free',
      buttonUrl: 'https://uptrue.io',
    },
    endCta: {
      heading: 'Never be caught off guard by downtime again',
      buttonLabel: 'Start Free Monitoring',
      buttonUrl: 'https://uptrue.io',
    },
    sources: ctx.research?.articles.map(a => ({ title: a.title, url: a.url, source: a.source })) ?? [],
  }

  // Only use incidentId as FK if it's a real UUID (not a test/fake ID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const sourceIncidentId = uuidRegex.test(ctx.incidentId) ? ctx.incidentId : null

  // Save as pending_approval — admin reviews before publishing
  const { data: post, error: insertError } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      excerpt: postExcerpt,
      category: 'outage',
      tags: ['outage', ctx.siteDisplayName.toLowerCase(), 'downtime', 'is-it-down'],
      status: 'pending_approval',
      seo_title: seoTitle || title,
      seo_description: seoDescription || postExcerpt,
      auto_generated: true,
      source_public_incident_id: sourceIncidentId,
    })
    .select('id, title, slug')
    .single()

  if (insertError || !post) {
    logger.error('Failed to save auto-generated blog post', {
      incidentId: ctx.incidentId,
      error: insertError?.message,
    })
    return null
  }

  logger.info('Auto-generated blog post saved as pending_approval', { id: post.id, slug: post.slug })

  const tokens = await createApprovalTokens(post.id)
  if (!tokens) {
    logger.error('Failed to create approval tokens', { blogPostId: post.id })
    return null
  }

  return {
    blogPostId: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: postExcerpt,
    bodyMarkdown: body,
    sourcesCount: ctx.research?.articles.length ?? 0,
    approveToken: tokens.approveToken,
    rejectToken: tokens.rejectToken,
  }
}
