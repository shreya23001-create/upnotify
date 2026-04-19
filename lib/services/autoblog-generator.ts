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

// Editorial system prompt - applied to every single generation

// =============================================================================



const EDITORIAL_SYSTEM_PROMPT = `You are a staff writer for Uptrue (uptrue.io), a website monitoring and uptime intelligence platform.
Your readers are developers, startup founders, SaaS product teams, and IT managers. They are smart, busy, and sceptical of marketing fluff.

=== WHO YOU ARE ===
You have been covering the web infrastructure and AI space for years. You have opinions. You get mildly annoyed by vague press releases. You find the genuinely interesting angle in a story even when the story seems boring at first glance. You write like someone who actually uses these tools every day.

=== VOICE - READ THIS CAREFULLY ===
- Short sentences. Then a longer one that adds texture or context. Then short again. Never three long sentences in a row.
- Never open a paragraph with: It is worth noting, This is particularly, In terms of, When it comes to, It is important to.
- Start sentences mid-thought occasionally. Which is why... Not exactly reassuring. Fair enough.
- Use contractions: it is -> its, you will -> you will, we are -> we are, do not -> don't, has not -> hasn't. Formal writing screams AI.
- Ask the reader a direct question once per section. Not rhetorical - a real question they might actually be wondering.
- React like a person: Honestly, that is a bit thin. Fair point. Here is what caught my eye.
- One paragraph somewhere in the piece should be a single sentence. Just one. Let it land.
- Vary your opener types: sometimes a fact, sometimes a contradiction, sometimes a blunt opinion, sometimes a question. Never a definition, never In today is world.

=== BANNED WORDS - INSTANT REJECT ===
leverage, utilise, empower, cutting-edge, revolutionary, game-changing, seamlessly, robust, scalable, delve, realm, landscape, groundbreaking, transformative, pioneering, disruptive, paradigm, synergy, holistic, comprehensive, dynamic, innovative, furthermore, moreover, in conclusion, to summarise, it is worth noting, it is important to, in terms of, when it comes to, this is particularly, at its core, the fact that, in the ever-evolving

=== SPECIFICITY RULES ===
- Name exact version numbers, exact dates, exact quotes from sources. Generic claims kill credibility.
- If a source says early 2025 - write early 2025, not recently.
- Quote a specific sentence from a source at least once, with attribution.
- If the story involves a company, name the specific people mentioned in sources.
- Numbers beat adjectives: dropped 40ms beats became faster. Use numbers wherever sources provide them.

=== ACCURACY (non-negotiable) ===
- Every factual claim must come from the provided source material only
- Use suggestive language for anything not confirmed: appears to, reportedly, seems to, according to [source]
- If something is unverifiable: write we could not confirm this or no official documentation exists yet - NEVER fabricate
- Never invent technical specs, user agent strings, API endpoints, or submission URLs
- If fewer than 3 verifiable facts exist: open with There is not much official information about [X] yet. Here is what is actually confirmed.
- Every source reference must link to a real URL from the provided source material

=== POST STRUCTURE ===
Follow this structure but make each section feel like the next natural thought - not a template:
1. OPENER - One unexpected angle. A contradiction, a specific surprising fact, or a blunt take. 2-3 sentences max.
2. WHAT WE KNOW - The confirmed facts. Cite sources inline with Markdown links. Be specific.
3. WHAT IS STILL UNCLEAR - Real gaps. What questions remain unanswered. Be honest about uncertainty.
4. WHAT THIS MEANS FOR YOU - Practical. Specific. What should the reader actually do or watch?
5. FAQ - 3-5 questions a real person would Google. Direct answers, no padding.
6. SOURCES - Numbered list of referenced URLs with descriptive names

=== SEO ===
- Title: Primary keyword in first 3 words, under 60 characters, specific not generic
- First paragraph: Primary keyword appears naturally in first 2 sentences
- H2 headings: Keyword variations, written as a reader would search them
- FAQ: Each answer is a complete standalone sentence an AI engine can extract and cite
- At least 2 natural internal links to: https://uptrue.io, https://uptrue.io/tracker, https://uptrue.io/tools, https://uptrue.io/score

=== AI SEO ===
- State key facts as clean attributable sentences: As of [date], [X] does not have a public submission process for website indexing.
- Include the publication date context in the first or second paragraph so AI engines understand freshness

=== SELF-CHECK BEFORE SUBMITTING ===
1. Read your opener out loud. Does it sound like a person or a press release? Rewrite if press release.
2. Find your three longest sentences. Can any be split? Split them.
3. Did you use any banned words? Remove every single one.
4. Is there at least one single-sentence paragraph?
5. Does each section start differently - not all with The, not all with a noun?
6. Would a senior engineer forward this to a colleague, or close the tab? Be honest.`



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



SOURCE ARTICLES (use ONLY these - do not invent additional information):

${sourceLines}



Write a blog post aimed at website owners, developers, and SEO professionals.



The post should answer these questions - but ONLY if the source articles confirm them:

1. What is ${llm.name}? (keep it brief - 2-3 sentences)

2. Does it crawl the web? What user agent does it use? (cite official docs only - say "we couldn't confirm this" if not in sources)

3. Does it support LLMs.txt? (cite if found - say "no information available yet" if not)

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

    .map((item, i) => {

      const content = item.fullContent

        ? `Full article content:\n${item.fullContent.slice(0, 3000)}`

        : item.summary

          ? `Summary: ${item.summary.slice(0, 300)}`

          : ''

      return `[${i + 1}] ${item.sourceName}\nTitle: ${item.title}\nURL: ${item.url}\n${content}`

    })

    .join('\n\n')



  let trackerBlock = ''

  if (trackerContext) {

    trackerBlock = `

LIVE UPTRUE TRACKER DATA (public data only - safe to reference):

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



${sourceLines ? `RELEVANT SOURCE ARTICLES (use these to inform and cite the post - only reference what is confirmed):\n${sourceLines}` : 'No source articles found for this topic. Write based on established knowledge only - clearly flag anything that cannot be cited.'}



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
  // Primary: strict delimiters with optional whitespace around the marker line
  const delimRe = (a: string, b: string) =>
    new RegExp(`---${a}---\\s*\\n([\\s\\S]*?)\\s*---${b}---`)
  const tailRe = (a: string) =>
    new RegExp(`---${a}---\\s*\\n([\\s\\S]*)$`)

  let title = text.match(delimRe('TITLE', 'META'))?.[1]?.trim() ?? ''
  let metaDescription = text.match(delimRe('META', 'KEYWORD'))?.[1]?.trim() ?? ''
  let primaryKeyword = text.match(delimRe('KEYWORD', 'BODY'))?.[1]?.trim() ?? ''
  let body = text.match(delimRe('BODY', 'EXCERPT'))?.[1]?.trim() ?? ''
  let excerpt = text.match(tailRe('EXCERPT'))?.[1]?.trim() ?? ''

  // Fallback: if body missing, capture everything after ---BODY--- to end
  if (!body) {
    body = text.match(tailRe('BODY'))?.[1]?.trim() ?? ''
    // strip excerpt block from body if present
    const excerptIdx = body.indexOf('---EXCERPT---')
    if (excerptIdx !== -1) {
      const rest = body.slice(excerptIdx + 13).trim()
      if (!excerpt) excerpt = rest
      body = body.slice(0, excerptIdx).trim()
    }
  }

  // Fallback: if title missing, try first markdown heading in body or text
  if (!title) {
    title =
      text.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
      body.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
      ''
  }

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

    throw new Error('ANTHROPIC_API_KEY is not configured in environment variables')

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
      logger.error('Autoblog Claude parse failed — raw response', {
        type: input.type,
        rawLength: text.length,
        rawPreview: text.slice(0, 500),
      })
      throw new Error('Claude API returned unparseable response — missing title or body tags')
    }

  } catch (err) {

    const msg = err instanceof Error ? err.message : 'Unknown error'

    logger.error('Autoblog Claude API call failed', { type: input.type, error: msg })

    throw new Error(`Claude API call failed: ${msg}`)

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

      heading: 'Monitor your website - and your AI citations',

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

    throw new Error(`Failed to save autoblog post to DB: ${insertError?.message ?? 'unknown DB error'}`)

  }



  logger.info('Autoblog post saved as pending_approval', { id: post.id, slug: post.slug, type: input.type })



  const tokens = await createApprovalTokens(post.id)

  if (!tokens) {

    throw new Error(`Failed to create approval tokens for post ${post.id}`)

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

