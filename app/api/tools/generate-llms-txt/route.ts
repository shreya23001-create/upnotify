import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { generateLlmsTxtPublicTool, VALID_PUBLIC_TOOL_MODELS } from '@/lib/services/llms-txt'

// ---------------------------------------------------------------------------
// Rate limiter — 5 submissions per IP per hour
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

// ---------------------------------------------------------------------------
// POST /api/tools/generate-llms-txt
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: { email?: string; domain?: string; models?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { email, domain, models = [] } = body

  // Validate email
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // Validate domain
  if (!domain || typeof domain !== 'string' || domain.length > 253) {
    return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 })
  }
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase().trim()

  // Validate models
  const validModels = models.filter((m): m is string => typeof m === 'string' && VALID_PUBLIC_TOOL_MODELS.has(m))

  // Generate the file — crawls the site and auto-fills placeholders
  const llmsTxt = await generateLlmsTxtPublicTool(cleanDomain, validModels)

  // Save lead to DB (non-blocking — don't fail the request if DB is down)
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('tool_leads').insert({
      email: email.trim().toLowerCase(),
      domain: cleanDomain,
      tool: 'llms-txt-generator',
      models: validModels,
      llms_txt: llmsTxt,
      ip_address: ip,
    })
  } catch (err) {
    // Log but don't block — user still gets their file
    logger.error('tool_leads insert failed', { error: String(err) })
  }

  return NextResponse.json({ llmsTxt, domain: cleanDomain })
}
