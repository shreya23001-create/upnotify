// Free/consumer webmail and disposable-email domains blocked at signup in
// production only (see isBusinessEmail below) — local/dev/preview stay
// unrestricted so testing with any address (including Mailinator) keeps
// working. Not exhaustive; covers the common providers people actually try.
const BLOCKED_EMAIL_DOMAINS = new Set([
  // Major consumer webmail providers
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'gmx.com', 'gmx.net',
  'zoho.com', 'yandex.com', 'yandex.ru',
  'mail.com', 'inbox.com',
  'rediffmail.com',
  // Disposable / temporary-inbox providers (commonly used to bypass verification)
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.info',
  '10minutemail.com', '10minutemail.net', 'throwawaymail.com',
  'yopmail.com', 'trashmail.com', 'getnada.com', 'sharklasers.com',
  'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'mintemail.com',
])

/**
 * True if `email`'s domain is a free consumer webmail or disposable-email
 * provider — the set that should be blocked on production signups (per the
 * business-account-only requirement), while remaining fully permitted in
 * development/staging so local testing isn't restricted.
 */
export function isBlockedEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1]
  if (!domain) return false
  return BLOCKED_EMAIL_DOMAINS.has(domain)
}
