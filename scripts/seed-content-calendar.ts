/**
 * One-off script — import keyword-research/Content_Calendar.csv into the
 * content_calendar table.
 *
 * Run:
 *   npx tsx scripts/seed-content-calendar.ts
 *
 * The CSV file must live at the repo root, sibling folder:
 *   ../keyword-research/Content_Calendar.csv
 *
 * Idempotent — uses upsert with onConflict='url_path', skips duplicates.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bulkInsertCalendarRows, type CalendarRowInput } from '@/lib/db/content-calendar'

interface CsvRow {
  publish_date: string
  post_type: string
  hub: string
  primary_keyword: string
  secondary_keywords: string
  search_volume: string
  kd: string
  url: string
  title_draft: string
  author: string
  brand_prefix_required: string
  status: string
}

const CSV_PATH = resolve(__dirname, '..', '..', 'keyword-research', 'Content_Calendar.csv')

const VALID_POST_TYPES = new Set([
  'hub_foundational', 'troubleshooting', 'informational',
  'commercial', 'combined_intent',
])

const VALID_AUTHORS = new Set(['Aradhna', 'Sachin', 'Steve', 'Krithi'])

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV is empty')

  const headers = parseLine(lines[0])
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (values.length !== headers.length) {
      console.warn(`Skipping malformed row ${i + 1}: ${lines[i].slice(0, 80)}`)
      continue
    }
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] })
    rows.push(row as unknown as CsvRow)
  }

  return rows
}

// Minimal CSV parser handling quoted fields and embedded commas.
function parseLine(line: string): string[] {
  const out: string[] = []
  let buf = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { buf += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      out.push(buf.trim()); buf = ''
    } else {
      buf += c
    }
  }
  out.push(buf.trim())
  return out
}

function normalisePostType(raw: string): string {
  // CSV uses 'hub-foundational' style; DB uses 'hub_foundational'
  return raw.replace(/-/g, '_')
}

function toRowInput(csv: CsvRow): CalendarRowInput | null {
  const postType = normalisePostType(csv.post_type)
  if (!VALID_POST_TYPES.has(postType)) {
    console.warn(`Skipping row with unsupported post_type: ${csv.post_type} (url: ${csv.url})`)
    return null
  }

  if (!VALID_AUTHORS.has(csv.author)) {
    console.warn(`Skipping row with invalid author: ${csv.author}`)
    return null
  }

  // Filter out wiki rows — those go in aivisibility-app, not engineering-app
  if (postType === 'wiki_term' || postType === 'wiki_pillar') return null

  const secondary = csv.secondary_keywords
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean)

  return {
    publish_date: csv.publish_date,
    post_type: postType as CalendarRowInput['post_type'],
    hub: csv.hub || null,
    primary_keyword: csv.primary_keyword,
    secondary_keywords: secondary,
    search_volume: csv.search_volume ? Number(csv.search_volume) : null,
    kd: csv.kd ? Number(csv.kd) : null,
    url_path: csv.url,
    title_draft: csv.title_draft,
    author: csv.author as CalendarRowInput['author'],
    brand_prefix_required: csv.brand_prefix_required.toUpperCase() === 'YES',
  }
}

async function main(): Promise<void> {
  console.log(`Reading ${CSV_PATH}`)
  const text = readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCsv(text)
  console.log(`Parsed ${rows.length} CSV rows`)

  const inputs: CalendarRowInput[] = []
  for (const r of rows) {
    const input = toRowInput(r)
    if (input) inputs.push(input)
  }

  console.log(`Importing ${inputs.length} valid rows (skipped wiki + invalid)`)
  const inserted = await bulkInsertCalendarRows(inputs)
  console.log(`Inserted ${inserted} new rows (existing skipped via upsert).`)
  console.log('Done.')
}

main().catch(err => {
  console.error('Seed script failed:', err)
  process.exit(1)
})
