// =============================================================================
// AOE — Automated Outreach Engine
// Service: email-finder — finds a contact email address for a domain
//
// Strategy (in order):
//   1. Scrape homepage + /contact + /about for mailto: links
//   2. RDAP lookup (free, no key — often redacted but worth trying)
//   3. Paid WHOIS API (AOE_WHOIS_API_KEY — optional)
//   4. Validate common patterns (info@, hello@, contact@) against MX records
// =============================================================================

import * as dns from 'dns/promises'
import type { AoeEmailSource } from '../types'

export interface EmailFindResult {
  email: string | null
  source: AoeEmailSource | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

function extractEmails(text: string): string[] {
  return [...new Set(text.match(EMAIL_REGEX) ?? [])]
}

function isPersonalEmail(email: string): boolean {
  const personal = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'aol.com']
  return personal.some(p => email.toLowerCase().endsWith(`@${p}`))
}

function isOwnDomainEmail(email: string, domain: string): boolean {
  const emailDomain = email.toLowerCase().split('@')[1] ?? ''
  const target = domain.toLowerCase().replace(/^www\./, '')
  return emailDomain === target || emailDomain.endsWith(`.${target}`)
}

function bestEmail(emails: string[], domain: string): string | null {
  // Prefer own-domain emails, then filter out personal/noreply/support
  const preferred = emails.filter(e =>
    isOwnDomainEmail(e, domain) &&
    !e.toLowerCase().startsWith('noreply') &&
    !e.toLowerCase().startsWith('no-reply') &&
    !e.toLowerCase().startsWith('support') &&
    !e.toLowerCase().startsWith('bounce')
  )
  return preferred[0] ?? null
}

// ---------------------------------------------------------------------------
// 1. Scrape website pages for mailto links
// ---------------------------------------------------------------------------

async function scrapeWebsite(domain: string, timeoutMs: number): Promise<string | null> {
  const pagesToTry = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/contact-us`,
    `https://${domain}/about`,
    `https://${domain}/about-us`,
  ]

  for (const url of pagesToTry) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'UptrueSiteChecker/1.0 (+https://uptrue.io)' },
      })

      clearTimeout(timer)

      if (!response.ok) continue

      const html = await response.text()
      const allEmails = extractEmails(html).filter(e => !isPersonalEmail(e))
      const best = bestEmail(allEmails, domain)
      if (best) return best
    } catch {
      continue
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// 2. RDAP lookup (free — often redacted post-GDPR, but worth trying)
// ---------------------------------------------------------------------------

async function rdapLookup(domain: string, timeoutMs: number): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    clearTimeout(timer)

    if (!res.ok) return null

    const data = await res.json() as Record<string, unknown>
    const entities = data.entities as Array<Record<string, unknown>> | undefined
    if (!entities) return null

    for (const entity of entities) {
      const vcardArray = entity.vcardArray as Array<unknown> | undefined
      if (!vcardArray) continue

      const cards = vcardArray[1] as Array<unknown[]> | undefined
      if (!Array.isArray(cards)) continue

      for (const card of cards) {
        if (Array.isArray(card) && card[0] === 'email' && typeof card[3] === 'string') {
          const email = card[3]
          if (!isPersonalEmail(email)) return email
        }
      }
    }
  } catch {
    // RDAP unavailable or redacted — move on
  }

  return null
}

// ---------------------------------------------------------------------------
// 3. Paid WHOIS API (optional — set AOE_WHOIS_API_KEY)
// Uses WhoisXML API (https://www.whoisxmlapi.com)
// ---------------------------------------------------------------------------

async function whoisApiLookup(domain: string, timeoutMs: number): Promise<string | null> {
  const apiKey = process.env.AOE_WHOIS_API_KEY
  if (!apiKey) return null

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok) return null

    const data = await res.json() as Record<string, unknown>
    const record = (data.WhoisRecord as Record<string, unknown>) ?? {}
    const registrant = (record.registrant as Record<string, unknown>) ?? {}
    const email = registrant.email as string | undefined

    if (email && !isPersonalEmail(email)) return email
  } catch {
    // Paid API unavailable — continue
  }

  return null
}

// ---------------------------------------------------------------------------
// 4. Validate common patterns against DNS MX records
// ---------------------------------------------------------------------------

async function patternGuess(domain: string): Promise<string | null> {
  try {
    // Check MX records exist — if none, no email will work
    const mx = await dns.resolveMx(domain).catch(() => [])
    if (mx.length === 0) return null

    // Return best-guess common pattern — not validated for existence,
    // just confirmed the domain has MX records
    const patterns = ['info', 'hello', 'contact', 'admin', 'mail']
    for (const prefix of patterns) {
      const candidate = `${prefix}@${domain}`
      // We return the first pattern — sendgrid/Resend will bounce if it doesn't exist
      return candidate
    }
  } catch {
    // DNS lookup failed
  }

  return null
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function findContactEmail(
  domain: string,
  timeoutMs = 8000
): Promise<EmailFindResult> {
  // Clean domain — strip www
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '')

  // 1. Website scraping — best quality, own-domain email
  const scraped = await scrapeWebsite(cleanDomain, timeoutMs)
  if (scraped) return { email: scraped, source: 'website_scrape' }

  // 2. RDAP (free)
  const rdap = await rdapLookup(cleanDomain, 5000)
  if (rdap) return { email: rdap, source: 'rdap' }

  // 3. Paid WHOIS API (optional)
  const whois = await whoisApiLookup(cleanDomain, 5000)
  if (whois) return { email: whois, source: 'whois' }

  // 4. Pattern guess (lowest quality — validated only by MX record existence)
  const pattern = await patternGuess(cleanDomain)
  if (pattern) return { email: pattern, source: 'pattern_guess' }

  return { email: null, source: null }
}
