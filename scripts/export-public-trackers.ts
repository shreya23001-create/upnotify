/**
 * Export all public tracker websites from the public_monitors table.
 *
 * Usage (from project root):
 *   npx tsx scripts/export-public-trackers.ts
 *   npx tsx scripts/export-public-trackers.ts --format csv
 *   npx tsx scripts/export-public-trackers.ts --format json
 *   npx tsx scripts/export-public-trackers.ts --active-only
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.development
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------

function loadEnv(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.development'), 'utf-8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // fall through — env may already be set
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — check .env.development')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const format: 'table' | 'csv' | 'json' = args.includes('--format')
  ? (args[args.indexOf('--format') + 1] as 'table' | 'csv' | 'json')
  : 'table'
const activeOnly = args.includes('--active-only')
const outputFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

interface Row {
  id: string
  domain: string
  display_name: string
  category: string
  is_active: boolean
  last_status: string
  last_response_time_ms: number | null
  last_checked_at: string | null
  check_interval_seconds: number
  created_at: string
}

async function run(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  let query = supabase
    .from('public_monitors')
    .select('id, domain, display_name, category, is_active, last_status, last_response_time_ms, last_checked_at, check_interval_seconds, created_at')
    .order('category', { ascending: true })
    .order('display_name', { ascending: true })

  if (activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }

  const rows = (data ?? []) as Row[]
  console.error(`\nFound ${rows.length} public tracker${rows.length !== 1 ? 's' : ''}${activeOnly ? ' (active only)' : ''}.\n`)

  // -------------------------------------------------------------------------
  // Output
  // -------------------------------------------------------------------------

  let output = ''

  if (format === 'json') {
    output = JSON.stringify(rows, null, 2)

  } else if (format === 'csv') {
    const header = 'id,domain,display_name,category,is_active,last_status,last_response_time_ms,last_checked_at,check_interval_seconds,created_at'
    const lines = rows.map(r =>
      [
        r.id,
        r.domain,
        `"${r.display_name.replace(/"/g, '""')}"`,
        r.category,
        r.is_active,
        r.last_status,
        r.last_response_time_ms ?? '',
        r.last_checked_at ?? '',
        r.check_interval_seconds,
        r.created_at,
      ].join(',')
    )
    output = [header, ...lines].join('\n')

  } else {
    // Pretty table
    const colWidths = {
      domain: Math.max(6, ...rows.map(r => r.domain.length)),
      display_name: Math.max(12, ...rows.map(r => r.display_name.length)),
      category: Math.max(8, ...rows.map(r => r.category.length)),
      status: 10,
      active: 6,
      ms: 6,
    }

    const pad = (s: string | number, n: number) => String(s).padEnd(n)
    const header = [
      pad('Domain', colWidths.domain),
      pad('Display Name', colWidths.display_name),
      pad('Category', colWidths.category),
      pad('Status', colWidths.status),
      pad('Active', colWidths.active),
      pad('ms', colWidths.ms),
    ].join('  ')
    const sep = '-'.repeat(header.length)

    const lines = [sep, header, sep]
    for (const r of rows) {
      lines.push([
        pad(r.domain, colWidths.domain),
        pad(r.display_name, colWidths.display_name),
        pad(r.category, colWidths.category),
        pad(r.last_status, colWidths.status),
        pad(r.is_active ? 'yes' : 'no', colWidths.active),
        pad(r.last_response_time_ms ?? '—', colWidths.ms),
      ].join('  '))
    }
    lines.push(sep)

    // Summary by category
    const byCategory: Record<string, number> = {}
    for (const r of rows) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1
    lines.push('\nBy category:')
    for (const [cat, count] of Object.entries(byCategory).sort()) {
      lines.push(`  ${cat.padEnd(20)} ${count}`)
    }

    output = lines.join('\n')
  }

  if (outputFile) {
    writeFileSync(outputFile, output, 'utf-8')
    console.error(`Written to ${outputFile}`)
  } else {
    console.log(output)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
