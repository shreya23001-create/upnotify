'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import {
  updateMonitorPmbSettings,
  updatePmbCategory,
  approvePmbRun,
  approvePmbRunsForDate,
  discardPmbRun,
  retryPmbRun,
  retryFailedRunsForDate,
} from '@/lib/db/pmb'

// ── Auto-categorize keyword map ───────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'ai-tools':            ['openai', 'anthropic', 'gemini', 'mistral', 'cohere', 'hugging', 'replicate', 'perplexity', 'groq', 'together', 'claude', 'gpt', 'llm', 'ai', 'stability', 'midjourney', 'runpod', 'deepmind', 'inflection', 'xai', 'grok'],
  'cloud-providers':     ['aws', 'amazon web', 'azure', 'google cloud', 'gcp', 'digitalocean', 'linode', 'akamai cloud', 'vultr', 'hetzner', 'ovh', 'scaleway', 'vercel', 'netlify', 'render', 'railway', 'fly.io', 'heroku', 'oracle cloud', 'ibm cloud'],
  'payment-processors':  ['stripe', 'paypal', 'square', 'braintree', 'adyen', 'razorpay', 'paddle', 'chargebee', 'klarna', 'afterpay', 'affirm', 'checkout.com', 'worldpay', 'cybersource', 'mollie', 'payoneer', 'wise', 'payment', 'billing'],
  'ecommerce':           ['shopify', 'woocommerce', 'magento', 'bigcommerce', 'wix stores', 'squarespace commerce', 'prestashop', 'opencart', 'etsy', 'amazon seller', 'walmart seller', 'ebay', 'alibaba'],
  'collaboration':       ['slack', 'notion', 'asana', 'trello', 'jira', 'monday', 'basecamp', 'zoom', 'linear', 'figma', 'miro', 'confluence', 'clickup', 'airtable', 'dropbox', 'box.com', 'google workspace', 'microsoft 365', 'teams', 'webex', 'loom'],
  'devtools':            ['github', 'gitlab', 'bitbucket', 'jenkins', 'travis', 'circleci', 'docker', 'kubernetes', 'terraform', 'hashicorp', 'datadog', 'sentry', 'npm', 'pypi', 'rubygems', 'sonar', 'snyk', 'jfrog', 'atlassian', 'postman', 'supabase', 'firebase', 'planetscale', 'neon', 'turso'],
  'email-marketing':     ['mailchimp', 'sendgrid', 'mailgun', 'postmark', 'resend', 'hubspot', 'klaviyo', 'activecampaign', 'convertkit', 'beehiiv', 'substack', 'brevo', 'sendinblue', 'campaign monitor', 'constantcontact', 'drip', 'email', 'newsletter', 'marketing cloud'],
  'cdn-security':        ['cloudflare', 'fastly', 'akamai', 'imperva', 'sucuri', 'zscaler', 'okta', 'auth0', 'ping identity', 'crowdstrike', 'palo alto', 'fortinet', 'barracuda', 'qualys', 'tenable', 'cdn77', 'bunny.net', 'cdn', 'ddos', 'waf', 'firewall', 'vpn', 'zero trust'],
  'cms-builders':        ['wordpress', 'contentful', 'strapi', 'sanity', 'ghost', 'webflow', 'framer', 'drupal', 'builder.io', 'prismic', 'storyblok', 'directus', 'payload', 'craft cms', 'kentico', 'sitecore', 'umbraco', 'squarespace', 'wix'],
  'monitoring':          ['datadog', 'new relic', 'grafana', 'prometheus', 'pagerduty', 'statuspage', 'pingdom', 'uptimerobot', 'better uptime', 'freshping', 'site24x7', 'dynatrace', 'elastic', 'splunk', 'logz', 'honeycomb', 'lightstep', 'monitor', 'uptime', 'observability'],
}

function guessPmbCategory(displayName: string, domain: string, existingCategory: string): string | null {
  const haystack = `${displayName} ${domain} ${existingCategory}`.toLowerCase()
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => haystack.includes(kw))) return slug
  }
  return null
}

async function getAdminEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (!adminEmails.includes(user.email.toLowerCase())) return null
  return user.email
}

// ── Monitor settings ──────────────────────────────────────────────────────────

export async function togglePmbMonitorAction(id: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await updateMonitorPmbSettings(id, { pmb_enabled: enabled })
  if (!ok) return { success: false, error: 'Failed to update monitor' }

  logger.info('PMB: monitor toggled', { id, enabled, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function updateMonitorPmbAction(
  id: string,
  data: { pmb_category: string | null; pmb_keywords: string[]; status_page_url: string | null }
): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await updateMonitorPmbSettings(id, data)
  if (!ok) return { success: false, error: 'Failed to update monitor' }

  logger.info('PMB: monitor settings updated', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

// ── Category keywords ─────────────────────────────────────────────────────────

export async function updateCategoryKeywordsAction(
  slug: string,
  keywords: string[]
): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await updatePmbCategory(slug, { default_keywords: keywords })
  if (!ok) return { success: false, error: 'Failed to update category' }

  logger.info('PMB: category keywords updated', { slug, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

// ── Queue approval ────────────────────────────────────────────────────────────

export async function approvePmbRunAction(id: number): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await approvePmbRun(id, email)
  if (!ok) return { success: false, error: 'Failed to approve post' }

  logger.info('PMB: run approved', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function approveTodaysBatchAction(date: string): Promise<{ success: boolean; count: number; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, count: 0, error: 'Unauthorised' }

  const count = await approvePmbRunsForDate(date, email)
  logger.info('PMB: bulk approved today batch', { date, count, by: email })
  revalidatePath('/admin/pmb')
  return { success: true, count }
}

export async function discardPmbRunAction(id: number): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await discardPmbRun(id)
  if (!ok) return { success: false, error: 'Failed to discard post' }

  logger.info('PMB: run discarded', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function retryPmbRunAction(id: number): Promise<{ success: boolean; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, error: 'Unauthorised' }

  const ok = await retryPmbRun(id)
  if (!ok) return { success: false, error: 'Failed to retry post' }

  logger.info('PMB: run retried', { id, by: email })
  revalidatePath('/admin/pmb')
  return { success: true }
}

export async function retryFailedTodayAction(date: string): Promise<{ success: boolean; count: number; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, count: 0, error: 'Unauthorised' }

  const count = await retryFailedRunsForDate(date)
  logger.info('PMB: bulk retry failed', { date, count, by: email })
  revalidatePath('/admin/pmb')
  return { success: true, count }
}

// ── Auto-categorize ───────────────────────────────────────────────────────────

export async function autoCategorizeMonitorsAction(): Promise<{ success: boolean; assigned: number; skipped: number; error?: string }> {
  const email = await getAdminEmail()
  if (!email) return { success: false, assigned: 0, skipped: 0, error: 'Unauthorised' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Fetch all monitors that haven't been manually categorised yet
  const { data, error } = await db
    .from('public_monitors')
    .select('id, display_name, domain, category, pmb_category')
    .is('pmb_category', null)

  if (error) {
    logger.error('PMB: auto-categorize fetch failed', { error: error.message })
    return { success: false, assigned: 0, skipped: 0, error: error.message }
  }

  const rows = (data ?? []) as { id: string; display_name: string; domain: string; category: string; pmb_category: string | null }[]

  let assigned = 0
  let skipped  = 0

  for (const row of rows) {
    const guess = guessPmbCategory(row.display_name, row.domain, row.category ?? '')
    if (!guess) { skipped++; continue }

    const { error: updateErr } = await db
      .from('public_monitors')
      .update({ pmb_category: guess })
      .eq('id', row.id)

    if (updateErr) {
      logger.error('PMB: auto-categorize update failed', { id: row.id, error: updateErr.message })
    } else {
      assigned++
    }
  }

  logger.info('PMB: auto-categorize complete', { assigned, skipped, by: email })
  revalidatePath('/admin/pmb')
  return { success: true, assigned, skipped }
}
