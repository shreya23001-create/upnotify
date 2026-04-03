import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export interface KeywordSuggestion {
  id: string
  keyword: string
  category: string
  type: 'positive' | 'negative'
  url_pattern: string | null
  description: string | null
  is_active: boolean
  display_order: number
}

/**
 * Get keyword suggestions from DB, filtered by URL pattern match.
 * Falls back to returning all active suggestions if URL is empty.
 */
export async function getKeywordSuggestionsFromDB(
  url: string
): Promise<{ positive: KeywordSuggestion[]; negative: KeywordSuggestion[] }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('keyword_suggestions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('category', { ascending: true })

  if (error) {
    logger.error('Failed to fetch keyword suggestions', { error: error.message })
    return { positive: [], negative: [] }
  }

  const all = (data ?? []) as KeywordSuggestion[]
  const urlLower = (url || '').toLowerCase()

  // Filter by URL pattern match
  const matched = all.filter(s => {
    if (!s.url_pattern) return true // no pattern = always show (security, general)
    const patterns = s.url_pattern.split('|')
    return patterns.some(p => urlLower.includes(p.trim()))
  })

  return {
    positive: matched.filter(s => s.type === 'positive'),
    negative: matched.filter(s => s.type === 'negative'),
  }
}

/**
 * Get ALL keyword suggestions (for admin management).
 */
export async function getAllKeywordSuggestions(): Promise<KeywordSuggestion[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('keyword_suggestions')
    .select('*')
    .order('category', { ascending: true })
    .order('type', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) {
    logger.error('Failed to fetch all keyword suggestions', { error: error.message })
    return []
  }

  return (data ?? []) as KeywordSuggestion[]
}

/**
 * Get count of active suggestions (for marketing: "150+ preloaded keywords").
 */
export async function getKeywordSuggestionCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .from('keyword_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) {
    logger.error('Failed to count keyword suggestions', { error: error.message })
    return 0
  }

  return count ?? 0
}
