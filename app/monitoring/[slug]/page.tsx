import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

// ---------------------------------------------------------------------------
// Monitor type definitions
// ---------------------------------------------------------------------------

interface MonitorTypePage {
  slug: string
  name: string
  emoji: string
  tagline: string
  description: string
  howItWorks: string
  whatWeCheck: string[]
  alertConditions: string[]
  whyItMatters: string
  faq: { q: string; a: string }[]
  relatedSlugs: string[]
}

const pages: MonitorTypePage[] = [
  {
    slug: 'http-uptime-monitoring',
    name: 'HTTP/HTTPS Uptime Monitoring',
    emoji: '🌐',
    tagline: 'Know the instant your website goes down.',
    description: 'HTTP/HTTPS uptime monitoring checks whether your website is reachable and returning a valid response. Uptrue performs checks from the edge every 30 seconds to 5 minutes, with two-confirmation logic to eliminate false positives.',
    howItWorks: 'Uptrue sends an HTTP GET request to your URL and evaluates the response status code. If the site returns a 5xx error or times out, a second confirmation check runs 5 seconds later. Only if both fail does an incident open and alerts fire.',
    whatWeCheck: ['HTTP response status (2xx = up, 4xx = degraded, 5xx = down)', 'Response time', 'Custom expected status code', 'Redirect following'],
    alertConditions: ['5xx server error on two consecutive checks', 'Connection timeout', 'Custom expected status code not matched'],
    whyItMatters: 'Every minute of downtime costs you revenue and customer trust. Without monitoring, the first person to know your site is down is often an angry customer. Uptrue alerts you before your users notice.',
    faq: [
      { q: 'How often does Uptrue check my site?', a: 'Depending on your plan, checks run every 30 seconds to 5 minutes. On paid plans you can choose the interval.' },
      { q: 'How do you prevent false alerts?', a: 'We use two-confirmation logic: if a check fails, we immediately run a second check. Alerts only fire if both fail.' },
      { q: 'Do you follow redirects?', a: 'Yes. Uptrue follows HTTP redirects and reports the final status code.' },
    ],
    relatedSlugs: ['ssl-certificate-monitoring', 'response-time-monitoring', 'keyword-monitoring'],
  },
  {
    slug: 'ssl-certificate-monitoring',
    name: 'SSL Certificate Monitoring',
    emoji: '🔒',
    tagline: 'Get alerted before your SSL certificate expires.',
    description: 'SSL certificate monitoring checks your certificate\'s expiry date, chain validity, and issuer. An expired or broken SSL certificate causes browser warnings that drive visitors away instantly.',
    howItWorks: 'Uptrue connects to port 443 and retrieves the TLS certificate. It checks the expiry date, validates the certificate chain, and detects self-signed or incomplete chain configurations.',
    whatWeCheck: ['Days until expiry', 'Certificate chain validity', 'Issuer authority', 'Self-signed detection', 'HSTS presence'],
    alertConditions: ['Certificate expires in under 30 days (warning)', 'Certificate expires in under 7 days (critical)', 'Chain validation failure', 'Certificate already expired'],
    whyItMatters: 'Search engines penalise sites with invalid SSL. Browsers show full-page warnings. Auto-renewal tools fail silently — monitoring catches it before your users do.',
    faq: [
      { q: 'How far in advance do you warn about expiry?', a: 'We alert at 30 days (warning) and again at 7 days (critical), giving you time to renew.' },
      { q: 'Can you detect chain issues?', a: 'Yes. Uptrue checks the full certificate chain and alerts if intermediate certificates are missing.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'security-headers-monitoring', 'domain-expiry-monitoring'],
  },
  {
    slug: 'dns-monitoring',
    name: 'DNS Record Monitoring',
    emoji: '📡',
    tagline: 'Detect unexpected DNS changes before they cause outages.',
    description: 'DNS monitoring checks your A, MX, NS, and TXT records and alerts you when anything changes. Unexpected DNS changes can redirect traffic, break email, or indicate a compromise.',
    howItWorks: 'Uptrue resolves all major record types for your domain on each check cycle. If any record differs from the previous snapshot, an alert fires with a diff of what changed.',
    whatWeCheck: ['A records (IPv4)', 'MX records (mail routing)', 'NS records (nameservers)', 'TXT records (SPF, DMARC, verification)'],
    alertConditions: ['Any DNS record changes from baseline', 'DNS resolution failure'],
    whyItMatters: 'DNS changes propagate globally in minutes. A misconfiguration or hijack can silently redirect your users or drop your email. Early detection is critical.',
    faq: [
      { q: 'What records do you monitor?', a: 'A, MX, NS, and TXT records. We show a full diff of what changed.' },
      { q: 'How quickly do you detect DNS changes?', a: 'Depending on your check interval, within 30 seconds to 5 minutes of the change propagating.' },
    ],
    relatedSlugs: ['nameserver-monitoring', 'mx-health-monitoring', 'spf-dmarc-monitoring'],
  },
  {
    slug: 'keyword-monitoring',
    name: 'Keyword Detection Monitoring',
    emoji: '🔍',
    tagline: 'Verify critical content is always present on your page.',
    description: 'Keyword monitoring fetches your page and checks for the presence or absence of specific text strings. Use it to confirm checkout flows work, API responses are correct, or compliance text remains on your site.',
    howItWorks: 'Uptrue fetches the full HTML of your target URL and searches for your specified positive and negative keywords. You can require multiple keywords to all be present, or alert when a keyword disappears.',
    whatWeCheck: ['Positive keywords (must be present)', 'Negative keywords (must be absent)', 'Case-insensitive matching'],
    alertConditions: ['Required keyword not found in page body', 'Forbidden keyword appears in page body'],
    whyItMatters: 'Your site can return 200 OK while showing a broken checkout, a maintenance page, or missing legal text. Keyword monitoring catches what status codes miss.',
    faq: [
      { q: 'Can I check for multiple keywords?', a: 'Yes. You can add multiple positive and negative keywords. All positive keywords must be present; any negative keyword triggers an alert.' },
      { q: 'Is the check case-sensitive?', a: 'No. Keyword matching is case-insensitive by default.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'page-change-detection', 'api-endpoint-monitoring'],
  },
  {
    slug: 'domain-expiry-monitoring',
    name: 'Domain Expiry Monitoring',
    emoji: '📅',
    tagline: 'Never let your domain registration lapse.',
    description: 'Domain expiry monitoring tracks when your domain registration expires and alerts you weeks before it lapses. An expired domain goes dark instantly — and may be snapped up by squatters.',
    howItWorks: 'Uptrue performs WHOIS lookups for your domain and extracts the expiry date. Alerts fire at configurable thresholds before the registration expires.',
    whatWeCheck: ['Domain registration expiry date', 'Registrar information', 'WHOIS availability'],
    alertConditions: ['Domain expires within 30 days', 'Domain expires within 7 days', 'WHOIS lookup failure'],
    whyItMatters: 'Auto-renewal can fail silently due to expired payment cards or registrar issues. Monitoring gives you a safety net.',
    faq: [
      { q: 'How far in advance do you alert?', a: '30 days and 7 days before expiry by default.' },
      { q: 'Does this work for all TLDs?', a: 'We support most common TLDs via WHOIS. Some ccTLDs have restricted WHOIS data.' },
    ],
    relatedSlugs: ['whois-registrar-monitoring', 'ssl-certificate-monitoring', 'nameserver-monitoring'],
  },
  {
    slug: 'port-monitoring',
    name: 'Port Check Monitoring',
    emoji: '🔌',
    tagline: 'Verify TCP ports are open and accepting connections.',
    description: 'Port monitoring attempts a TCP connection to a specified host and port. Essential for monitoring databases, mail servers, FTP, SSH, and any custom TCP service.',
    howItWorks: 'Uptrue opens a TCP socket to your target host and port with a configurable timeout. If the connection is refused or times out, an alert fires.',
    whatWeCheck: ['TCP connection success', 'Connection response time', 'Port accessibility from external network'],
    alertConditions: ['TCP connection refused', 'Connection timeout', 'Host unreachable'],
    whyItMatters: 'Many services expose health through port availability. A closed database port means application failures even when the web server returns 200.',
    faq: [
      { q: 'Which ports can I monitor?', a: 'Any TCP port — common ones include 22 (SSH), 25/587 (SMTP), 3306 (MySQL), 5432 (PostgreSQL), 6379 (Redis).' },
      { q: 'Does it check UDP ports?', a: 'No. Uptrue currently checks TCP ports only.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'ping-monitoring', 'api-endpoint-monitoring'],
  },
  {
    slug: 'ping-monitoring',
    name: 'Ping / Reachability Monitoring',
    emoji: '📶',
    tagline: 'Basic ICMP reachability for servers and network devices.',
    description: 'Ping monitoring sends ICMP echo requests to verify a host is reachable on the network. The simplest and fastest check — ideal for servers, routers, and IoT devices.',
    howItWorks: 'Uptrue sends ICMP ping packets to your target IP or hostname. If the host fails to respond within the timeout, an alert fires.',
    whatWeCheck: ['ICMP echo response', 'Round-trip time', 'Packet loss'],
    alertConditions: ['No ICMP response within timeout', 'Consistent packet loss'],
    whyItMatters: 'Even if no application is running, you need to know if a machine is reachable. Ping is the fastest way to confirm basic network connectivity.',
    faq: [
      { q: 'What if my server blocks ICMP?', a: 'Use Port or HTTP monitoring instead — these use TCP which is rarely blocked.' },
      { q: 'Can I monitor internal IPs?', a: 'No. Uptrue monitors external IPs only to prevent SSRF risks.' },
    ],
    relatedSlugs: ['port-monitoring', 'http-uptime-monitoring'],
  },
  {
    slug: 'api-endpoint-monitoring',
    name: 'API Endpoint Monitoring',
    emoji: '⚡',
    tagline: 'Test REST APIs with custom assertions on status, body, and latency.',
    description: 'API endpoint monitoring goes beyond simple uptime. You define assertions on the HTTP status code, response body content, and response time. Catches API regressions before users do.',
    howItWorks: 'Uptrue sends an HTTP request (GET, POST, etc.) to your API endpoint with optional custom headers and body. It evaluates your defined assertions and alerts if any fail.',
    whatWeCheck: ['HTTP status code assertion', 'Response body contains assertion', 'Response time assertion', 'Custom request headers and body'],
    alertConditions: ['Status code does not match assertion', 'Response body does not contain expected string', 'Response time exceeds threshold'],
    whyItMatters: 'An API can return 200 OK with error data in the body. Status-only monitoring misses this. Assertions catch semantic failures.',
    faq: [
      { q: 'Can I send POST requests?', a: 'Yes. You can configure method, headers, and body.' },
      { q: 'Can I monitor authenticated APIs?', a: 'Yes. Add an Authorization header with your Bearer token or API key.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'keyword-monitoring', 'response-time-monitoring'],
  },
  {
    slug: 'heartbeat-monitoring',
    name: 'Heartbeat Monitoring',
    emoji: '💓',
    tagline: 'Detect silent cron job and background task failures.',
    description: 'Heartbeat monitoring flips the model: instead of Uptrue pinging your service, your service pings Uptrue. If Uptrue doesn\'t hear from your cron job or task within the expected interval, it fires an alert.',
    howItWorks: 'Uptrue gives you a unique ping URL. Your scheduled jobs call this URL on success. If a check-in is missed within your configured window, an incident opens.',
    whatWeCheck: ['Ping received within expected interval', 'Consistent heartbeat rhythm'],
    alertConditions: ['No heartbeat received within grace period after expected time'],
    whyItMatters: 'Cron jobs fail silently. Log rotation jobs, backup scripts, payment processors — if they stop running, you may not know for days. Heartbeat monitoring catches the absence of expected events.',
    faq: [
      { q: 'How do I send a heartbeat?', a: 'A simple HTTP GET to your unique Uptrue ping URL. One line in your cron job.' },
      { q: 'What\'s the grace period?', a: 'Configurable. If your job runs every hour, you might set a 15-minute grace period to allow for normal variation.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'api-endpoint-monitoring'],
  },
  {
    slug: 'page-change-detection',
    name: 'Page Change Detection',
    emoji: '👁️',
    tagline: 'Alert when competitor or partner pages change.',
    description: 'Page change detection fetches a target page and alerts you when the content changes. Track competitor pricing, partner terms, regulatory pages, or any web content you need to stay current on.',
    howItWorks: 'Uptrue fetches the full HTML of your target URL and computes a hash. If the hash differs from the previous run, a change alert fires with context about what section changed.',
    whatWeCheck: ['Full page HTML hash', 'Content change detection'],
    alertConditions: ['Page content hash changes from baseline'],
    whyItMatters: 'Manually watching competitor or partner pages is time-consuming and error-prone. Automated change detection ensures you never miss a pricing change, policy update, or product announcement.',
    faq: [
      { q: 'Does it work on JavaScript-rendered pages?', a: 'It checks the raw HTTP response. For JS-rendered content, we recommend checking a known stable element on the page.' },
      { q: 'How specific can the change detection be?', a: 'Currently whole-page hash detection. Section-level monitoring is on the roadmap.' },
    ],
    relatedSlugs: ['keyword-monitoring', 'http-uptime-monitoring'],
  },
  {
    slug: 'security-headers-monitoring',
    name: 'Security Headers Monitoring',
    emoji: '🛡️',
    tagline: 'Ensure your HTTP security headers stay configured.',
    description: 'Security headers monitoring checks that critical HTTP response headers are present and configured. Missing headers are a common source of security vulnerabilities caught in penetration tests and compliance audits.',
    howItWorks: 'Uptrue sends a HEAD request to your URL and checks for the presence of six key security headers: Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.',
    whatWeCheck: ['Strict-Transport-Security (HSTS)', 'Content-Security-Policy (CSP)', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'],
    alertConditions: ['One or more required security headers are missing', 'No security headers found (critical)'],
    whyItMatters: 'Security headers prevent clickjacking, XSS, MIME sniffing, and data leakage. CDN configuration changes, framework updates, or reverse proxy changes can strip them silently.',
    faq: [
      { q: 'Which headers do you check?', a: 'HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.' },
      { q: 'What score does my site get?', a: 'Each header present adds points. Missing any header triggers a degraded status. Missing all triggers a critical alert.' },
    ],
    relatedSlugs: ['ssl-certificate-monitoring', 'spf-dmarc-monitoring', 'http-uptime-monitoring'],
  },
  {
    slug: 'response-time-monitoring',
    name: 'Response Time Threshold Monitoring',
    emoji: '⏱️',
    tagline: 'Alert when your site becomes too slow for users.',
    description: 'Response time threshold monitoring measures how long your site takes to respond and fires alerts when it exceeds your defined thresholds. Slow responses hurt conversions and Core Web Vitals scores.',
    howItWorks: 'Uptrue measures the full round-trip time from request to first byte received. If the response time exceeds your warn threshold, status goes degraded. If it exceeds the critical threshold, an incident opens.',
    whatWeCheck: ['Time to first byte (TTFB)', 'Total response time', 'Response status code'],
    alertConditions: ['Response time exceeds warn threshold (degraded)', 'Response time exceeds critical threshold (down)', 'Request timeout'],
    whyItMatters: 'Google uses Core Web Vitals as a ranking signal. A slow server degrades user experience and conversion rates. Monitoring response time separately from uptime lets you catch degradation before it becomes downtime.',
    faq: [
      { q: 'What thresholds should I set?', a: 'A common setup is warn at 1500ms and critical at 3000ms. Adjust based on your users\' expectations and current baseline.' },
      { q: 'Does this include page render time?', a: 'No. This measures server response time (TTFB), not full page load including client-side rendering.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'api-endpoint-monitoring', 'page-size-monitoring'],
  },
  {
    slug: 'robots-txt-monitoring',
    name: 'robots.txt Change Monitoring',
    emoji: '🤖',
    tagline: 'Detect accidental changes that could de-index your site.',
    description: 'robots.txt monitoring fetches your robots.txt file on each check cycle and alerts you when the content changes. An accidental Disallow: / can block all search engines within hours.',
    howItWorks: 'Uptrue fetches /robots.txt from your domain and computes a SHA-256 hash of the content. If the hash differs from the previous run, a change alert fires.',
    whatWeCheck: ['robots.txt accessibility (HTTP status)', 'Content hash change detection', 'File size'],
    alertConditions: ['robots.txt content changes from baseline', 'robots.txt returns non-200 status'],
    whyItMatters: 'A single line change in robots.txt can tell Google to stop crawling your entire site. This has happened to major brands during CMS migrations and framework upgrades.',
    faq: [
      { q: 'Does it detect what changed?', a: 'It alerts you that content changed and gives you the hash. You\'ll need to compare the current file to your baseline.' },
      { q: 'What if my robots.txt is intentionally dynamic?', a: 'You can pause the monitor or increase the check interval if frequent changes are expected.' },
    ],
    relatedSlugs: ['sitemap-monitoring', 'http-uptime-monitoring', 'keyword-monitoring'],
  },
  {
    slug: 'ip-change-monitoring',
    name: 'IP Address Change Monitoring',
    emoji: '🗺️',
    tagline: 'Alert when your domain resolves to a different IP address.',
    description: 'IP change monitoring resolves your domain\'s A record on each check and alerts you when the IP changes. Catches unexpected CDN failovers, BGP route changes, DNS misconfigurations, and potential hijacking.',
    howItWorks: 'Uptrue resolves your domain\'s A records using public DNS and compares the primary IP to the stored baseline. If the IP changes, an alert fires with the old and new addresses.',
    whatWeCheck: ['Primary A record IPv4 address', 'All resolved A records', 'DNS resolution success'],
    alertConditions: ['Resolved IP differs from stored baseline', 'DNS resolution failure'],
    whyItMatters: 'IP changes are expected during CDN migrations, but unexpected changes may indicate DNS hijacking, misconfigured DNS, or infrastructure failures that route traffic to the wrong server.',
    faq: [
      { q: 'Does it monitor IPv6 too?', a: 'Currently monitors IPv4 (A records). IPv6 (AAAA) support is on the roadmap.' },
      { q: 'What if we intentionally change our IP?', a: 'Update the monitor baseline after the migration. You\'ll get one alert on the change, then the new IP becomes the new baseline.' },
    ],
    relatedSlugs: ['dns-monitoring', 'nameserver-monitoring', 'whois-registrar-monitoring'],
  },
  {
    slug: 'mx-health-monitoring',
    name: 'MX Health Monitoring',
    emoji: '📧',
    tagline: 'Verify your mail server is configured and reachable.',
    description: 'MX health monitoring checks that your domain has valid MX records and that the primary mail server resolves successfully. Broken MX configuration means lost email — often silent for days.',
    howItWorks: 'Uptrue resolves MX records for your domain, sorts by priority, and attempts to resolve the highest-priority mail server\'s A record. If MX records are missing or the primary server doesn\'t resolve, an alert fires.',
    whatWeCheck: ['MX records present', 'MX record priority ordering', 'Primary mail server A record resolves', 'All MX servers reachable'],
    alertConditions: ['No MX records found for domain', 'Primary MX host does not resolve'],
    whyItMatters: 'Email failures are often the last thing discovered during domain migrations, registrar transfers, or DNS changes. By then, days of mail may have been lost.',
    faq: [
      { q: 'Does it test SMTP connectivity?', a: 'Currently checks DNS resolution of MX hosts. SMTP banner checks are on the roadmap.' },
      { q: 'What if I use Google Workspace or Microsoft 365?', a: 'Their MX hosts are well-known and reliably resolve. We\'ll alert you if the configuration drifts.' },
    ],
    relatedSlugs: ['spf-dmarc-monitoring', 'dns-monitoring', 'blacklist-monitoring'],
  },
  {
    slug: 'whois-registrar-monitoring',
    name: 'WHOIS Registrar Change Monitoring',
    emoji: '📋',
    tagline: 'Detect registrar transfers and WHOIS data changes.',
    description: 'WHOIS registrar change monitoring detects changes to your domain\'s SOA record and nameservers — the signals most likely to indicate a registrar transfer, domain hijacking, or unauthorised account changes.',
    howItWorks: 'Uptrue queries DNS SOA and NS records for your domain on each check cycle. If the hostmaster, primary nameserver, or NS records change from the baseline, an alert fires.',
    whatWeCheck: ['SOA hostmaster', 'SOA primary nameserver', 'Authoritative nameservers (NS)', 'Combined change detection'],
    alertConditions: ['SOA or NS record snapshot changes from baseline'],
    whyItMatters: 'Domain hijacking often starts with an unauthorised registrar transfer. Catching it immediately via DNS changes gives you the best chance of reclaiming the domain before propagation completes globally.',
    faq: [
      { q: 'Is this the same as a full WHOIS lookup?', a: 'We use DNS SOA and NS records as a proxy for registrar/registrant changes. Full WHOIS is rate-limited by most registries, making frequent polling impractical.' },
    ],
    relatedSlugs: ['domain-expiry-monitoring', 'nameserver-monitoring', 'ip-change-monitoring'],
  },
  {
    slug: 'sitemap-monitoring',
    name: 'Sitemap Validity Monitoring',
    emoji: '🗺️',
    tagline: 'Ensure your sitemap.xml is always accessible and valid.',
    description: 'Sitemap validity monitoring fetches /sitemap.xml and verifies it is reachable and contains valid XML. A missing or broken sitemap silently stops Google from discovering new pages on your site.',
    howItWorks: 'Uptrue fetches /sitemap.xml from your domain on each check cycle. It verifies the response status, checks the content is valid XML (urlset or sitemapindex), and reports URL counts.',
    whatWeCheck: ['sitemap.xml HTTP accessibility', 'Valid XML structure', 'URL count', 'Sitemap index detection'],
    alertConditions: ['sitemap.xml returns non-200 status', 'Response is not valid XML'],
    whyItMatters: 'Framework updates, CMS changes, and server misconfigurations can break sitemap generation. Without monitoring, you won\'t know your sitemap is broken until you notice a rankings drop weeks later.',
    faq: [
      { q: 'Do you check sitemap index files?', a: 'Yes. We detect both urlset (standard) and sitemapindex (sitemap of sitemaps) formats.' },
      { q: 'Do you validate all URLs in the sitemap?', a: 'Not currently — we validate the sitemap structure and report URL counts, not individual URL accessibility.' },
    ],
    relatedSlugs: ['robots-txt-monitoring', 'http-uptime-monitoring'],
  },
  {
    slug: 'redirect-chain-monitoring',
    name: 'Redirect Chain Monitoring',
    emoji: '🔗',
    tagline: 'Detect redirect loops, long chains, and broken final destinations.',
    description: 'Redirect chain monitoring follows your URL\'s redirect hops and alerts when chains are too long, end in errors, or form loops. Excessive redirects hurt Core Web Vitals and can drop pages from Google\'s index.',
    howItWorks: 'Uptrue follows redirects manually (not automatically), recording each hop\'s URL and status code. If the chain exceeds your configured maximum hops, or the final destination returns an error, an alert fires.',
    whatWeCheck: ['Full redirect chain (each hop URL and status)', 'Total hop count', 'Final destination status code', 'Loop detection'],
    alertConditions: ['Chain exceeds maximum hop limit', 'Final destination returns 4xx or 5xx', 'Redirect loop detected'],
    whyItMatters: 'Google recommends fewer than 3 redirect hops for optimal crawling. Long chains increase page load time for every user. Broken chains cause 404s that accumulate link equity loss.',
    faq: [
      { q: 'What\'s the default maximum redirect hops?', a: '5 hops. You can configure this per monitor.' },
      { q: 'Does it detect HTTP to HTTPS redirects?', a: 'Yes. Each redirect hop is recorded, so you\'ll see the full chain including HTTP→HTTPS transitions.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'response-time-monitoring'],
  },
  {
    slug: 'spf-dmarc-monitoring',
    name: 'SPF / DMARC Monitoring',
    emoji: '✉️',
    tagline: 'Ensure your email authentication records are correctly configured.',
    description: 'SPF/DMARC monitoring checks your domain\'s email authentication DNS records. Missing or misconfigured SPF and DMARC records allow attackers to spoof your domain in phishing emails.',
    howItWorks: 'Uptrue queries TXT records for your domain (SPF) and _dmarc.yourdomain.com (DMARC) on each check cycle. Missing records trigger a critical alert. Weak policies (p=none for DMARC, missing all mechanism for SPF) trigger warnings.',
    whatWeCheck: ['SPF record (v=spf1)', 'SPF all mechanism (-all, ~all)', 'DMARC record (v=DMARC1)', 'DMARC policy strength (p=none warning)'],
    alertConditions: ['No SPF record found', 'No DMARC record found', 'DMARC p=none (monitoring-only, no enforcement)'],
    whyItMatters: 'Email spoofing attacks impersonate your brand. Google and Yahoo now require SPF and DMARC for bulk senders. Without them, legitimate emails may be marked as spam.',
    faq: [
      { q: 'What\'s the difference between SPF and DMARC?', a: 'SPF specifies which servers can send email for your domain. DMARC tells receiving mail servers what to do if SPF or DKIM checks fail (quarantine or reject).' },
      { q: 'My DMARC is p=none — is that a problem?', a: 'p=none means monitoring-only — no enforcement. We flag it as a warning. Moving to p=quarantine or p=reject protects your brand.' },
    ],
    relatedSlugs: ['mx-health-monitoring', 'dns-monitoring', 'blacklist-monitoring'],
  },
  {
    slug: 'blacklist-monitoring',
    name: 'Blacklist / DNSBL Monitoring',
    emoji: '🚫',
    tagline: 'Know if your server IP is listed on spam block lists.',
    description: 'Blacklist monitoring checks your server\'s IP address against major DNS-based block lists (DNSBL). Being listed destroys email deliverability and can cause inbound email to be rejected.',
    howItWorks: 'Uptrue resolves your domain to its IP address and performs reverse DNS lookups against four major block list zones: Spamhaus ZEN, SpamCop, SORBS, and Barracuda. If any returns a positive result, an alert fires.',
    whatWeCheck: ['Spamhaus ZEN (zen.spamhaus.org)', 'SpamCop (bl.spamcop.net)', 'SORBS (dnsbl.sorbs.net)', 'Barracuda (b.barracudacentral.org)'],
    alertConditions: ['Domain IP listed on one or more DNSBL zones'],
    whyItMatters: 'Getting listed on Spamhaus can cause your emails to be rejected by millions of recipients overnight. Shared hosting and cloud IP ranges are especially vulnerable to neighbour listings.',
    faq: [
      { q: 'What do I do if I\'m listed?', a: 'Each block list has a delisting process. Spamhaus and Barracuda have web forms. Fix the underlying spam/abuse issue first.' },
      { q: 'Which block lists do you check?', a: 'Spamhaus ZEN, SpamCop, SORBS, and Barracuda Central — the four most widely used.' },
    ],
    relatedSlugs: ['mx-health-monitoring', 'spf-dmarc-monitoring'],
  },
  {
    slug: 'page-size-monitoring',
    name: 'Page Size Monitoring',
    emoji: '📦',
    tagline: 'Alert when your page weight grows beyond acceptable limits.',
    description: 'Page size monitoring measures the raw byte size of your page response and alerts when it exceeds configurable warn and critical thresholds. Page bloat slows load times and increases CDN egress costs.',
    howItWorks: 'Uptrue fetches your URL and measures the response body size in kilobytes. If it exceeds your warn threshold, status goes degraded. If it exceeds the critical threshold, an incident opens.',
    whatWeCheck: ['HTTP response body size (KB)', 'Warn threshold', 'Critical threshold'],
    alertConditions: ['Page size exceeds warn threshold (degraded)', 'Page size exceeds critical threshold (down)'],
    whyItMatters: 'Unnoticed asset additions, image uploads without compression, or third-party script bloat can double your page weight. Monitoring catches it before it affects user experience and Core Web Vitals.',
    faq: [
      { q: 'What thresholds should I set?', a: 'Typical: warn at 1MB, critical at 3MB for HTML pages. For APIs, much lower (warn 100KB).' },
      { q: 'Does this include images and CSS?', a: 'This measures the raw HTML response only. Full page weight including assets is measured by Lighthouse tools.' },
    ],
    relatedSlugs: ['response-time-monitoring', 'http-uptime-monitoring'],
  },
  {
    slug: 'cookie-consent-monitoring',
    name: 'Cookie Consent Monitoring',
    emoji: '🍪',
    tagline: 'Verify your cookie consent banner is always present.',
    description: 'Cookie consent monitoring scans your page for the presence of cookie consent mechanisms. A missing banner can trigger GDPR, CCPA, or ePrivacy Directive compliance violations.',
    howItWorks: 'Uptrue fetches your page HTML and checks for signatures of common cookie consent platforms including CookieYes, OneTrust, TrustArc, CookieBot, Usercentrics, and others. If none is detected, an alert fires.',
    whatWeCheck: ['CookieYes', 'OneTrust', 'TrustArc / TrueConvert', 'Cookiebot', 'Usercentrics', 'ConsentManager', 'Generic GDPR/cookie-law patterns'],
    alertConditions: ['No cookie consent mechanism detected in page HTML'],
    whyItMatters: 'A CMS update, A/B test, or CDN misconfiguration can silently remove your consent banner. Under GDPR, this constitutes unlawful processing of personal data — with fines up to €20 million or 4% of annual turnover.',
    faq: [
      { q: 'Does it detect custom-built consent tools?', a: 'It checks for known patterns. Custom-built tools may not be detected. Consider adding a known CSS class or data attribute we can check for.' },
      { q: 'Does it check consent is working, not just present?', a: 'It checks presence only — whether the consent tool scripts/elements exist in the HTML.' },
    ],
    relatedSlugs: ['http-uptime-monitoring', 'keyword-monitoring'],
  },
  {
    slug: 'nameserver-monitoring',
    name: 'Nameserver Change Monitoring',
    emoji: '🖥️',
    tagline: 'Alert the instant your authoritative nameservers change.',
    description: 'Nameserver change monitoring resolves your domain\'s NS records on each check cycle and alerts when the authoritative nameservers differ from the stored baseline. Nameserver changes cause global DNS propagation and can cause service outages.',
    howItWorks: 'Uptrue resolves NS records for your domain and sorts them for consistent comparison. If the set of authoritative nameservers changes from the baseline, an alert fires with the old and new nameservers.',
    whatWeCheck: ['Authoritative nameserver (NS) records', 'Nameserver set comparison', 'DNS resolution success'],
    alertConditions: ['Nameserver records differ from stored baseline'],
    whyItMatters: 'Nameserver changes happen during domain transfers, registrar migrations, and DNS provider switches. Unauthorised nameserver changes may indicate account compromise. Authorised changes still need monitoring to verify correct propagation.',
    faq: [
      { q: 'What\'s the difference between this and DNS record monitoring?', a: 'DNS record monitoring watches A, MX, NS, TXT records together. Nameserver monitoring focuses specifically on NS changes which affect all records globally.' },
      { q: 'How long does DNS propagation take?', a: 'Typically 24-48 hours, though often much faster. TTLs determine how quickly cached records expire.' },
    ],
    relatedSlugs: ['dns-monitoring', 'whois-registrar-monitoring', 'ip-change-monitoring'],
  },
]

const pageMap = new Map(pages.map(p => [p.slug, p]))

export async function generateStaticParams() {
  return pages.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = pageMap.get(slug)
  if (!page) return {}
  return {
    title: `${page.name} | Uptrue`,
    description: page.description,
    alternates: { canonical: `https://uptrue.io/monitoring/${slug}` },
    openGraph: {
      title: `${page.name} | Uptrue`,
      description: page.description,
    },
  }
}

export default async function MonitoringTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = pageMap.get(slug)
  if (!page) notFound()

  const relatedPages = page.relatedSlugs
    .map(s => pages.find(p => p.slug === s))
    .filter(Boolean) as MonitorTypePage[]

  return (
    <>
      <PublicNav />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 32 }}>
          <Link href="/monitoring" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>All Monitor Types</Link>
          {' → '}
          {page.name}
        </nav>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{page.emoji}</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -0.5 }}>{page.name}</h1>
          <p style={{ fontSize: 20, color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.5 }}>{page.tagline}</p>
          <p style={{ fontSize: 16, lineHeight: 1.7 }}>{page.description}</p>
        </div>

        {/* CTA */}
        <div style={{ background: 'var(--color-surface-2, #f5f5f5)', borderRadius: 12, padding: '24px 28px', marginBottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Start monitoring in 60 seconds</div>
            <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>Free plan includes 5 monitors. No credit card required.</div>
          </div>
          <Link
            href="https://app.uptrue.io/signup"
            style={{
              background: 'var(--color-accent)', color: '#fff',
              padding: '10px 24px', borderRadius: 8, fontWeight: 600,
              textDecoration: 'none', fontSize: 15, whiteSpace: 'nowrap',
            }}
          >
            Get Started Free
          </Link>
        </div>

        {/* How it works */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>How it works</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-fg)' }}>{page.howItWorks}</p>
        </section>

        {/* What we check */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>What Uptrue checks</h2>
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {page.whatWeCheck.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, fontSize: 15 }}>
                <span style={{ color: 'var(--color-accent)', marginTop: 1 }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Alert conditions */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Alert conditions</h2>
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {page.alertConditions.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, fontSize: 15 }}>
                <span style={{ color: '#e55', marginTop: 1 }}>⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why it matters */}
        <section style={{ marginBottom: 40, padding: '24px 28px', borderLeft: '3px solid var(--color-accent)', background: 'var(--color-surface-2, #f9f9f9)', borderRadius: '0 8px 8px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Why this matters</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>{page.whyItMatters}</p>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Frequently asked questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {page.faq.map((item, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.q}</div>
                <div style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.65 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        {relatedPages.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Related monitor types</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {relatedPages.map(r => (
                <Link
                  key={r.slug}
                  href={`/monitoring/${r.slug}`}
                  style={{
                    display: 'block', padding: '16px 20px', borderRadius: 10,
                    border: '1.5px solid var(--color-border)',
                    textDecoration: 'none', color: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{r.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <div style={{ textAlign: 'center', padding: '40px 24px', border: '1.5px solid var(--color-border)', borderRadius: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Ready to set up {page.name.split(' ')[0]} monitoring?</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: 24 }}>
            Join thousands of teams who monitor their infrastructure with Uptrue.
            Free plan. No credit card.
          </p>
          <Link
            href="https://app.uptrue.io/signup"
            style={{
              display: 'inline-block', background: 'var(--color-accent)', color: '#fff',
              padding: '12px 32px', borderRadius: 8, fontWeight: 700,
              textDecoration: 'none', fontSize: 16,
            }}
          >
            Start Monitoring Free
          </Link>
        </div>

      </main>
      <PublicFooter />
    </>
  )
}
