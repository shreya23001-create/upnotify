/**
 * Shared plan display utilities
 *
 * Single source of truth for plan feature lists and price formatting.
 * Used by both the landing page pricing table and the dashboard billing page.
 */

import { formatInr } from '@/lib/utils/currency'
import type { SupportedCurrency } from '@/lib/utils/currency'

// ─── Shared plan shape ────────────────────────────────────────────────────────
// Minimal interface covering the fields both tables need. Both PlanData (landing)
// and Plan (billing) satisfy this shape.

export interface PlanDisplayData {
  name: string
  slug: string
  is_visible: boolean
  price_monthly_gbp: number
  price_annual_gbp: number | null
  price_monthly_inr: number
  price_annual_inr: number
  monitor_limit: number | null
  check_interval_seconds: number
  has_email_alerts: boolean
  has_slack_teams: boolean
  has_webhooks: boolean
  has_status_pages: boolean
  status_page_limit: number
  has_status_page_custom_domain: boolean
  has_ai_predictive: boolean
  ai_report_limit: number
  data_retention_days: number | null
  competitor_limit: number
  llms_txt_limit: number
  citation_check_monthly_limit: number
  wp_monitor_limit: number
}

export interface PlanFeature {
  text: string
  included: boolean
}

export interface PlanPrice {
  symbol: string   // '£' or '₹' or ''
  amount: string   // numeric portion, e.g. '19', '228.00', '₹999'
  period: string   // 'per month', '/year', 'forever', etc.
  note?: string    // secondary line, e.g. 'Save 20% vs monthly'
}

// ─── Feature list ─────────────────────────────────────────────────────────────

export function getPlanFeatures(p: PlanDisplayData): PlanFeature[] {
  const features: PlanFeature[] = []

  // Monitors
  features.push({
    text: p.monitor_limit ? `${p.monitor_limit} monitors` : 'Unlimited monitors',
    included: true,
  })

  // Check interval
  const secs = p.check_interval_seconds
  const intervalText = secs >= 300
    ? `${secs / 60}-minute checks`
    : secs === 60
    ? '1-minute checks'
    : `${secs}-second checks`
  features.push({ text: intervalText, included: true })

  // Data retention
  const retentionText = !p.data_retention_days
    ? 'Unlimited data retention'
    : p.data_retention_days >= 365
    ? `${Math.round(p.data_retention_days / 365)}-year data retention`
    : `${p.data_retention_days}-day data retention`
  features.push({ text: retentionText, included: true })

  // Alerts
  features.push({ text: 'Email alerts', included: p.has_email_alerts })
  if (p.has_slack_teams) {
    features.push({ text: 'Email + Slack + Teams', included: true })
  } else {
    features.push({ text: 'Slack / Teams', included: false })
  }

  // Status pages
  if (p.has_status_page_custom_domain) {
    features.push({
      text: p.status_page_limit
        ? `${p.status_page_limit} custom domain status pages`
        : 'Unlimited status pages',
      included: true,
    })
  } else if (p.has_status_pages) {
    features.push({
      text: p.status_page_limit
        ? `${p.status_page_limit} status page${p.status_page_limit > 1 ? 's' : ''}`
        : 'Status pages',
      included: true,
    })
  } else {
    features.push({ text: '1 status page', included: false })
  }

  // Webhooks
  features.push({ text: 'Webhooks', included: p.has_webhooks })

  // AI reports
  if (p.has_ai_predictive || p.ai_report_limit > 0) {
    features.push({
      text: p.ai_report_limit > 0
        ? `${p.ai_report_limit} AI reports/month`
        : 'Unlimited AI reports',
      included: true,
    })
  } else {
    features.push({ text: 'AI reports', included: false })
  }

  // Watchdog
  const watchdog = p.competitor_limit ?? 3
  features.push({ text: `Watchdog — ${watchdog} competitor${watchdog === 1 ? '' : 's'}`, included: true })

  // llms.txt Generator
  if (p.llms_txt_limit === -1) {
    features.push({ text: 'llms.txt Generator (unlimited)', included: true })
  } else if (p.llms_txt_limit === 1) {
    features.push({ text: 'llms.txt Generator (1 lifetime)', included: true })
  } else {
    features.push({ text: 'llms.txt Generator', included: false })
  }

  // AI Citation Monitor
  if (p.citation_check_monthly_limit === -1) {
    features.push({ text: 'AI Citation Monitor (unlimited)', included: true })
  } else if (p.citation_check_monthly_limit > 0) {
    features.push({ text: `AI Citation Monitor (${p.citation_check_monthly_limit}/month)`, included: true })
  } else {
    features.push({ text: 'AI Citation Monitor', included: false })
  }

  // WordPress Monitor
  const wpLimit = p.wp_monitor_limit ?? 0
  if (wpLimit === 0) {
    features.push({ text: 'WordPress Monitor', included: false })
  } else if (wpLimit === -1) {
    features.push({ text: 'WordPress Monitor (unlimited)', included: true })
  } else {
    features.push({ text: `WordPress Monitor (${wpLimit} site${wpLimit === 1 ? '' : 's'})`, included: true })
  }

  return features
}

// ─── Price formatting ─────────────────────────────────────────────────────────

export function formatPlanPrice(
  p: PlanDisplayData,
  isAnnual: boolean,
  currency: SupportedCurrency
): PlanPrice {
  const isFree = p.price_monthly_gbp === 0 && (!p.price_annual_gbp || p.price_annual_gbp === 0)

  // Free plan — always the same regardless of currency
  if (isFree) {
    return { symbol: currency === 'inr' ? '' : '£', amount: '0', period: 'forever' }
  }

  // ── INR ──────────────────────────────────────────────────────────────────────
  if (currency === 'inr') {
    const monthlyInr = p.price_monthly_inr ?? 0
    const annualInr  = p.price_annual_inr  ?? 0

    if (isAnnual && annualInr > 0) {
      return {
        symbol: '',
        amount: formatInr(annualInr),
        period: 'per year',
        note: monthlyInr > 0 ? `Or ${formatInr(monthlyInr)}/mo` : undefined,
      }
    }
    return {
      symbol: '',
      amount: formatInr(monthlyInr),
      period: 'per month',
      note: annualInr > 0 ? `Or ${formatInr(annualInr)}/yr` : undefined,
    }
  }

  // ── GBP ──────────────────────────────────────────────────────────────────────
  const monthlyPence = p.price_monthly_gbp
  const annualPence  = p.price_annual_gbp

  // Annual-only plan (Lite: monthly price = 0, annual price set)
  if (monthlyPence === 0 && annualPence && annualPence > 0) {
    const annualGbp    = annualPence / 100
    const perMonthEquiv = Math.round(annualPence / 12) / 100
    return {
      symbol: '£',
      amount: annualGbp % 1 === 0 ? annualGbp.toFixed(0) : annualGbp.toFixed(2),
      period: 'per year',
      note: `Just ${perMonthEquiv < 1
        ? `${Math.round(perMonthEquiv * 100)}p`
        : `£${perMonthEquiv.toFixed(2)}`}/mo`,
    }
  }

  if (isAnnual && annualPence && annualPence > 0) {
    const annualGbp  = annualPence / 100
    const monthlyGbp = monthlyPence / 100
    const savings    = Math.round(((monthlyPence * 12 - annualPence) / (monthlyPence * 12)) * 100)
    // Show per-month equivalent so users see the lower number
    const perMonthEquiv = annualGbp / 12
    if (perMonthEquiv >= 1) {
      return {
        symbol: '£',
        amount: Math.round(perMonthEquiv).toString(),
        period: 'per month, billed annually',
        note: `Or £${monthlyGbp % 1 === 0 ? monthlyGbp.toFixed(0) : monthlyGbp.toFixed(2)}/mo monthly`,
      }
    }
    return {
      symbol: '£',
      amount: annualGbp % 1 === 0 ? annualGbp.toFixed(0) : annualGbp.toFixed(2),
      period: 'per year',
      note: savings > 0 ? `Save ${savings}% vs monthly` : undefined,
    }
  }

  const monthlyGbp = monthlyPence / 100
  return {
    symbol: '£',
    amount: monthlyGbp % 1 === 0 ? monthlyGbp.toFixed(0) : monthlyGbp.toFixed(2),
    period: 'per month',
    note: annualPence && annualPence > 0
      ? `Or £${(annualPence / 100) % 1 === 0
          ? (annualPence / 100).toFixed(0)
          : (annualPence / 100).toFixed(2)}/yr annually`
      : undefined,
  }
}
