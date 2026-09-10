// =============================================================================
// AOE — Automated Outreach Engine
// Service: platform-detector — detects Shopify / WooCommerce
// =============================================================================

import type { AoePlatform } from '../types'

const SHOPIFY_SIGNALS = [
  'x-shopify-stage',
  'x-shopify-request-id',
  'x-shardid',
]

export async function detectPlatform(domain: string, timeoutMs = 8000): Promise<AoePlatform | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'UptrueSiteChecker/1.0 (+https://upnotify-monitoring.vercel.app)' },
    })

    clearTimeout(timer)

    // ---- Shopify detection ----
    // Check response headers
    const isShopifyHeader = SHOPIFY_SIGNALS.some(h => response.headers.has(h))
    if (isShopifyHeader) return 'shopify'

    // Check HTML content for Shopify markers
    const html = await response.text().catch(() => '')
    if (
      html.includes('cdn.shopify.com') ||
      html.includes('Shopify.theme') ||
      html.includes('/cdn/shop/t/') ||
      html.includes('"shop"') && html.includes('shopify')
    ) {
      return 'shopify'
    }

    // ---- WooCommerce detection ----
    if (
      html.includes('/wp-content/plugins/woocommerce') ||
      html.includes('woocommerce') ||
      html.includes('wc-') && html.includes('cart')
    ) {
      return 'woocommerce'
    }

    return null
  } catch {
    return null
  }
}
