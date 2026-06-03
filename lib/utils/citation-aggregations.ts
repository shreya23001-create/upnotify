/**
 * Pure aggregation helpers for the citation run results page.
 * Extracted into a separate module so the logic can be unit-tested
 * without spinning up React or pulling in DB types.
 */

export interface CompetitorEntry {
  domain:      string
  engineCount: number
  isUser:      boolean
}

interface ResultLike {
  engine_id:     string
  keyword:       string
  cited:         boolean | null
  source_urls:   string[]
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() }
  catch { return '' }
}

// Group competitor URLs by keyword. For each keyword, count how many
// distinct engines surfaced each non-user domain at least once. Includes
// the user's own domain as an entry so the leaderboard shows where the
// user stands vs each competitor.
export function aggregateCompetitorsByKeyword(
  results: ResultLike[],
  ownDomain: string,
): Record<string, CompetitorEntry[]> {
  const cleanOwn = ownDomain.replace(/^www\./, '').toLowerCase()
  const out: Record<string, CompetitorEntry[]> = {}

  // Group results by keyword
  const byKeyword: Record<string, ResultLike[]> = {}
  for (const r of results) {
    if (!byKeyword[r.keyword]) byKeyword[r.keyword] = []
    byKeyword[r.keyword].push(r)
  }

  for (const [keyword, keyResults] of Object.entries(byKeyword)) {
    // For each domain, collect the set of engine_ids that surfaced it
    const domainEngines: Record<string, Set<string>> = {}

    for (const r of keyResults) {
      const seenInThisResult = new Set<string>()
      for (const url of r.source_urls ?? []) {
        const d = extractDomain(url)
        if (d) seenInThisResult.add(d)
      }
      for (const d of seenInThisResult) {
        if (!domainEngines[d]) domainEngines[d] = new Set()
        domainEngines[d].add(r.engine_id)
      }
    }

    // Always include the user's own domain — based on cited flag, not URL match
    // (response-text-cited engines like ChatGPT don't return source URLs)
    const userEngines = new Set<string>(
      keyResults.filter(r => r.cited === true).map(r => r.engine_id),
    )

    const entries: CompetitorEntry[] = Object.entries(domainEngines)
      .filter(([d]) => d !== cleanOwn && !d.endsWith(`.${cleanOwn}`))  // exclude user's own
      .map(([domain, engineSet]) => ({
        domain,
        engineCount: engineSet.size,
        isUser: false,
      }))

    // Add user as an entry (always present, even with 0)
    entries.push({
      domain:      cleanOwn,
      engineCount: userEngines.size,
      isUser:      true,
    })

    // Sort by engineCount desc, then domain asc for stable ordering
    entries.sort((a, b) => b.engineCount - a.engineCount || a.domain.localeCompare(b.domain))

    out[keyword] = entries
  }

  return out
}

export interface PerKeywordVisibility {
  keyword:       string
  citedEngines:  string[]   // engine names (or fallback labels)
  totalEngines:  number
  scorePct:      number     // citedEngines.length / totalEngines × 100
}

interface EngineLite {
  id: string
  name: string
}

// Build a per-keyword visibility summary for the table at the top of the
// run page. Counts how many engines cited the user for each keyword.
export function perKeywordVisibility(
  results:   ResultLike[],
  engineMap: Record<string, EngineLite>,
): PerKeywordVisibility[] {
  const byKeyword: Record<string, ResultLike[]> = {}
  const keywordOrder: string[] = []
  for (const r of results) {
    if (!byKeyword[r.keyword]) {
      byKeyword[r.keyword] = []
      keywordOrder.push(r.keyword)
    }
    byKeyword[r.keyword].push(r)
  }

  return keywordOrder.map(keyword => {
    const items   = byKeyword[keyword]
    const cited   = items.filter(r => r.cited === true)
    const total   = items.length
    const scorePct = total > 0 ? Math.round((cited.length / total) * 100) : 0
    return {
      keyword,
      citedEngines: cited.map(r => engineMap[r.engine_id]?.name ?? '[deactivated engine]'),
      totalEngines: total,
      scorePct,
    }
  })
}
