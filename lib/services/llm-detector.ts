import { logger } from '@/lib/utils/logger'
import type { FeedItem } from './feed-fetcher'

// =============================================================================
// Types
// =============================================================================

export interface DetectedLLM {
  name: string           // e.g. "Gemini Ultra 2"
  company: string        // e.g. "Google"
  sourceKey: string      // normalised slug for dedup e.g. "google-gemini-ultra-2"
  confidence: number     // 0-100
  sourceItems: FeedItem[]
  summary: string        // brief description of what was found
}

// =============================================================================
// Launch signal keywords
// =============================================================================

// Strong action signals - suggest something new is happening
const LAUNCH_VERBS = [
  'launches', 'launched', 'releases', 'released', 'introduces', 'introduced',
  'announces', 'announced', 'unveils', 'unveiled', 'debuts', 'debuted',
  'open-sources', 'open sources', 'drops', 'ships',
]

// Model type indicators
const MODEL_INDICATORS = [
  'llm', 'language model', 'foundation model', 'ai model', 'large language',
  'generative ai', 'multimodal model', 'reasoning model', 'chat model',
  'code model', 'vision model', 'open source model', 'open-source model',
]

// Known companies/labs - boost confidence if found alongside model signals
const KNOWN_AI_LABS = [
  'openai', 'anthropic', 'google deepmind', 'deepmind', 'google', 'meta ai',
  'meta', 'mistral', 'cohere', 'ai21', 'hugging face', 'huggingface',
  'stability ai', 'stability', 'xai', 'elon musk', 'inflection', 'adept',
  'databricks', 'together ai', 'together', 'perplexity', 'nvidia', 'apple',
  'microsoft', 'amazon', 'alibaba', 'baidu', 'tencent', 'samsung', 'qualcomm',
]

// Well-known model name fragments - strong signal
const MODEL_NAME_FRAGMENTS = [
  'gpt-', 'gpt4', 'gpt 4', 'claude', 'gemini', 'llama', 'mistral', 'falcon',
  'phi-', 'phi ', 'qwen', 'yi-', 'mixtral', 'command', 'cohere', 'palm',
  'bard', 'copilot', 'grok', 'inflection', 'persimmon', 'mpt-', 'bloom',
  'stablelm', 'dolly', 'vicuna', 'alpaca', 'orca', 'wizard', 'solar',
  'deepseek', 'intern', 'baichuan', 'chatglm', 'tigerbot', 'aquila',
]

// =============================================================================
// Scoring
// =============================================================================

const SOURCE_CREDIBILITY: Record<string, number> = {
  press_wire: 30,
  ai_specific: 25,
  tech_news: 20,
  community: 10,
}

function scoreItem(title: string, summary: string, sourceCategory: string): number {
  const text = `${title} ${summary}`.toLowerCase()
  let score = 0

  // Launch verb in title = strong signal
  const titleLower = title.toLowerCase()
  for (const verb of LAUNCH_VERBS) {
    if (titleLower.includes(verb)) { score += 20; break }
  }

  // Model indicator anywhere
  for (const indicator of MODEL_INDICATORS) {
    if (text.includes(indicator)) { score += 15; break }
  }

  // Known model name fragment
  for (const fragment of MODEL_NAME_FRAGMENTS) {
    if (text.includes(fragment)) { score += 20; break }
  }

  // Known AI lab mention
  for (const lab of KNOWN_AI_LABS) {
    if (text.includes(lab)) { score += 10; break }
  }

  // Source credibility
  score += SOURCE_CREDIBILITY[sourceCategory] ?? 5

  return Math.min(score, 100)
}

// =============================================================================
// Extract a normalised LLM name + company from a feed item
// =============================================================================

function extractLLMName(title: string): { name: string; company: string } | null {
  // Patterns like:
  //   "Google launches Gemini Ultra 2"
  //   "Meta releases Llama 3.1"
  //   "Mistral AI unveils Mistral Large 2"
  //   "Anthropic announces Claude 3.5 Opus"

  const patterns = [
    // "Company verb ModelName"
    /^(.+?)\s+(?:launches?|releases?|introduces?|announces?|unveils?|debuts?|open-sources?|ships?)\s+(.+?)(?:\s*[--:|,]|$)/i,
    // "ModelName is here / is now available"
    /^(.+?)\s+(?:is\s+(?:here|now\s+available|live|out)|now\s+available)/i,
  ]

  for (const pattern of patterns) {
    const m = title.match(pattern)
    if (m) {
      const companyOrName = m[1]?.trim()
      const modelName = m[2]?.trim()

      // Check if first group looks like a company name
      const isCompany = KNOWN_AI_LABS.some(lab =>
        companyOrName?.toLowerCase().includes(lab)
      )

      if (isCompany && modelName) {
        return { name: modelName.slice(0, 80), company: companyOrName.slice(0, 50) }
      }
    }
  }

  // Fallback: look for known model fragments in title
  for (const fragment of MODEL_NAME_FRAGMENTS) {
    if (title.toLowerCase().includes(fragment)) {
      // Extract the surrounding context as the model name
      const idx = title.toLowerCase().indexOf(fragment)
      const extracted = title.slice(Math.max(0, idx - 5), idx + 40).trim()
      return { name: extracted.slice(0, 80), company: 'Unknown' }
    }
  }

  return null
}

function toSourceKey(name: string, company: string): string {
  return `${company}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// =============================================================================
// Main detection function
// =============================================================================

export function detectLLMLaunches(
  items: Array<FeedItem & { sourceCategory?: string }>,
  alreadyProcessed: Set<string>
): DetectedLLM[] {
  // Score all items
  const scored = items.map(item => ({
    item,
    score: scoreItem(item.title, item.summary ?? '', item.sourceCategory ?? 'community'),
  }))

  // Filter items with meaningful signal
  const candidates = scored.filter(s => s.score >= 60)

  if (candidates.length === 0) return []

  // Group by extracted LLM name to cluster multiple sources about the same launch
  const grouped = new Map<string, { llm: { name: string; company: string }; items: FeedItem[]; maxScore: number }>()

  for (const { item, score } of candidates) {
    const extracted = extractLLMName(item.title)
    if (!extracted) continue

    const key = toSourceKey(extracted.name, extracted.company)

    // Skip already processed
    if (alreadyProcessed.has(key)) continue

    if (grouped.has(key)) {
      const existing = grouped.get(key)!
      existing.items.push(item)
      existing.maxScore = Math.max(existing.maxScore, score)
    } else {
      grouped.set(key, { llm: extracted, items: [item], maxScore: score })
    }
  }

  const results: DetectedLLM[] = []

  for (const [sourceKey, { llm, items: groupItems, maxScore }] of grouped.entries()) {
    // Boost confidence if multiple sources cover the same launch
    const multiSourceBoost = Math.min((groupItems.length - 1) * 10, 20)
    const confidence = Math.min(maxScore + multiSourceBoost, 100)

    // Only include if confidence is meaningful
    if (confidence < 60) continue

    const summary = groupItems[0].summary
      ?? `${llm.company} has announced or launched ${llm.name}. Found in ${groupItems.length} source(s).`

    results.push({
      name: llm.name,
      company: llm.company,
      sourceKey,
      confidence,
      sourceItems: groupItems,
      summary: summary.slice(0, 500),
    })

    logger.info('LLM launch detected', {
      name: llm.name,
      company: llm.company,
      confidence,
      sources: groupItems.length,
    })
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence)
}
