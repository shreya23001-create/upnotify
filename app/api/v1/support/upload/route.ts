import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
]

/**
 * POST /api/v1/support/upload
 * Accepts a single file via multipart form-data.
 * Stores in Supabase Storage bucket `support-attachments`.
 * Returns { url } on success.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    // Rename to prevent original filename exposure — use org/uuid pattern
    const safeName = `${user.org_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const supabase = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('support-attachments')
      .upload(safeName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      const msg = uploadError.message ?? ''
      logger.error('Support file upload failed', { error: msg, file: safeName, type: file.type })

      // Surface the underlying cause to logs so ops/devs can diagnose, but
      // keep the user-facing message generic. The most common production
      // cause we've seen is the storage bucket not being provisioned on a
      // fresh Supabase project — `Bucket not found` returns here and the
      // operator needs to create `support-attachments` in Storage.
      // engineering-app#49.
      if (/bucket.*not.*found/i.test(msg)) {
        return NextResponse.json(
          { error: 'File uploads are temporarily unavailable. Please paste the content into the message body or email info@upnotify.com.' },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
    }

    // Private bucket (per migration 00106) — return a signed URL with a
    // 7-day TTL. 7 days is "effectively permanent" for normal support
    // workflows; an older attachment view will need to regenerate the URL
    // from the storage path stored on the ticket. engineering-app#49.
    const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60
    const { data: signed, error: signErr } = await supabase.storage
      .from('support-attachments')
      .createSignedUrl(safeName, SIGNED_URL_TTL_SECONDS)

    if (signErr || !signed?.signedUrl) {
      logger.error('Support file uploaded but signed URL generation failed', { error: signErr?.message, file: safeName })
      // File is uploaded but unreachable — surface as a soft failure so the
      // user knows the file is there even if the link is currently broken.
      return NextResponse.json(
        { error: 'File uploaded but URL generation failed. Please ping support.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      url: signed.signedUrl,    // immediately usable, expires in 7 days
      path: safeName,            // durable — store this for regenerating URLs later
      name: file.name,           // original filename for display
      mime: file.type,           // for choosing inline vs link rendering
      size: file.size,           // bytes — for display
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Support upload route error', { error: message })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
