import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import {
  getAgencyWaitlistEntry,
  updateAgencyWaitlistAiReport,
} from '@/lib/db/agency-waitlist'
import type { AgencyAiReport } from '@/lib/db/agency-waitlist'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<{ isAdmin: boolean; email: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { isAdmin: false, email: '' }

  const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return { isAdmin: adminEmails.includes(user.email.toLowerCase()), email: user.email }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { isAdmin: admin } = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { entryId: string }

  if (!body.entryId) {
    return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
  }

  const entry = await getAgencyWaitlistEntry(body.entryId)
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  const { anthropic: anthropicConfig } = getServerConfig()
  if (!anthropicConfig.apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables.' }, { status: 503 })
  }

  const client = new Anthropic({ apiKey: anthropicConfig.apiKey })

  const prompt = `You are an analyst evaluating an agency application for Uptrue, a SaaS uptime monitoring platform. Analyse the following agency applicant and provide a structured assessment.

Applicant Details:
- Name: ${entry.name}
- Email: ${entry.email}
- Business Name: ${entry.business_name || 'Not provided'}
- Website: ${entry.website || 'Not provided'}
- Country: ${entry.country || 'Not provided'}
- City: ${entry.city || 'Not provided'}
- Number of Clients: ${entry.num_clients ?? 'Not provided'}
- Phone: ${entry.phone || 'Not provided'}

Provide your analysis as a JSON object with exactly this structure (no markdown, no code blocks, just raw JSON):
{
  "score": <number 0-100>,
  "strengths": [<array of 2-4 strength strings>],
  "weaknesses": [<array of 1-3 weakness strings>],
  "recommendation": "<one paragraph recommendation>",
  "riskLevel": "<low|medium|high>",
  "businessSizeEstimate": "<estimated business size description>",
  "potentialRevenue": "<estimated monthly revenue potential for Uptrue>",
  "legitimacyAssessment": "<assessment of business legitimacy>"
}

Score guidelines:
- 80-100: Strong agency, likely high-value customer
- 60-79: Decent prospect, worth following up
- 40-59: Uncertain, needs more investigation
- 0-39: Weak application or red flags

Be realistic and practical. If information is missing, note it as a weakness and adjust the score down.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 })
    }

    const rawText = textBlock.text.trim()

    let parsed: {
      score: number
      strengths: string[]
      weaknesses: string[]
      recommendation: string
      riskLevel: string
      businessSizeEstimate: string
      potentialRevenue: string
      legitimacyAssessment: string
    }

    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Try extracting JSON from potential markdown code blocks
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        logger.error('Failed to parse AI response', { rawText })
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      }
      parsed = JSON.parse(jsonMatch[0])
    }

    const score = Math.max(0, Math.min(100, Math.round(parsed.score)))
    const report: AgencyAiReport = {
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      recommendation: parsed.recommendation ?? '',
      riskLevel: (['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium') as 'low' | 'medium' | 'high',
      businessSizeEstimate: parsed.businessSizeEstimate ?? '',
      potentialRevenue: parsed.potentialRevenue ?? '',
      legitimacyAssessment: parsed.legitimacyAssessment ?? '',
    }

    const saved = await updateAgencyWaitlistAiReport(body.entryId, report, score)
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, report, score })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error('AI report generation failed', { error: errorMsg })
    return NextResponse.json({ error: `AI report generation failed: ${errorMsg}` }, { status: 500 })
  }
}
