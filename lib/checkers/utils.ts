/**
 * Extracts the registrable apex domain from a monitor target URL or hostname.
 * Used by checkers that operate on the domain level (RDAP, WHOIS, MX, NS, SPF/DMARC, blacklist).
 *
 * Examples:
 *   www.crispydosa.com   → crispydosa.com
 *   sub.example.co.uk    → example.co.uk
 *   https://example.com/ → example.com
 */
export function apexDomain(target: string): string {
  const host = target.replace(/^https?:\/\//, '').split('/')[0].toLowerCase()
  const parts = host.split('.')
  if (parts.length <= 2) return host
  // Keep last 3 parts for ccSLDs like co.uk, com.au, org.nz (second-to-last ≤ 3 chars)
  return parts[parts.length - 2].length <= 3
    ? parts.slice(-3).join('.')
    : parts.slice(-2).join('.')
}
