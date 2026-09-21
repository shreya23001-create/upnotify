'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/db/users'
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
  'ai-tools':            ['openai', 'anthropic', 'gemini', 'mistral', 'cohere', 'hugging', 'replicate', 'perplexity', 'groq', 'together', 'claude', 'gpt', 'llm', 'stability', 'midjourney', 'runpod', 'deepmind', 'inflection', 'xai', 'grok', 'character.ai', 'jasper', 'writesonic', 'copy.ai', 'elevenlabs', 'runway', 'poe.com'],
  'cloud-providers':     ['aws', 'amazon web', 'azure', 'google cloud', 'gcp', 'digitalocean', 'linode', 'vultr', 'hetzner', 'ovh', 'scaleway', 'vercel', 'netlify', 'render', 'railway', 'fly.io', 'heroku', 'oracle cloud', 'ibm cloud', 'dreamhost', 'liquidweb', 'namecheap', 'pantheon', 'platform.sh', 'rackspace'],
  'payment-processors':  ['stripe', 'paypal', 'square', 'braintree', 'adyen', 'razorpay', 'paddle', 'chargebee', 'klarna', 'afterpay', 'affirm', 'checkout.com', 'worldpay', 'cybersource', 'mollie', 'payoneer', 'wise', 'phonepe', 'paytm', 'mobikwik', 'cash.app', 'venmo'],
  'ecommerce':           ['shopify', 'woocommerce', 'magento', 'bigcommerce', 'prestashop', 'opencart', 'etsy', 'ebay', 'alibaba', 'aliexpress', 'flipkart', 'meesho', 'myntra', 'nykaa', 'snapdeal', 'asos', 'boohoo', 'farfetch', 'lazada', 'mercadolibre', 'shopee', 'zalando'],
  'collaboration':       ['slack', 'notion', 'asana', 'trello', 'jira', 'monday', 'basecamp', 'zoom', 'linear', 'figma', 'miro', 'confluence', 'clickup', 'airtable', 'dropbox', 'google workspace', 'microsoft 365', 'teams', 'webex', 'loom', 'coda.io', 'fibery', 'nuclino', 'calendly', 'evernote', 'grammarly'],
  'devtools':            ['github', 'gitlab', 'bitbucket', 'jenkins', 'travis', 'circleci', 'docker', 'kubernetes', 'terraform', 'hashicorp', 'sentry', 'npm', 'pypi', 'rubygems', 'sonar', 'snyk', 'jfrog', 'atlassian', 'postman', 'supabase', 'firebase', 'planetscale', 'neon', 'stackoverflow', 'codesandbox', 'replit', 'hashnode', 'hotjar', 'mixpanel', 'fullstory'],
  'email-marketing':     ['mailchimp', 'sendgrid', 'mailgun', 'postmark', 'resend', 'hubspot', 'klaviyo', 'activecampaign', 'convertkit', 'beehiiv', 'substack', 'brevo', 'sendinblue', 'campaign monitor', 'constantcontact', 'drip', 'newsletter', 'marketing cloud'],
  'cdn-security':        ['cloudflare', 'fastly', 'imperva', 'sucuri', 'zscaler', 'crowdstrike', 'palo alto', 'fortinet', 'cdn77', 'bunny.net', 'keycdn', 'cloudinary', 'cdnjs', 'jsdelivr', 'nordvpn', 'expressvpn'],
  'cms-builders':        ['wordpress', 'contentful', 'strapi', 'sanity', 'ghost', 'webflow', 'framer', 'drupal', 'builder.io', 'prismic', 'storyblok', 'directus', 'payload', 'sitecore', 'squarespace', 'wix'],
  'monitoring':          ['new relic', 'newrelic', 'grafana', 'prometheus', 'pagerduty', 'pingdom', 'uptimerobot', 'better uptime', 'freshping', 'site24x7', 'dynatrace', 'elastic', 'splunk', 'logz', 'honeycomb', 'lightstep', 'datadog'],
  'social-media':        ['facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'pinterest', 'reddit', 'bluesky', 'threads', 'mastodon', 'discord', 'telegram', 'whatsapp', 'signal', 'viber', 'line.me', 'medium.com', 'quora'],
  'streaming':           ['youtube', 'twitch', 'vimeo', 'netflix', 'disney', 'hulu', 'spotify', 'soundcloud', 'mixcloud', 'crunchyroll', 'hotstar', 'sonyliv', 'zee5', 'jiocinema', 'discoveryplus', 'rumble', 'pluto.tv', 'tubi'],
  'gaming':              ['steam', 'epicgames', 'playstation', 'xbox', 'nintendo', 'roblox', 'minecraft', 'valorant', 'blizzard', 'riot games', 'activision', 'ea.com', 'leagueoflegends', 'genshin', 'dream11', 'humblebundle', 'itch.io', 'gog.com', 'mpl.live'],
  'banking':             ['revolut', 'monzo', 'n26', 'starling', 'chime', 'sofi', 'robinhood', 'zerodha', 'groww', 'upstox', 'etoro', 'freetrade', 'fidelity', 'vanguard', 'schwab', 'barclays', 'hsbc', 'lloyds', 'natwest', 'santander', 'hdfc', 'icici', 'sbi', 'axis bank', 'chase', 'capital one', 'mastercard', 'visa', 'american express'],
  'crypto':              ['binance', 'coinbase', 'bybit', 'okx', 'opensea', 'uniswap', 'ledger', 'kraken', 'crypto.com', 'blockchain', 'bitcoin', 'ethereum', 'defi', 'nft'],
  'food-delivery':       ['zomato', 'swiggy', 'doordash', 'deliveroo', 'ubereats', 'justeat', 'blinkit', 'dunzo', 'grubhub', 'foodpanda'],
  'travel':              ['booking.com', 'expedia', 'skyscanner', 'airbnb', 'trivago', 'agoda', 'makemytrip', 'irctc', 'ryanair', 'easyjet', 'british airways', 'emirates', 'lufthansa', 'delta', 'united airlines', 'southwest', 'hilton', 'marriott', 'vrbo', 'hostelworld'],
  'logistics':           ['fedex', 'dhl', 'ups', 'royal mail', 'parcelforce', 'dpd', 'evri', 'hermes', 'yodel', 'courier', 'shipping', 'parcel'],
  'news-media':          ['bbc', 'cnn', 'reuters', 'bloomberg', 'guardian', 'nytimes', 'techcrunch', 'theverge', 'engadget', 'forbes', 'ft.com', 'economist', 'independent', 'mashable', 'aljazeera', 'apnews', 'arstechnica', 'washingtonpost'],
  'healthcare':          ['nhs', 'webmd', 'mayoclinic', 'healthline', 'medicinenet', 'who.int', 'nih.gov', 'babylon', 'zocdoc', 'patient.info', 'drugs.com'],
  'education':           ['coursera', 'udemy', 'duolingo', 'khanacademy', 'codecademy', 'edx', 'chegg', 'quizlet', 'freecodecamp', 'masterclass', 'futurelearn', 'byjus', 'unacademy', 'vedantu', 'w3schools', 'wikipedia', 'academia.edu'],
  'telecom':             ['vodafone', 'bt.com', 'o2.co.uk', 'ee.co.uk', 'airtel', 'jio.com', 'bsnl', 'virginmedia', 'sky.com', 'tmobile', 'verizon'],
  'design-creative':     ['canva', 'dribbble', 'behance', 'shutterstock', 'gettyimages', 'unsplash', 'pexels', 'freepik', 'adobe', 'figma'],
  'business-saas':       ['salesforce', 'zendesk', 'freshdesk', 'freshworks', 'intercom', 'helpscout', 'pipedrive', 'hubspot crm', 'zoho', 'sap.com', 'oracle', 'workday', 'bamboohr', 'gusto', 'rippling', 'deel', 'xero', 'quickbooks', 'zapier', 'twilio', 'docusign', 'legalzoom'],
  'real-estate':         ['rightmove', 'zoopla', 'zillow', 'trulia', 'realtor.com', 'redfin', 'property', 'estate agent'],
  'automotive':          ['autotrader', 'cargurus', 'carwow', 'kelley blue book', 'kbb', 'motors.co.uk'],
  'government':          ['uidai', 'incometax.gov', 'passportindia', 'cowin', 'digilocker', 'epfindia', 'umang.gov', '.gov.in'],
  'security':            ['1password', 'bitwarden', 'lastpass', 'malwarebytes', 'surfshark', 'nordpass', 'keeper', 'dashlane'],
}

function guessPmbCategory(displayName: string, domain: string, existingCategory: string): string | null {
  const haystack = `${displayName} ${domain} ${existingCategory}`.toLowerCase()
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => haystack.includes(kw))) return slug
  }
  return null
}

async function getAdminEmail(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user?.email || !user.is_super_admin) return null
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
