// =============================================================================
// AOE — Debug: test crt.sh and Tranco responses raw
// GET /api/admin/aoe-debug-discovery
// Temporary — remove after debugging
// =============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results: Record<string, unknown> = {}

  // ── Test 1: crt.sh raw (co.uk, first 5 entries) ──────────────────────────
  try {
    const res = await fetch('https://crt.sh/?q=%.co.uk&output=json', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    results.crtsh_status = res.status
    results.crtsh_ok = res.ok

    if (res.ok) {
      const data = await res.json() as { common_name: string; not_after: string }[]
      results.crtsh_total_returned = data.length
      results.crtsh_sample = data.slice(0, 5).map(e => ({
        common_name: e.common_name,
        not_after: e.not_after,
        days_until_expiry: Math.round((new Date(e.not_after).getTime() - Date.now()) / 86400000),
      }))

      // Count how many would pass the 7–60 day filter
      const passing = data.filter(e => {
        const days = (new Date(e.not_after).getTime() - Date.now()) / 86400000
        return days >= 7 && days <= 60
      })
      results.crtsh_passing_7_60_days = passing.length
      results.crtsh_passing_sample = passing.slice(0, 5).map(e => ({
        common_name: e.common_name,
        not_after: e.not_after,
        days_until_expiry: Math.round((new Date(e.not_after).getTime() - Date.now()) / 86400000),
      }))
    }
  } catch (err) {
    results.crtsh_error = String(err)
  }

  // ── Test 2: Tranco — latest list ID ──────────────────────────────────────
  try {
    const metaRes = await fetch('https://tranco-list.eu/api/lists/latest', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    results.tranco_meta_status = metaRes.status
    results.tranco_meta_ok = metaRes.ok

    if (metaRes.ok) {
      const meta = await metaRes.json() as unknown
      results.tranco_meta_raw = meta

      // Try fetching a small slice
      const listId = (meta as { list_id?: string }).list_id
      if (listId) {
        const listRes = await fetch(
          `https://tranco-list.eu/api/lists/${listId}?from=5001&to=5020`,
          { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10_000) }
        )
        results.tranco_list_status = listRes.status
        results.tranco_list_ok = listRes.ok

        if (listRes.ok) {
          const listData = await listRes.json() as unknown
          results.tranco_list_raw_keys = Object.keys(listData as object)
          results.tranco_list_sample = (listData as { sites?: unknown[] }).sites?.slice(0, 5)
        } else {
          results.tranco_list_body = await listRes.text()
        }
      }
    } else {
      results.tranco_meta_body = await metaRes.text()
    }
  } catch (err) {
    results.tranco_error = String(err)
  }

  // ── Test 3: Alternative Tranco download (CSV format) ─────────────────────
  try {
    const csvRes = await fetch('https://tranco-list.eu/top-1m.csv.zip', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5_000),
    })
    results.tranco_csv_status = csvRes.status
  } catch (err) {
    results.tranco_csv_error = String(err)
  }

  return NextResponse.json(results, { status: 200 })
}
