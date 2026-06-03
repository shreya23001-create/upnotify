/**
 * FQDN validation for user-supplied custom domain inputs.
 *
 * Used by status pages today (engineering-app#52) and likely by any future
 * vanity-domain feature. Pure-syntax check only — DNS resolution and
 * TLS-certificate provisioning are async side-effects that belong on a
 * verification cron, not this hot path.
 *
 * Rules:
 *   - 1-253 chars total
 *   - 2+ labels (must contain at least one dot)
 *   - Each label 1-63 chars, [a-z0-9-], no leading or trailing hyphen
 *   - TLD must be alpha (no all-numeric TLDs — IPs aren't domains)
 *   - Case-insensitive (we lowercase before checking, callers should too)
 *
 * IPs (all-numeric TLD), spaces, control characters are rejected.
 * Protocol prefixes (https://), paths, and ports are auto-stripped by the
 * internal `normaliseDomain` call before validation — so a caller pasting
 * `https://status.example.com/health` still validates cleanly.
 */

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const TLD_ALPHA = /^[a-z]{2,}$/

export function normaliseDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
}

export function isValidCustomDomain(raw: string): boolean {
  if (typeof raw !== 'string') return false
  const host = normaliseDomain(raw)
  if (host.length < 1 || host.length > 253) return false
  const labels = host.split('.')
  if (labels.length < 2) return false
  for (const label of labels) {
    if (!LABEL.test(label)) return false
  }
  if (!TLD_ALPHA.test(labels[labels.length - 1])) return false
  return true
}
