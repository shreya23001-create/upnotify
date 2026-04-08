// =============================================================================
// AOE — Automated Outreach Engine
// Service: email-finder — finds a contact email address for a domain
//
// Strategy: scrape only.
//   Only emails the site owner has voluntarily published on their own site
//   are used. RDAP, WHOIS, and pattern guessing are intentionally excluded —
//   they produce low-quality addresses that damage sender reputation via bounces.
//   If no scrapeable email is found, the site is skipped entirely.
// =============================================================================

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
// Main export
// ---------------------------------------------------------------------------

export async function findContactEmail(
  domain: string,
  timeoutMs = 8000
): Promise<EmailFindResult> {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '')

  // Scrape only — site is skipped entirely if no publishable email is found
  const scraped = await scrapeWebsite(cleanDomain, timeoutMs)
  if (scraped) return { email: scraped, source: 'website_scrape' }

  return { email: null, source: null }
}
