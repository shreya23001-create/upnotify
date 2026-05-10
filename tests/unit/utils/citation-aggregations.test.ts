import { describe, it, expect } from 'vitest'
import {
  aggregateCompetitorsByKeyword,
  perKeywordVisibility,
} from '@/lib/utils/citation-aggregations'

const ENGINES = {
  'engine-perplexity': { id: 'engine-perplexity', name: 'Perplexity' },
  'engine-chatgpt':    { id: 'engine-chatgpt',    name: 'ChatGPT' },
  'engine-claude':     { id: 'engine-claude',     name: 'Claude' },
  'engine-exa':        { id: 'engine-exa',        name: 'Exa' },
}

describe('aggregateCompetitorsByKeyword', () => {
  it('groups competitors by keyword and counts unique engines per domain', () => {
    const results = [
      { engine_id: 'engine-perplexity', keyword: 'visit newquay', cited: false,
        source_urls: ['https://www.visitnewquay.org', 'https://www.visitcornwall.com'] },
      { engine_id: 'engine-exa',        keyword: 'visit newquay', cited: false,
        source_urls: ['https://www.visitnewquay.org', 'https://newquay.com'] },
      { engine_id: 'engine-chatgpt',    keyword: 'visit newquay', cited: false,
        source_urls: [] },
    ]
    const result = aggregateCompetitorsByKeyword(results, 'newquay.co.uk')
    const visitNewquay = result['visit newquay']
    expect(visitNewquay).toBeDefined()
    const visitnewquayEntry = visitNewquay.find(e => e.domain === 'visitnewquay.org')
    expect(visitnewquayEntry?.engineCount).toBe(2)  // counted once per engine
    const visitcornwallEntry = visitNewquay.find(e => e.domain === 'visitcornwall.com')
    expect(visitcornwallEntry?.engineCount).toBe(1)
  })

  it('always includes the user as an entry, even with 0 citations', () => {
    const results = [
      { engine_id: 'engine-perplexity', keyword: 'foo', cited: false,
        source_urls: ['https://competitor.com'] },
    ]
    const result = aggregateCompetitorsByKeyword(results, 'mysite.com')
    const userEntry = result['foo'].find(e => e.isUser)
    expect(userEntry).toBeDefined()
    expect(userEntry?.engineCount).toBe(0)
    expect(userEntry?.domain).toBe('mysite.com')
  })

  it('counts the user based on cited flag, not URL match (covers ChatGPT-style mentions)', () => {
    const results = [
      { engine_id: 'engine-chatgpt', keyword: 'foo', cited: true,
        source_urls: [] }, // ChatGPT marked cited via response text, no URLs
      { engine_id: 'engine-claude',  keyword: 'foo', cited: true,
        source_urls: [] },
    ]
    const result = aggregateCompetitorsByKeyword(results, 'mysite.com')
    const userEntry = result['foo'].find(e => e.isUser)
    expect(userEntry?.engineCount).toBe(2)
  })

  it('excludes the user from competitor list even if URLs include the domain', () => {
    const results = [
      { engine_id: 'engine-perplexity', keyword: 'foo', cited: true,
        source_urls: ['https://www.mysite.com/page'] },
    ]
    const result = aggregateCompetitorsByKeyword(results, 'mysite.com')
    const competitors = result['foo'].filter(e => !e.isUser)
    expect(competitors.find(e => e.domain === 'mysite.com')).toBeUndefined()
  })

  it('treats www and non-www as the same domain', () => {
    const results = [
      { engine_id: 'engine-exa', keyword: 'foo', cited: false,
        source_urls: ['https://www.competitor.com', 'https://competitor.com/about'] },
    ]
    const result = aggregateCompetitorsByKeyword(results, 'mysite.com')
    const entry = result['foo'].find(e => e.domain === 'competitor.com')
    expect(entry?.engineCount).toBe(1)
  })

  it('sorts entries by engineCount desc, with ties broken alphabetically', () => {
    const results = [
      { engine_id: 'engine-a', keyword: 'foo', cited: false,
        source_urls: ['https://b.com', 'https://a.com'] },
      { engine_id: 'engine-b', keyword: 'foo', cited: false,
        source_urls: ['https://b.com'] },
    ]
    const result = aggregateCompetitorsByKeyword(results, 'mysite.com')
    expect(result['foo'][0].domain).toBe('b.com')  // 2 engines, comes first
    // a.com and mysite.com (user) both have 1 engine — tie broken alphabetically
    const tied = result['foo'].slice(1).map(e => e.domain)
    expect(tied).toContain('a.com')
    expect(tied).toContain('mysite.com')
  })

  it('handles malformed URLs gracefully', () => {
    const results = [
      { engine_id: 'engine-a', keyword: 'foo', cited: false,
        source_urls: ['not a url', '', 'https://valid.com'] },
    ]
    const result = aggregateCompetitorsByKeyword(results, 'mysite.com')
    expect(result['foo'].find(e => e.domain === 'valid.com')).toBeDefined()
    // No entries for malformed inputs
    expect(result['foo'].length).toBe(2) // valid.com + user
  })
})

describe('perKeywordVisibility', () => {
  it('returns one row per keyword with citation breakdown', () => {
    const results = [
      { engine_id: 'engine-perplexity', keyword: 'kw1', cited: true,  source_urls: [] },
      { engine_id: 'engine-chatgpt',    keyword: 'kw1', cited: false, source_urls: [] },
      { engine_id: 'engine-claude',     keyword: 'kw2', cited: true,  source_urls: [] },
      { engine_id: 'engine-exa',        keyword: 'kw2', cited: true,  source_urls: [] },
    ]
    const summary = perKeywordVisibility(results, ENGINES)
    expect(summary).toHaveLength(2)

    const kw1 = summary.find(s => s.keyword === 'kw1')
    expect(kw1?.scorePct).toBe(50)
    expect(kw1?.citedEngines).toEqual(['Perplexity'])
    expect(kw1?.totalEngines).toBe(2)

    const kw2 = summary.find(s => s.keyword === 'kw2')
    expect(kw2?.scorePct).toBe(100)
    expect(kw2?.citedEngines.sort()).toEqual(['Claude', 'Exa'])
  })

  it('uses [deactivated engine] fallback for unknown engine_ids', () => {
    const results = [
      { engine_id: 'unknown-uuid-12345', keyword: 'kw1', cited: true, source_urls: [] },
    ]
    const summary = perKeywordVisibility(results, ENGINES)
    expect(summary[0].citedEngines).toEqual(['[deactivated engine]'])
  })

  it('returns 0% for keywords with no cited results', () => {
    const results = [
      { engine_id: 'engine-perplexity', keyword: 'kw1', cited: false, source_urls: [] },
      { engine_id: 'engine-chatgpt',    keyword: 'kw1', cited: false, source_urls: [] },
    ]
    const summary = perKeywordVisibility(results, ENGINES)
    expect(summary[0].scorePct).toBe(0)
    expect(summary[0].citedEngines).toEqual([])
  })

  it('preserves keyword order from results array', () => {
    const results = [
      { engine_id: 'engine-perplexity', keyword: 'second', cited: false, source_urls: [] },
      { engine_id: 'engine-chatgpt',    keyword: 'first',  cited: true,  source_urls: [] },
    ]
    const summary = perKeywordVisibility(results, ENGINES)
    expect(summary.map(s => s.keyword)).toEqual(['second', 'first'])
  })
})
