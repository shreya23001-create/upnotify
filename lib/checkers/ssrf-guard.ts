// Shared SSRF protection for all HTTP-based checkers.
// Block private/internal IP ranges and cloud metadata endpoints.

const BLOCKED_HOSTS = ['localhost', '0.0.0.0', '169.254.169.254', '100.100.100.200']
const BLOCKED_PREFIXES = [
  '127.', '10.', '192.168.',
  '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.',
  '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.',
  '172.28.', '172.29.', '172.30.', '172.31.',
  '::1', 'fc00:', 'fd',
]

export function isSafeUrl(url: string): boolean {
  let parsed: URL
  try { parsed = new URL(url) } catch { return false }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false
  const host = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTS.includes(host)) return false
  if (BLOCKED_PREFIXES.some(p => host.startsWith(p))) return false
  return true
}
