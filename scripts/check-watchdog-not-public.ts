/**
 * CI guard: fails if "watchdog" appears in any public-facing page
 * (under app/(public)/) outside the legal pages that are explicitly
 * allowed to mention it (terms, privacy).
 *
 * Run: npx tsx scripts/check-watchdog-not-public.ts
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const ROOT = join(__dirname, '..')
const PUBLIC_DIR = join(ROOT, 'app', '(public)')

const ALLOWED_PATHS = [
  join('(legal)', 'terms', 'page.tsx'),
  join('(legal)', 'privacy', 'page.tsx'),
]

const WATCHDOG_RE = /watchdog/i

function walk(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(full))
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(full)
    }
  }
  return files
}

const files = walk(PUBLIC_DIR)
const violations: string[] = []

for (const file of files) {
  const rel = relative(PUBLIC_DIR, file)
  if (ALLOWED_PATHS.some(allowed => rel === allowed || rel.startsWith(allowed))) continue

  const src = readFileSync(file, 'utf8')
  if (WATCHDOG_RE.test(src)) {
    violations.push(rel)
  }
}

if (violations.length > 0) {
  console.error('ERROR: "watchdog" found in public pages (not allowed until Phase 2 launch):')
  for (const v of violations) {
    console.error(`  app/(public)/${v}`)
  }
  process.exit(1)
}

console.log('OK: no "watchdog" mentions in public pages.')
