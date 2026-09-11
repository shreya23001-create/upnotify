import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendUserMessage } from '@/lib/db/user-messages'
import { sendAlertEmail } from '@/lib/services/email'
import { getServerConfig } from '@/lib/utils/config'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Weekly Compete brief — runs every Monday at 8am UTC.
 * Generates an AI-powered summary of price changes, stock movements,
 * sale detections, and opportunities for each org with an active Compete subscription.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/compete-brief', getTriggeredBy(request))

  try {
    const supabase = createAdminClient()
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    // Get all orgs with active compete subscriptions
    const { data: competeSubs } = await supabase
      .from('compete_subscriptions')
      .select('org_id')
      .eq('status', 'active')

    if (!competeSubs || competeSubs.length === 0) {
      await endCronRun(runId, cronStart, 'ok', { summary: 'skipped: no active compete subscriptions' })
      return NextResponse.json({ ok: true, briefsSent: 0, reason: 'No active compete subscriptions' })
    }

    let briefsSent = 0

    for (const sub of competeSubs) {
      try {
        const brief = await generateBriefForOrg(supabase, sub.org_id, oneWeekAgo)
        if (brief) {
          briefsSent++
        }
      } catch (err) {
        logger.error('Failed to generate brief for org', {
          orgId: sub.org_id,
          error: err instanceof Error ? err.message : 'Unknown',
        })
      }
    }

    logger.info('Compete weekly brief cron completed', { briefsSent })
    await endCronRun(runId, cronStart, 'ok', { summary: `briefsSent: ${briefsSent}` })
    return NextResponse.json({ ok: true, briefsSent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown'
    logger.error('Compete brief cron error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function generateBriefForOrg(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string,
  since: string
): Promise<boolean> {
  // Get products for this org
  const { data: products } = await supabase
    .from('ecom_products')
    .select('id, name, is_own_product, last_stock_status')
    .eq('org_id', orgId)
    .eq('is_active', true)

  if (!products || products.length === 0) return false
  const productMap = new Map(products.map(p => [p.id, p]))

  // Get price history
  const { data: priceHistory } = await supabase
    .from('ecom_price_history')
    .select('product_id, price, stock_status, checked_at')
    .eq('org_id', orgId)
    .gte('checked_at', since)
    .order('checked_at', { ascending: false })
    .limit(500)

  if (!priceHistory || priceHistory.length === 0) return false

  // Get rule executions
  const { data: executions } = await supabase
    .from('pricing_rule_executions')
    .select('id')
    .eq('org_id', orgId)
    .gte('created_at', since)

  // Aggregate
  const uniqueProducts = new Set(priceHistory.map(e => e.product_id))
  const salesDetected: { name: string; discountPct: number; date: string }[] = []
  const stockOuts: { name: string; date: string }[] = []

  for (const entry of priceHistory) {
    const product = productMap.get(entry.product_id)
    if (!product) continue
    if (entry.stock_status === 'out_of_stock' && !product.is_own_product) {
      stockOuts.push({ name: product.name, date: entry.checked_at })
    }
  }

  // Build the brief using Claude API
  const config = getServerConfig()
  const anthropicKey = config.anthropic?.apiKey

  let briefText: string

  if (anthropicKey) {
    briefText = await generateAIBrief({
      apiKey: anthropicKey,
      totalProducts: products?.length ?? 0,
      priceChecks: priceHistory.length,
      uniqueProductsChanged: uniqueProducts.size,
      salesDetected: salesDetected.length,
      stockOuts: stockOuts.length,
      ruleExecutions: executions?.length ?? 0,
      topSales: salesDetected.slice(0, 5),
      topStockOuts: stockOuts.slice(0, 5),
    })
  } else {
    // Fallback: non-AI summary
    briefText = buildStaticBrief({
      totalProducts: products?.length ?? 0,
      priceChecks: priceHistory.length,
      uniqueProductsChanged: uniqueProducts.size,
      salesDetected: salesDetected.length,
      stockOuts: stockOuts.length,
      ruleExecutions: executions?.length ?? 0,
      topSales: salesDetected.slice(0, 5),
      topStockOuts: stockOuts.slice(0, 5),
    })
  }

  // Send as in-app message
  const { data: owner } = await supabase
    .from('users')
    .select('id, email')
    .eq('org_id', orgId)
    .eq('role', 'owner')
    .limit(1)
    .single()

  if (!owner) return false

  await sendUserMessage({
    userId: owner.id,
    orgId,
    title: 'Your Weekly Compete Brief',
    body: briefText,
    type: 'info',
    category: 'general',
    actionUrl: '/dashboard/compete',
    actionLabel: 'View Compete Dashboard',
  })

  // Also send via email
  if (owner.email) {
    await sendAlertEmail({
      to: owner.email,
      subject: '[Upnotify Compete] Your Weekly Price Intelligence Brief',
      body: briefText,
    })
  }

  return true
}

interface BriefData {
  totalProducts: number
  priceChecks: number
  uniqueProductsChanged: number
  salesDetected: number
  stockOuts: number
  ruleExecutions: number
  topSales: { name: string; discountPct: number; date: string }[]
  topStockOuts: { name: string; date: string }[]
}

async function generateAIBrief(params: BriefData & { apiKey: string }): Promise<string> {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: params.apiKey })

    const prompt = `You are a competitive intelligence analyst. Write a brief weekly summary for an ecommerce business owner. Be concise, actionable, and professional. Use plain text, no markdown.

Data this week:
- Tracking ${params.totalProducts} products
- ${params.priceChecks} price checks performed
- ${params.uniqueProductsChanged} products had price changes
- ${params.salesDetected} competitor sales detected
- ${params.stockOuts} competitor stock-outs detected
- ${params.ruleExecutions} pricing rules triggered

${params.topSales.length > 0 ? `Top sales detected:\n${params.topSales.map(s => `- ${s.name}: ${s.discountPct}% off`).join('\n')}` : 'No major sales detected.'}

${params.topStockOuts.length > 0 ? `Competitor stock-outs:\n${params.topStockOuts.map(s => `- ${s.name}`).join('\n')}` : 'No competitor stock-outs this week.'}

Write 3-5 sentences summarizing the key insights and 1-2 actionable recommendations. Keep it under 200 words.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    return textBlock ? textBlock.text : buildStaticBrief(params)
  } catch (err) {
    logger.warn('AI brief generation failed, using static fallback', {
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return buildStaticBrief(params)
  }
}

function buildStaticBrief(data: BriefData): string {
  const lines: string[] = [
    `This week: ${data.priceChecks} price checks across ${data.totalProducts} products.`,
  ]

  if (data.uniqueProductsChanged > 0) {
    lines.push(`${data.uniqueProductsChanged} products had price changes.`)
  } else {
    lines.push('No significant price changes detected.')
  }

  if (data.salesDetected > 0) {
    lines.push(`${data.salesDetected} competitor sales detected.`)
    for (const sale of data.topSales.slice(0, 3)) {
      lines.push(`  - ${sale.name}: ${sale.discountPct}% off`)
    }
  }

  if (data.stockOuts > 0) {
    lines.push(`${data.stockOuts} competitor products went out of stock — potential opportunity to capture their customers.`)
    for (const so of data.topStockOuts.slice(0, 3)) {
      lines.push(`  - ${so.name}`)
    }
  }

  if (data.ruleExecutions > 0) {
    lines.push(`${data.ruleExecutions} pricing rules were triggered.`)
  }

  return lines.join('\n')
}
