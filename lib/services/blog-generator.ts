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

  const prompt = `You are a technical writer for Uptrue, an uptime monitoring platform.
Write a blog post in the format of "Is [Site] Down?" that will rank on Google when people search for current outages.

Site: ${ctx.siteDisplayName} (${ctx.siteDomain})
Outage detected by Uptrue at: ${detectedAt}
Error detected: ${errorDetail}

${hasResearch ? `REAL-TIME RESEARCH DATA (use this to write a more informed, accurate post):
${researchBlock}` : 'No external research data available — write based on the detected error only.'}

Write the post in Markdown. The post must:
1. Open with a clear statement that Uptrue detected an outage for ${ctx.siteDisplayName}
2. Include a "What We Know So Far" section — use the research data to explain the likely cause, affected services, and timeline. If the official status page has information, summarise it accurately.
3. Include a "What Users Are Saying" section if there are social/Reddit mentions — summarise the user reports naturally (do NOT copy verbatim). Credit sources as inline links e.g. "reports on Reddit" or "posts on X".
4. Include a "What to Do While ${ctx.siteDisplayName} Is Down" section with practical workarounds
5. Include a "Monitor ${ctx.siteDisplayName} for Free" section with a natural call to action to sign up at https://uptrue.io — do NOT make it salesy, frame it as a helpful tool
6. Close with a note that Uptrue will update the post as the situation develops
7. Be between 500–700 words
8. Use a human, helpful tone — not robotic or marketing-heavy
9. Do NOT include a title at the top (it is added separately)
10. If you cite a specific source, use Markdown link syntax: [source name](url)
11. Do NOT fabricate facts — if research data is thin, say "details are still emerging"

Also provide:
- EXCERPT: One sentence (max 160 chars) summarising the post for Google
- SEO_TITLE: (max 60 chars) e.g. "Is GitHub Down? ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} Outage"
- SEO_DESCRIPTION: (max 160 chars) for the meta description

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

  const title = seoTitle || `Is ${ctx.siteDisplayName} Down? ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} Outage`
  const postExcerpt = excerpt || `${ctx.siteDisplayName} is experiencing an outage. Uptrue detected the issue at ${detectedAt}.`

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
