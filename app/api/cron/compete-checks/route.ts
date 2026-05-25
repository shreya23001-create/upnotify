import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractPrice } from '@/lib/services/price-extraction'
import { evaluateRulesForPriceChange } from '@/lib/services/pricing-rules-engine'
import { sendUserMessage } from '@/lib/db/user-messages'
import { logger } from '@/lib/utils/logger'
import { startCronRun, endCronRun, getTriggeredBy } from '@/lib/utils/cron-logger'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH_SIZE = 5

export async function GET(request: Request): Promise<NextResponse> {
  const unauth = requireCronAuth(request)
  if (unauth) return unauth

  const cronStart = Date.now()
  const runId = await startCronRun('/api/cron/compete-checks', getTriggeredBy(request))

  try {
    const supabase = createAdminClient()

    // Get all active products that need checking
    // Check products that haven't been checked in the last 60 minutes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: products, error } = await supabase
      .from('ecom_products')
      .select('id, org_id, url, name, css_selector, last_price, last_currency, last_stock_status')
      .eq('is_active', true)
      .or(`last_checked_at.is.null,last_checked_at.lt.${oneHourAgo}`)
      .order('last_checked_at', { ascending: true, nullsFirst: true })
      .limit(50) // Process max 50 per cron run

    if (error || !products) {
      logger.error('Failed to fetch due products', { error: error?.message })
      await endCronRun(runId, cronStart, 'error', { errorMessage: error?.message ?? 'Failed to fetch products' })
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    logger.info('Compete check cron started', { dueProducts: products.length })

    let checked = 0
    let priceChanged = 0
    let errors = 0

    // Process in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (product) => {
          try {
            const result = await extractPrice(product.url, product.css_selector)

            if (!result.success || result.price === null) {
              // Update last_checked_at even on failure
              await supabase
                .from('ecom_products')
                .update({ last_checked_at: new Date().toISOString() })
                .eq('id', product.id)
              return
            }

            const newPrice = result.price
            const oldPrice = product.last_price ?? 0
            const priceHasChanged = oldPrice > 0 && Math.abs(newPrice - oldPrice) > 0.01
            const stockChanged = product.last_stock_status !== null &&
              result.stockStatus !== null &&
              product.last_stock_status !== result.stockStatus

            // Write price history
            await supabase.from('ecom_price_history').insert({
              product_id: product.id,
              org_id: product.org_id,
              price: newPrice,
              currency: result.currency,
              stock_status: result.stockStatus,
              extraction_method: result.extractionMethod,
              confidence: result.confidence,
            })

            // Update product record (archive current price as prev before overwriting)
            await supabase
              .from('ecom_products')
              .update({
                prev_price: product.last_price ?? null,
                prev_currency: (product as unknown as Record<string, unknown>).last_currency as string ?? 'GBP',
                last_price: newPrice,
                last_currency: result.currency,
                last_stock_status: result.stockStatus,
                last_checked_at: new Date().toISOString(),
              })
              .eq('id', product.id)

            checked++

            // If price changed, evaluate pricing rules
            if (priceHasChanged) {
              priceChanged++
              await evaluateRulesForPriceChange({
                productId: product.id,
                orgId: product.org_id,
                oldPricePence: Math.round(oldPrice * 100),
                newPricePence: Math.round(newPrice * 100),
                productName: product.name,
                productUrl: product.url,
                stockStatus: result.stockStatus ?? undefined,
              })
            }

            // If competitor went out of stock, send opportunity alert
            if (stockChanged && result.stockStatus === 'out_of_stock') {
              // Find org owner for notification
              const { data: owner } = await supabase
                .from('users')
                .select('id')
                .eq('org_id', product.org_id)
                .eq('role', 'owner')
                .limit(1)
                .single()

              if (owner) {
                await sendUserMessage({
                  userId: owner.id,
                  orgId: product.org_id,
                  title: `Competitor out of stock: ${product.name}`,
                  body: `${product.name} is now out of stock on the competitor's site. This could be an opportunity to capture their customers. Consider running a promotion or increasing visibility for your equivalent product.`,
                  type: 'success',
                  category: 'general',
                  actionUrl: '/dashboard/compete',
                  actionLabel: 'View in Compete',
                })
              }
            }

            // Sale detection alert
            if (result.isOnSale && result.discountPct && result.discountPct >= 10) {
              const { data: owner } = await supabase
                .from('users')
                .select('id')
                .eq('org_id', product.org_id)
                .eq('role', 'owner')
                .limit(1)
                .single()

              if (owner) {
                await sendUserMessage({
                  userId: owner.id,
                  orgId: product.org_id,
                  title: `Sale detected: ${product.name} (${result.discountPct}% off)`,
                  body: `${product.name} is on sale at ${result.discountPct}% off (was \u00A3${(result.originalPrice ?? 0).toFixed(2)}, now \u00A3${result.price!.toFixed(2)}). Consider adjusting your pricing or running a competing promotion.`,
                  type: 'warning',
                  category: 'general',
                  actionUrl: '/dashboard/compete',
                  actionLabel: 'View in Compete',
                })
              }
            }
          } catch (err) {
            errors++
            logger.error('Compete check failed for product', {
              productId: product.id,
              error: err instanceof Error ? err.message : 'Unknown',
            })
          }
        })
      )
    }

    logger.info('Compete check cron completed', { checked, priceChanged, errors })
    await endCronRun(runId, cronStart, 'ok', { summary: `checked: ${checked}, priceChanged: ${priceChanged}, errors: ${errors}` })
    return NextResponse.json({ ok: true, checked, priceChanged, errors })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown'
    logger.error('Compete check cron error', { error: message })
    await endCronRun(runId, cronStart, 'error', { errorMessage: message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
