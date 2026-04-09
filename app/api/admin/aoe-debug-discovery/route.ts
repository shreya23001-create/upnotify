// =============================================================================
// AOE — Debug: test crt.sh and Tranco responses raw
// GET /api/admin/aoe-debug-discovery
// Temporary — remove after debugging
// =============================================================================

import { createInflateRaw } from 'zlib'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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

  // ── Test 1: crt.sh with exclude=expired ──────────────────────────────────
  try {
    const res = await fetch('https://crt.sh/?q=%.co.uk&output=json&exclude=expired&deduplicate=Y', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    results.crtsh_status = res.status
    results.crtsh_ok = res.ok

    if (res.ok) {
      const data = await res.json() as { common_name: string; not_after: string; not_before?: string }[]
      results.crtsh_total_returned = data.length
      results.crtsh_sample = data.slice(0, 5).map(e => ({
        common_name:  e.common_name,
        not_before:   e.not_before ?? 'n/a',
        not_after:    e.not_after,
        days_to_expiry: Math.round((new Date(e.not_after).getTime() - Date.now()) / 86400000),
        recently_issued: e.not_before
          ? (Date.now() - new Date(e.not_before).getTime()) < 180 * 86400000
          : 'unknown',
      }))

      const recentCutoff = Date.now() - 180 * 86400000
      const passing = data.filter(e => {
        const days = (new Date(e.not_after).getTime() - Date.now()) / 86400000
        const recentlyIssued = e.not_before
          ? new Date(e.not_before).getTime() > recentCutoff
          : true
        return days >= 7 && days <= 60 && recentlyIssued
      })
      results.crtsh_passing_filter = passing.length
      results.crtsh_passing_sample = passing.slice(0, 5).map(e => ({
        common_name: e.common_name,
        days_to_expiry: Math.round((new Date(e.not_after).getTime() - Date.now()) / 86400000),
      }))
    }
  } catch (err) {
    results.crtsh_error = String(err)
  }

  // ── Test 2: Tranco CSV zip ────────────────────────────────────────────────
  try {
    const res = await fetch('https://tranco-list.eu/top-1m.csv.zip', {
      signal: AbortSignal.timeout(60_000),
    })
    results.tranco_status = res.status
    results.tranco_ok = res.ok

    if (res.ok) {
      const zipBuffer = Buffer.from(await res.arrayBuffer())
      results.tranco_zip_size_kb = Math.round(zipBuffer.length / 1024)

      // Check ZIP signature
      const sig = zipBuffer.readUInt32LE(0)
      results.tranco_valid_zip = sig === 0x04034b50

      if (sig === 0x04034b50) {
        const compressionMethod = zipBuffer.readUInt16LE(8)
        let   compressedSize    = zipBuffer.readUInt32LE(18)
        const fileNameLength    = zipBuffer.readUInt16LE(26)
        const extraFieldLength  = zipBuffer.readUInt16LE(28)
        const dataOffset        = 30 + fileNameLength + extraFieldLength
        const fileName          = zipBuffer.subarray(30, 30 + fileNameLength).toString('utf8')

        results.tranco_zip_filename    = fileName
        results.tranco_compression     = compressionMethod === 8 ? 'deflate' : compressionMethod === 0 ? 'stored' : compressionMethod
        results.tranco_compressed_size = compressedSize

        if (compressedSize === 0) {
          let eocd = zipBuffer.length - 22
          while (eocd > dataOffset && zipBuffer.readUInt32LE(eocd) !== 0x06054b50) eocd--
          const cdOffset = zipBuffer.readUInt32LE(eocd + 16)
          compressedSize = cdOffset - dataOffset
          results.tranco_compressed_size_resolved = compressedSize
        }

        // Try decompressing
        const compressed = zipBuffer.subarray(dataOffset, dataOffset + compressedSize)

        if (compressionMethod === 8) {
          const firstLines = await new Promise<string[]>((resolve, reject) => {
            const inflate = createInflateRaw()
            const chunks: Buffer[] = []
            inflate.on('data', (chunk: Buffer) => chunks.push(chunk))
            inflate.on('end', () => {
              const text  = Buffer.concat(chunks).toString('utf8')
              const lines = text.split('\n').slice(0, 20)
              resolve(lines)
            })
            inflate.on('error', reject)
            inflate.write(compressed)
            inflate.end()
          })
          results.tranco_first_20_lines = firstLines
          results.tranco_decompress_ok  = true
        } else if (compressionMethod === 0) {
          results.tranco_first_20_lines = compressed.toString('utf8').split('\n').slice(0, 20)
          results.tranco_decompress_ok  = true
        }
      }
    }
  } catch (err) {
    results.tranco_error = String(err)
  }

  return NextResponse.json(results, { status: 200 })
}
