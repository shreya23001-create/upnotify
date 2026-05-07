// Single source of truth for all 23 monitor types.
// Used by: alert copy, landing pages, homepage cards, help docs, monitor-type-insight.

export interface AlertCopyTemplate {
  subject: string
  headline: string
  detail: string
  shortText: string       // max 160 chars for SMS
  voiceScript: string     // spoken by TTS — natural language, no symbols
}

export interface MonitorTypeDefinition {
  type: string            // DB value
  slug: string            // URL slug for /monitoring/[slug]
  name: string            // display name
  emoji: string
  tagline: string         // one-line marketing hook
  description: string     // 2–3 sentence explanation
  whatItCatches: string[] // bullet list
  whyItMatters: string    // business impact sentence
  defaultInterval: number // seconds — pre-selected in create form
  minInterval: number     // seconds — lowest sensible interval for this type
  alertCopy: AlertCopyTemplate
  recoveryCopy: AlertCopyTemplate
}

// Placeholders resolved at alert dispatch time:
//   {{monitorName}}     — monitor.name
//   {{target}}          — monitor.target
//   {{severity}}        — incident.severity
//   {{checkedAt}}       — incident.created_at (formatted)
//   {{resolvedAt}}      — incident.resolved_at (formatted)
//   {{downDuration}}    — human-readable duration since incident opened
//   {{daysUntilExpiry}} — metadata.daysUntilExpiry
//   {{issuer}}          — metadata.issuer
//   {{grade}}           — metadata.grade
//   {{missingHeaders}}  — metadata.missing joined as list
//   {{currentIp}}       — metadata.currentIp
//   {{previousIp}}      — metadata.previousIp
//   {{listedOn}}        — metadata.listed joined as list
//   {{hopCount}}        — metadata.hopCount
//   {{finalUrl}}        — metadata.finalUrl
//   {{mxIssues}}        — metadata.mxIssues joined as list
//   {{spfStatus}}       — metadata.spfStatus
//   {{dmarcStatus}}     — metadata.dmarcStatus
//   {{registrar}}       — metadata.registrar
//   {{pageSize}}        — metadata.pageSizeKb + 'KB'
//   {{responseTime}}    — metadata.responseTimeMs + 'ms'
//   {{threshold}}       — metadata.thresholdMs + 'ms'
//   {{changeType}}      — metadata.changeType (robots.txt / sitemap / WHOIS)

export const MONITOR_TYPES: MonitorTypeDefinition[] = [
  {
    type: 'http',
    slug: 'http-uptime-monitoring',
    name: 'HTTP/HTTPS Uptime',
    emoji: '🌐',
    tagline: 'Know the instant your website goes down',
    defaultInterval: 60,
    minInterval: 30,
    description:
      'Sends an HTTP request to your URL every few minutes and alerts you the moment it stops responding or returns an error. Catches outages before your users do.',
    whatItCatches: [
      'Site returning 4xx or 5xx status codes',
      'Server not responding (connection timeout)',
      'Unexpected redirects',
      'SSL handshake failures',
    ],
    whyItMatters:
      'Every minute of downtime costs revenue and damages trust — knowing instantly lets you act before customers notice.',
    alertCopy: {
      subject: '[{{severity}}] {{monitorName}} is down',
      headline: '{{monitorName}} is not responding',
      detail:
        'We detected that {{target}} stopped responding at {{checkedAt}}. We confirmed the outage with a second check from a different location before alerting you.',
      shortText: '[Uptrue] {{monitorName}} is down as of {{checkedAt}}. Check your site immediately.',
      voiceScript:
        'This is an Uptrue alert. {{monitorName}} is down. Your website at {{target}} stopped responding at {{checkedAt}}. Please check your site immediately.',
    },
    recoveryCopy: {
      subject: '✅ {{monitorName}} is back up',
      headline: '{{monitorName}} has recovered',
      detail:
        '{{target}} is responding normally again as of {{resolvedAt}}. Total downtime was {{downDuration}}.',
      shortText: '[Uptrue] {{monitorName}} is back up as of {{resolvedAt}}. Downtime: {{downDuration}}.',
      voiceScript:
        'This is an Uptrue recovery alert. {{monitorName}} is back up. Your website at {{target}} is responding normally as of {{resolvedAt}}. Total downtime was {{downDuration}}.',
    },
  },
  {
    type: 'ssl',
    slug: 'ssl-certificate-monitoring',
    name: 'SSL Certificate',
    emoji: '🔒',
    tagline: 'Never let an expired SSL certificate take down your site',
    defaultInterval: 86400,
    minInterval: 3600,
    description:
      'Monitors your SSL certificate expiry date and alerts you before it expires. Also detects invalid, self-signed, or revoked certificates that could trigger browser warnings.',
    whatItCatches: [
      'SSL certificate expiring within 30 or 14 days',
      'Certificate already expired',
      'Self-signed or untrusted certificate',
      'Certificate issued for the wrong domain',
    ],
    whyItMatters:
      'An expired SSL certificate shows a scary browser warning to every visitor, killing conversions and trust instantly.',
    alertCopy: {
      subject: '[{{severity}}] SSL certificate for {{monitorName}} expires in {{daysUntilExpiry}} days',
      headline: 'SSL certificate expiring soon',
      detail:
        'The SSL certificate for {{target}} expires in {{daysUntilExpiry}} days (issued by {{issuer}}). Renew it now to avoid browser security warnings that will block your visitors.',
      shortText: '[Uptrue] SSL for {{target}} expires in {{daysUntilExpiry}} days. Renew now to avoid outages.',
      voiceScript:
        'This is an Uptrue alert. The SSL certificate for {{target}} expires in {{daysUntilExpiry}} days. Please renew it now to prevent visitors seeing security warnings.',
    },
    recoveryCopy: {
      subject: '✅ SSL certificate for {{monitorName}} renewed',
      headline: 'SSL certificate is valid',
      detail:
        'The SSL certificate for {{target}} has been renewed and is now valid (issued by {{issuer}}, expires in {{daysUntilExpiry}} days).',
      shortText: '[Uptrue] SSL for {{target}} is now valid. Expires in {{daysUntilExpiry}} days.',
      voiceScript:
        'This is an Uptrue recovery alert. The SSL certificate for {{target}} is now valid and expires in {{daysUntilExpiry}} days.',
    },
  },
  {
    type: 'dns',
    slug: 'dns-monitoring',
    name: 'DNS Records',
    emoji: '📡',
    tagline: 'Catch DNS hijacking and misconfiguration instantly',
    defaultInterval: 21600,
    minInterval: 3600,
    description:
      'Checks your DNS records at every interval and alerts you when they change unexpectedly. Detects hijacking, misconfiguration, and propagation issues.',
    whatItCatches: [
      'A, AAAA, CNAME, MX, or TXT record changes',
      'DNS resolution failures',
      'Unexpected nameserver changes',
      'Record disappearing entirely',
    ],
    whyItMatters:
      'A compromised DNS record can redirect your traffic to a malicious site without any visible sign — silent and catastrophic.',
    alertCopy: {
      subject: '[{{severity}}] DNS record change detected for {{monitorName}}',
      headline: 'DNS records changed unexpectedly',
      detail:
        'A DNS record change was detected for {{target}} at {{checkedAt}}. This may indicate a misconfiguration, unauthorised change, or DNS hijacking. Review your DNS records immediately.',
      shortText: '[Uptrue] DNS change detected for {{target}} at {{checkedAt}}. Check your DNS records now.',
      voiceScript:
        'This is an Uptrue alert. A DNS record change was detected for {{target}} at {{checkedAt}}. This could indicate DNS hijacking. Please review your DNS records immediately.',
    },
    recoveryCopy: {
      subject: '✅ DNS records for {{monitorName}} are stable',
      headline: 'DNS records restored to expected values',
      detail:
        'DNS records for {{target}} have returned to their expected values as of {{resolvedAt}}.',
      shortText: '[Uptrue] DNS records for {{target}} are now stable.',
      voiceScript:
        'This is an Uptrue recovery alert. DNS records for {{target}} have been restored to their expected values.',
    },
  },
  {
    type: 'keyword',
    slug: 'keyword-monitoring',
    name: 'Keyword Detection',
    emoji: '🔍',
    tagline: 'Alert when critical words appear or vanish from your page',
    defaultInterval: 60,
    minInterval: 30,
    description:
      'Scans your page content at every check interval and alerts you if required keywords disappear or forbidden keywords appear. Ideal for e-commerce, SaaS, and content monitoring.',
    whatItCatches: [
      'Critical text removed from the page (e.g. price, CTA, product name)',
      'Error messages appearing (e.g. "out of stock", "payment failed")',
      'Malware or spam injected into your content',
      'CMS publishing the wrong draft',
    ],
    whyItMatters:
      'Silent content changes — a broken checkout button, a missing price — can cost thousands in lost sales before anyone notices.',
    alertCopy: {
      subject: '[{{severity}}] Keyword issue detected on {{monitorName}}',
      headline: 'Page content changed unexpectedly',
      detail:
        'A keyword check on {{target}} failed at {{checkedAt}}. A required keyword is missing or a forbidden keyword has appeared. Review the page content immediately.',
      shortText: '[Uptrue] Keyword issue on {{target}} at {{checkedAt}}. Check page content now.',
      voiceScript:
        'This is an Uptrue alert. A keyword check on {{target}} failed at {{checkedAt}}. Please review the page content immediately.',
    },
    recoveryCopy: {
      subject: '✅ Keyword check passing for {{monitorName}}',
      headline: 'Page content is back to normal',
      detail:
        'The keyword check for {{target}} is passing again as of {{resolvedAt}}.',
      shortText: '[Uptrue] Keyword check for {{target}} is passing again.',
      voiceScript:
        'This is an Uptrue recovery alert. The keyword check for {{target}} is now passing.',
    },
  },
  {
    type: 'domain',
    slug: 'domain-expiry-monitoring',
    name: 'Domain Expiry',
    emoji: '📅',
    tagline: "Don't lose your domain because you forgot to renew it",
    defaultInterval: 86400,
    minInterval: 3600,
    description:
      'Monitors your domain registration expiry date and alerts you well in advance. Losing a domain means losing your website, email, and brand — often irreversibly.',
    whatItCatches: [
      'Domain expiring within 60, 30, or 14 days',
      'Domain already expired',
      'Auto-renewal failure',
      'Domain registrar transfer without notice',
    ],
    whyItMatters:
      'Expired domains are snapped up by squatters within seconds — recovering your own domain can cost thousands or prove impossible.',
    alertCopy: {
      subject: '[{{severity}}] Domain {{monitorName}} expires in {{daysUntilExpiry}} days',
      headline: 'Domain registration expiring soon',
      detail:
        '{{target}} expires in {{daysUntilExpiry}} days. Log into your registrar and renew now. If auto-renewal is enabled, verify your payment method is valid.',
      shortText: '[Uptrue] Domain {{target}} expires in {{daysUntilExpiry}} days. Renew now.',
      voiceScript:
        'This is an Uptrue alert. The domain {{target}} expires in {{daysUntilExpiry}} days. Please log into your registrar and renew it immediately.',
    },
    recoveryCopy: {
      subject: '✅ Domain {{monitorName}} has been renewed',
      headline: 'Domain registration is up to date',
      detail:
        '{{target}} is now renewed and valid for another {{daysUntilExpiry}} days.',
      shortText: '[Uptrue] Domain {{target}} renewed. Valid for {{daysUntilExpiry}} more days.',
      voiceScript:
        'This is an Uptrue recovery alert. The domain {{target}} has been renewed and is now valid.',
    },
  },
  {
    type: 'port',
    slug: 'port-monitoring',
    name: 'Port Check',
    emoji: '🔌',
    tagline: 'Know when a critical service port goes silent',
    defaultInterval: 60,
    minInterval: 30,
    description:
      'Connects to a specific port on your server and alerts you when it stops accepting connections. Essential for databases, mail servers, and custom services.',
    whatItCatches: [
      'Port closed or not accepting connections',
      'Firewall rule blocking access',
      'Service crashed but server still running',
      'Wrong service running on expected port',
    ],
    whyItMatters:
      'A website can appear up while a database port is closed — your app serves errors to every user until someone notices.',
    alertCopy: {
      subject: '[{{severity}}] Port check failed for {{monitorName}}',
      headline: 'Port not responding',
      detail:
        'Port check on {{target}} failed at {{checkedAt}}. The port is no longer accepting connections. Check your firewall rules and service status.',
      shortText: '[Uptrue] Port check failed for {{target}} at {{checkedAt}}.',
      voiceScript:
        'This is an Uptrue alert. The port check for {{target}} failed at {{checkedAt}}. Please check your server firewall and service status.',
    },
    recoveryCopy: {
      subject: '✅ Port check passing for {{monitorName}}',
      headline: 'Port is accepting connections again',
      detail:
        'Port on {{target}} is accepting connections again as of {{resolvedAt}}. Downtime was {{downDuration}}.',
      shortText: '[Uptrue] Port check for {{target}} is passing again.',
      voiceScript:
        'This is an Uptrue recovery alert. The port on {{target}} is accepting connections again.',
    },
  },
  {
    type: 'ping',
    slug: 'ping-monitoring',
    name: 'Ping / Reachability',
    emoji: '📶',
    tagline: 'Confirm your server is reachable at the network level',
    defaultInterval: 60,
    minInterval: 30,
    description:
      'Sends ICMP ping requests to your server and alerts you when it stops responding. The most basic uptime check — confirms your server is alive on the network.',
    whatItCatches: [
      'Server completely offline',
      'Network route failure',
      'Firewall blocking ICMP',
      'Server overloaded and not responding',
    ],
    whyItMatters:
      'A server can stop responding to pings while higher-level services appear okay — or vice versa. Layer-level visibility matters.',
    alertCopy: {
      subject: '[{{severity}}] {{monitorName}} is not responding to ping',
      headline: 'Server is unreachable',
      detail:
        '{{target}} stopped responding to ping at {{checkedAt}}. The server may be offline, overloaded, or the network route may be broken.',
      shortText: '[Uptrue] {{target}} not responding to ping at {{checkedAt}}.',
      voiceScript:
        'This is an Uptrue alert. {{target}} stopped responding to ping at {{checkedAt}}. Please check if the server is online.',
    },
    recoveryCopy: {
      subject: '✅ {{monitorName}} is responding again',
      headline: 'Server is reachable',
      detail:
        '{{target}} is responding to ping again as of {{resolvedAt}}. Downtime was {{downDuration}}.',
      shortText: '[Uptrue] {{target}} is responding to ping again.',
      voiceScript:
        'This is an Uptrue recovery alert. {{target}} is responding to ping again as of {{resolvedAt}}.',
    },
  },
  {
    type: 'api',
    slug: 'api-endpoint-monitoring',
    name: 'API Endpoint',
    emoji: '⚡',
    tagline: 'Monitor any API endpoint with custom headers and methods',
    defaultInterval: 60,
    minInterval: 30,
    description:
      'Makes authenticated HTTP requests to your API endpoints with custom headers and body. Validates response status and alerts you when the API fails or returns unexpected responses.',
    whatItCatches: [
      'API returning 4xx or 5xx errors',
      'Authentication or token expiry',
      'Unexpected response format',
      'API rate limit errors',
    ],
    whyItMatters:
      'A broken API silently breaks every integration, app, and customer-facing feature that depends on it.',
    alertCopy: {
      subject: '[{{severity}}] API endpoint down — {{monitorName}}',
      headline: 'API endpoint is not responding correctly',
      detail:
        'The API endpoint at {{target}} returned an unexpected response at {{checkedAt}}. Check your API logs and authentication tokens.',
      shortText: '[Uptrue] API endpoint {{target}} is down at {{checkedAt}}.',
      voiceScript:
        'This is an Uptrue alert. The API endpoint at {{target}} is not responding correctly as of {{checkedAt}}. Please check your API service.',
    },
    recoveryCopy: {
      subject: '✅ API endpoint recovered — {{monitorName}}',
      headline: 'API endpoint is responding normally',
      detail:
        '{{target}} is responding correctly again as of {{resolvedAt}}. Downtime was {{downDuration}}.',
      shortText: '[Uptrue] API endpoint {{target}} is back up.',
      voiceScript:
        'This is an Uptrue recovery alert. The API endpoint at {{target}} is responding normally again.',
    },
  },
  {
    type: 'heartbeat',
    slug: 'heartbeat-monitoring',
    name: 'Heartbeat Monitor',
    emoji: '💓',
    tagline: 'Know when your cron jobs and background tasks stop running',
    defaultInterval: 60,
    minInterval: 30,
    description:
      'Your server pings Uptrue at regular intervals. If the ping stops arriving, we alert you. Ideal for cron jobs, backup scripts, queue workers, and any scheduled task.',
    whatItCatches: [
      'Cron job not running on schedule',
      'Background worker crashed',
      'Backup script failed silently',
      'Queue processor stopped consuming',
    ],
    whyItMatters:
      'Silent task failures are the hardest bugs to catch — your logs show nothing, your site looks fine, but your data is corrupted or stale.',
    alertCopy: {
      subject: "[{{severity}}] Heartbeat missed — {{monitorName}} hasn't checked in",
      headline: 'Heartbeat signal missed',
      detail:
        '{{monitorName}} has not sent a heartbeat ping since {{checkedAt}}. Your scheduled task or cron job may have stopped running. Check your server and logs immediately.',
      shortText: "[Uptrue] {{monitorName}} heartbeat missed at {{checkedAt}}. Check your cron job.",
      voiceScript:
        'This is an Uptrue alert. {{monitorName}} has not sent a heartbeat since {{checkedAt}}. Your scheduled task may have stopped running. Please check your server logs.',
    },
    recoveryCopy: {
      subject: '✅ Heartbeat restored — {{monitorName}} is checking in again',
      headline: 'Heartbeat signal restored',
      detail:
        '{{monitorName}} sent a heartbeat ping at {{resolvedAt}}. The task is running again after {{downDuration}} of missed pings.',
      shortText: '[Uptrue] {{monitorName}} heartbeat restored at {{resolvedAt}}.',
      voiceScript:
        'This is an Uptrue recovery alert. {{monitorName}} has sent a heartbeat and is running again as of {{resolvedAt}}.',
    },
  },
  {
    type: 'competitor',
    slug: 'page-change-detection',
    name: 'Page Change Detection',
    emoji: '👁️',
    tagline: 'Get notified when any page changes — yours or a competitor\'s',
    defaultInterval: 3600,
    minInterval: 300,
    description:
      'Captures a snapshot of any webpage and alerts you when the content changes. Monitor your own pages for unexpected edits, or track competitor pricing and announcements.',
    whatItCatches: [
      'Competitor pricing or product changes',
      'Unauthorised edits to your own pages',
      'New content or announcements published',
      'Layout or CTA changes on key pages',
    ],
    whyItMatters:
      'Being first to know when a competitor changes their pricing or launches a product gives you a real competitive edge.',
    alertCopy: {
      subject: '[{{severity}}] Page change detected — {{monitorName}}',
      headline: 'Page content has changed',
      detail:
        'A change was detected on {{target}} at {{checkedAt}}. Review the page to see what has changed.',
      shortText: '[Uptrue] Page change detected on {{target}} at {{checkedAt}}.',
      voiceScript:
        'This is an Uptrue alert. A page change was detected on {{target}} at {{checkedAt}}. Please review the page.',
    },
    recoveryCopy: {
      subject: '✅ {{monitorName}} — page is back to baseline',
      headline: 'Page has returned to expected content',
      detail:
        '{{target}} matches the baseline snapshot again as of {{resolvedAt}}.',
      shortText: '[Uptrue] {{target}} is back to baseline content.',
      voiceScript:
        'This is an Uptrue recovery alert. {{target}} has returned to its expected content.',
    },
  },
  {
    type: 'security-headers',
    slug: 'security-headers-monitoring',
    name: 'Security Headers',
    emoji: '🛡️',
    tagline: 'Catch missing HTTP security headers before hackers do',
    defaultInterval: 21600,
    minInterval: 3600,
    description:
      'Checks your HTTP response headers for critical security settings like CSP, HSTS, X-Frame-Options, and more. Missing headers leave your site vulnerable to clickjacking and XSS attacks.',
    whatItCatches: [
      'Missing Content-Security-Policy header',
      'Missing Strict-Transport-Security (HSTS)',
      'Missing X-Frame-Options (clickjacking)',
      'Missing X-Content-Type-Options',
      'Missing Referrer-Policy or Permissions-Policy',
    ],
    whyItMatters:
      'Missing security headers are low-effort, high-impact vulnerabilities — attackers look for them specifically because they take seconds to exploit.',
    alertCopy: {
      subject: '[{{severity}}] Security headers issue on {{monitorName}}',
      headline: 'HTTP security headers are missing or misconfigured',
      detail:
        '{{target}} is missing critical security headers as of {{checkedAt}}: {{missingHeaders}}. These gaps leave your site exposed to clickjacking, XSS, and data injection attacks.',
      shortText: '[Uptrue] Security headers issue on {{target}}. Missing: {{missingHeaders}}.',
      voiceScript:
        'This is an Uptrue security alert. {{target}} is missing critical HTTP security headers including {{missingHeaders}}. Please review your server configuration.',
    },
    recoveryCopy: {
      subject: '✅ Security headers restored — {{monitorName}}',
      headline: 'Security headers are correctly configured',
      detail:
        'All required security headers are now present on {{target}} as of {{resolvedAt}}.',
      shortText: '[Uptrue] Security headers for {{target}} are now correctly configured.',
      voiceScript:
        'This is an Uptrue recovery alert. Security headers for {{target}} are now correctly configured.',
    },
  },
  {
    type: 'response-time',
    slug: 'response-time-monitoring',
    name: 'Response Time Threshold',
    emoji: '⏱️',
    tagline: 'Alert when your site gets too slow to convert',
    defaultInterval: 60,
    minInterval: 30,
    description:
      'Measures your page response time at every check and alerts you when it exceeds your defined threshold. Slow pages hurt SEO rankings and conversion rates.',
    whatItCatches: [
      'Response time exceeding your threshold',
      'Server-side performance degradation',
      'Database slow queries impacting load time',
      'Third-party script causing delays',
    ],
    whyItMatters:
      'A 1-second delay in page load time reduces conversions by up to 7% — performance issues that go undetected for hours cost real revenue.',
    alertCopy: {
      subject: '[{{severity}}] Slow response detected — {{monitorName}}',
      headline: 'Page response time exceeds threshold',
      detail:
        '{{target}} responded in {{responseTime}} at {{checkedAt}}, exceeding your threshold of {{threshold}}. Investigate server load, database performance, and third-party scripts.',
      shortText: '[Uptrue] {{target}} is slow: {{responseTime}} (threshold: {{threshold}}).',
      voiceScript:
        'This is an Uptrue performance alert. {{target}} responded in {{responseTime}}, exceeding your threshold of {{threshold}}. Please investigate your server performance.',
    },
    recoveryCopy: {
      subject: '✅ Response time normalised — {{monitorName}}',
      headline: 'Page response time is back within threshold',
      detail:
        '{{target}} is responding within your threshold again as of {{resolvedAt}}. Current response time: {{responseTime}}.',
      shortText: '[Uptrue] {{target}} response time is back to normal: {{responseTime}}.',
      voiceScript:
        'This is an Uptrue recovery alert. {{target}} response time is back within your threshold at {{responseTime}}.',
    },
  },
  {
    type: 'robots-txt',
    slug: 'robots-txt-monitoring',
    name: 'robots.txt Change',
    emoji: '🤖',
    tagline: 'Catch accidental robots.txt changes before Google does',
    defaultInterval: 3600,
    minInterval: 300,
    description:
      'Monitors your robots.txt file and alerts you the moment it changes. An accidentally blocked site can disappear from search results within days.',
    whatItCatches: [
      'Disallow rule accidentally added for "/" (blocking all crawlers)',
      'New rules blocking specific bots (Googlebot, etc.)',
      'File removed or returning 404',
      'Malicious redirect injected into robots.txt',
    ],
    whyItMatters:
      'A single "Disallow: /" in robots.txt can wipe your entire site from Google within days — this mistake is shockingly common after deployments.',
    alertCopy: {
      subject: '[{{severity}}] robots.txt changed on {{monitorName}}',
      headline: 'robots.txt has been modified',
      detail:
        'The robots.txt file at {{target}} changed at {{checkedAt}} ({{changeType}}). If you did not authorise this change, review it immediately — a misconfigured robots.txt can remove your site from search engines.',
      shortText: '[Uptrue] robots.txt changed on {{target}} at {{checkedAt}}. Check for crawl blocks.',
      voiceScript:
        'This is an Uptrue alert. The robots dot txt file for {{target}} changed at {{checkedAt}}. Please review it to ensure search engines are not blocked.',
    },
    recoveryCopy: {
      subject: '✅ robots.txt restored — {{monitorName}}',
      headline: 'robots.txt is back to expected content',
      detail:
        'robots.txt at {{target}} has returned to its expected content as of {{resolvedAt}}.',
      shortText: '[Uptrue] robots.txt for {{target}} is back to normal.',
      voiceScript:
        'This is an Uptrue recovery alert. The robots dot txt file for {{target}} has been restored.',
    },
  },
  {
    type: 'ip-change',
    slug: 'ip-change-monitoring',
    name: 'IP Address Change',
    emoji: '📍',
    tagline: 'Detect unexpected server migrations and DNS hijacking',
    defaultInterval: 21600,
    minInterval: 3600,
    description:
      'Tracks the IP address your domain resolves to and alerts you when it changes. Catches unauthorised server migrations, DNS hijacking, and CDN misconfigurations.',
    whatItCatches: [
      'Domain resolving to a new IP without your knowledge',
      'DNS hijacking redirecting traffic',
      'Unexpected CDN or proxy changes',
      'Server migration not reflected in monitoring config',
    ],
    whyItMatters:
      'An IP change you did not make is a red flag for DNS hijacking — attackers can intercept all your traffic silently.',
    alertCopy: {
      subject: '[{{severity}}] IP address changed — {{monitorName}}',
      headline: 'Domain is resolving to a new IP address',
      detail:
        '{{target}} now resolves to {{currentIp}} (previously {{previousIp}}) as of {{checkedAt}}. If you did not make this change, investigate for DNS hijacking immediately.',
      shortText: '[Uptrue] IP change for {{target}}: now {{currentIp}} (was {{previousIp}}).',
      voiceScript:
        'This is an Uptrue security alert. {{target}} is now resolving to a new IP address. If you did not authorise this change, please investigate for DNS hijacking immediately.',
    },
    recoveryCopy: {
      subject: '✅ IP address stable — {{monitorName}}',
      headline: 'Domain IP address is back to expected value',
      detail:
        '{{target}} is resolving to the expected IP address again as of {{resolvedAt}}.',
      shortText: '[Uptrue] IP for {{target}} is back to expected value.',
      voiceScript:
        'This is an Uptrue recovery alert. {{target}} is now resolving to the expected IP address.',
    },
  },
  {
    type: 'mx-health',
    slug: 'mx-health-monitoring',
    name: 'MX Health',
    emoji: '📬',
    tagline: 'Ensure your email infrastructure never silently breaks',
    defaultInterval: 21600,
    minInterval: 3600,
    description:
      'Checks your MX records, mail server connectivity, and SPF/DMARC alignment to ensure email delivery is working correctly. Silent email failures cost leads and revenue.',
    whatItCatches: [
      'MX record missing or pointing to wrong server',
      'Mail server not accepting connections',
      'SPF/DMARC misconfiguration causing delivery failure',
      'MX record priority conflicts',
    ],
    whyItMatters:
      'Broken email infrastructure means missed customer enquiries, failed password resets, and lost sales — often for days before anyone realises.',
    alertCopy: {
      subject: '[{{severity}}] MX health issue detected — {{monitorName}}',
      headline: 'Email infrastructure problem detected',
      detail:
        'MX health check for {{target}} detected issues at {{checkedAt}}: {{mxIssues}}. Email delivery may be affected. Review your MX records and mail server configuration.',
      shortText: '[Uptrue] MX issue on {{target}}: {{mxIssues}}. Email may not be delivering.',
      voiceScript:
        'This is an Uptrue alert. An email infrastructure problem was detected for {{target}} at {{checkedAt}}. Email delivery may be failing. Please check your MX records.',
    },
    recoveryCopy: {
      subject: '✅ MX health restored — {{monitorName}}',
      headline: 'Email infrastructure is healthy',
      detail:
        'MX health for {{target}} is back to normal as of {{resolvedAt}}.',
      shortText: '[Uptrue] MX health for {{target}} is back to normal.',
      voiceScript:
        'This is an Uptrue recovery alert. Email infrastructure for {{target}} is healthy again.',
    },
  },
  {
    type: 'whois-change',
    slug: 'whois-registrar-monitoring',
    name: 'WHOIS Registrar Change',
    emoji: '🏛️',
    tagline: 'Know immediately if your domain ownership changes',
    defaultInterval: 86400,
    minInterval: 3600,
    description:
      'Monitors your WHOIS record and alerts you if the registrar, registrant, or ownership details change. Domain theft is real — detect it before it is too late.',
    whatItCatches: [
      'Registrar changed without your consent',
      'Registrant name or organisation changed',
      'Domain transferred to another account',
      'WHOIS privacy shield removed',
    ],
    whyItMatters:
      'Domain theft is catastrophic and hard to reverse — detecting it within minutes of the WHOIS change gives you the best chance of recovery.',
    alertCopy: {
      subject: '[{{severity}}] WHOIS record changed — {{monitorName}}',
      headline: 'Domain registrar or ownership details changed',
      detail:
        'WHOIS details for {{target}} changed at {{checkedAt}}. New registrar: {{registrar}}. If you did not authorise this change, contact your registrar immediately — your domain may have been transferred without consent.',
      shortText: '[Uptrue] WHOIS change on {{target}}. New registrar: {{registrar}}. Verify now.',
      voiceScript:
        'This is an urgent Uptrue alert. WHOIS ownership details for {{target}} have changed. If you did not authorise this, contact your registrar immediately.',
    },
    recoveryCopy: {
      subject: '✅ WHOIS record stabilised — {{monitorName}}',
      headline: 'WHOIS record is back to expected values',
      detail:
        'WHOIS details for {{target}} have returned to expected values as of {{resolvedAt}}.',
      shortText: '[Uptrue] WHOIS for {{target}} is back to expected values.',
      voiceScript:
        'This is an Uptrue recovery alert. WHOIS details for {{target}} are back to their expected values.',
    },
  },
  {
    type: 'sitemap',
    slug: 'sitemap-monitoring',
    name: 'Sitemap Validity',
    emoji: '🗺️',
    tagline: 'Ensure Google can always find and crawl your pages',
    defaultInterval: 3600,
    minInterval: 300,
    description:
      'Fetches and validates your XML sitemap, checking for malformed XML, missing pages, and unreachable URLs. A broken sitemap silently hurts your SEO crawl coverage.',
    whatItCatches: [
      'Sitemap returning 404 or 500',
      'Malformed XML that search engines cannot parse',
      'Pages listed in sitemap returning errors',
      'Sitemap not updated after content changes',
    ],
    whyItMatters:
      'A broken sitemap means search engines discover your pages more slowly or miss them entirely — directly impacting rankings and organic traffic.',
    alertCopy: {
      subject: '[{{severity}}] Sitemap issue detected — {{monitorName}}',
      headline: 'XML sitemap is invalid or unreachable',
      detail:
        'A sitemap issue was detected on {{target}} at {{checkedAt}} ({{changeType}}). Search engines may not be able to crawl your pages correctly. Review and fix the sitemap immediately.',
      shortText: '[Uptrue] Sitemap issue on {{target}}: {{changeType}}.',
      voiceScript:
        'This is an Uptrue SEO alert. Your XML sitemap at {{target}} has an issue. Search engine crawling may be affected. Please review your sitemap.',
    },
    recoveryCopy: {
      subject: '✅ Sitemap is valid — {{monitorName}}',
      headline: 'Sitemap is valid and accessible',
      detail:
        'The sitemap at {{target}} is valid and accessible again as of {{resolvedAt}}.',
      shortText: '[Uptrue] Sitemap for {{target}} is valid again.',
      voiceScript:
        'This is an Uptrue recovery alert. The sitemap for {{target}} is valid and accessible.',
    },
  },
  {
    type: 'redirect-chain',
    slug: 'redirect-chain-monitoring',
    name: 'Redirect Chain',
    emoji: '🔗',
    tagline: 'Detect redirect loops and excessive hops hurting your SEO',
    defaultInterval: 3600,
    minInterval: 300,
    description:
      'Follows the full redirect chain from your URL and alerts you if it changes, creates a loop, or adds too many hops. Long redirect chains slow your site and dilute PageRank.',
    whatItCatches: [
      'Redirect loop (301 cycling forever)',
      'Excessive redirect hops (more than 3)',
      'Final destination URL changed unexpectedly',
      'HTTP to HTTPS redirect broken',
    ],
    whyItMatters:
      'Every redirect hop adds latency, and Google limits how many it will follow — broken redirects can make pages disappear from search results entirely.',
    alertCopy: {
      subject: '[{{severity}}] Redirect chain issue — {{monitorName}}',
      headline: 'Redirect chain has changed or has too many hops',
      detail:
        'The redirect chain for {{target}} changed at {{checkedAt}}. Hops: {{hopCount}}, final destination: {{finalUrl}}. Excessive or broken redirects hurt performance and SEO.',
      shortText: '[Uptrue] Redirect issue on {{target}}: {{hopCount}} hops, ending at {{finalUrl}}.',
      voiceScript:
        'This is an Uptrue alert. The redirect chain for {{target}} has changed. There are now {{hopCount}} redirect hops ending at {{finalUrl}}. Please review your redirect configuration.',
    },
    recoveryCopy: {
      subject: '✅ Redirect chain normalised — {{monitorName}}',
      headline: 'Redirect chain is back to expected configuration',
      detail:
        'The redirect chain for {{target}} is back to expected values as of {{resolvedAt}}.',
      shortText: '[Uptrue] Redirect chain for {{target}} is back to normal.',
      voiceScript:
        'This is an Uptrue recovery alert. The redirect chain for {{target}} is back to normal.',
    },
  },
  {
    type: 'spf-dmarc',
    slug: 'spf-dmarc-monitoring',
    name: 'SPF / DMARC Validity',
    emoji: '✉️',
    tagline: 'Stop email spoofing before it damages your brand',
    defaultInterval: 21600,
    minInterval: 3600,
    description:
      'Validates your SPF and DMARC DNS records and alerts you when they become invalid, are removed, or are misconfigured. Without these, anyone can send emails pretending to be you.',
    whatItCatches: [
      'SPF record missing or invalid syntax',
      'DMARC record missing or set to p=none with no monitoring',
      'SPF record exceeding 10 DNS lookup limit',
      'DMARC policy too permissive (no enforcement)',
    ],
    whyItMatters:
      'Without valid SPF and DMARC, scammers can impersonate your domain in phishing emails — damaging your brand reputation with customers and partners.',
    alertCopy: {
      subject: '[{{severity}}] SPF/DMARC issue — {{monitorName}}',
      headline: 'Email authentication records are invalid or missing',
      detail:
        'SPF/DMARC check for {{target}} failed at {{checkedAt}}. SPF status: {{spfStatus}}. DMARC status: {{dmarcStatus}}. Without these records, your domain can be used for phishing.',
      shortText: '[Uptrue] SPF/DMARC issue on {{target}}: SPF {{spfStatus}}, DMARC {{dmarcStatus}}.',
      voiceScript:
        'This is an Uptrue security alert. Email authentication records for {{target}} are invalid. SPF status is {{spfStatus}} and DMARC status is {{dmarcStatus}}. Your domain may be vulnerable to spoofing.',
    },
    recoveryCopy: {
      subject: '✅ SPF/DMARC valid — {{monitorName}}',
      headline: 'Email authentication records are correctly configured',
      detail:
        'SPF and DMARC records for {{target}} are valid as of {{resolvedAt}}.',
      shortText: '[Uptrue] SPF/DMARC for {{target}} are now valid.',
      voiceScript:
        'This is an Uptrue recovery alert. SPF and DMARC records for {{target}} are now correctly configured.',
    },
  },
  {
    type: 'blacklist',
    slug: 'blacklist-monitoring',
    name: 'Blacklist Check',
    emoji: '🚫',
    tagline: 'Know immediately if your IP or domain is blacklisted',
    defaultInterval: 86400,
    minInterval: 3600,
    description:
      'Checks your domain and server IP against major email and web blacklists (DNSBL, SURBL, Spamhaus, and more). Being blacklisted silently destroys email deliverability.',
    whatItCatches: [
      'Domain or IP listed on Spamhaus, SORBS, or Barracuda',
      'Email blacklisting causing delivery failures',
      'Web reputation blacklist affecting browser trust',
      "Previous server owner's blacklist inherited on new IP",
    ],
    whyItMatters:
      'A blacklisted IP means your emails go to spam for every recipient — you lose sales, customer communications, and brand credibility silently.',
    alertCopy: {
      subject: '[{{severity}}] Blacklist alert — {{monitorName}} is listed',
      headline: 'Domain or IP is on a blacklist',
      detail:
        '{{target}} was found on the following blacklists at {{checkedAt}}: {{listedOn}}. This will cause email delivery failures and may trigger browser security warnings. Request removal immediately.',
      shortText: '[Uptrue] {{target}} blacklisted on: {{listedOn}}. Request removal now.',
      voiceScript:
        'This is an urgent Uptrue alert. {{target}} has been found on a blacklist including {{listedOn}}. Email delivery may be failing. Please request removal immediately.',
    },
    recoveryCopy: {
      subject: '✅ {{monitorName}} removed from blacklists',
      headline: 'Domain and IP are clear of all blacklists',
      detail:
        '{{target}} is no longer listed on any monitored blacklists as of {{resolvedAt}}.',
      shortText: '[Uptrue] {{target}} is no longer blacklisted.',
      voiceScript:
        'This is an Uptrue recovery alert. {{target}} has been removed from all monitored blacklists.',
    },
  },
  {
    type: 'page-size',
    slug: 'page-size-monitoring',
    name: 'Page Size',
    emoji: '📦',
    tagline: 'Catch bloated page sizes before they hurt Core Web Vitals',
    defaultInterval: 3600,
    minInterval: 300,
    description:
      'Monitors the total transfer size of your page and alerts you when it grows beyond your threshold. Large pages load slowly on mobile, hurting user experience and SEO.',
    whatItCatches: [
      'Uncompressed images accidentally deployed',
      'Third-party script bundle growing unexpectedly',
      'CMS media bloat',
      'Gzip/Brotli compression disabled',
    ],
    whyItMatters:
      'Page size directly impacts load time, Core Web Vitals scores, and mobile user experience — and it can balloon silently after a deployment.',
    alertCopy: {
      subject: '[{{severity}}] Page size alert — {{monitorName}}',
      headline: 'Page size exceeds your threshold',
      detail:
        '{{target}} returned a page size of {{pageSize}} at {{checkedAt}}, exceeding your configured threshold. Large pages slow load times and hurt Core Web Vitals scores.',
      shortText: '[Uptrue] {{target}} page size is {{pageSize}} — above your threshold.',
      voiceScript:
        'This is an Uptrue performance alert. The page size for {{target}} is {{pageSize}}, which exceeds your threshold. Please investigate what caused the page to grow.',
    },
    recoveryCopy: {
      subject: '✅ Page size normalised — {{monitorName}}',
      headline: 'Page size is back within threshold',
      detail:
        '{{target}} page size is back within your threshold as of {{resolvedAt}}. Current size: {{pageSize}}.',
      shortText: '[Uptrue] {{target}} page size is back to normal: {{pageSize}}.',
      voiceScript:
        'This is an Uptrue recovery alert. The page size for {{target}} is back within your threshold.',
    },
  },
  {
    type: 'cookie-consent',
    slug: 'cookie-consent-monitoring',
    name: 'Cookie Consent Presence',
    emoji: '🍪',
    tagline: 'Ensure your cookie banner never disappears and risks GDPR fines',
    defaultInterval: 3600,
    minInterval: 300,
    description:
      'Checks that your cookie consent banner is present and functional on every page load. A missing cookie banner is a GDPR compliance failure.',
    whatItCatches: [
      'Cookie consent banner removed after deployment',
      'Consent script failing to load',
      'Banner blocked by ad blocker or CSP policy',
      'Banner disappearing after A/B test change',
    ],
    whyItMatters:
      'GDPR fines for collecting cookies without consent can reach 4% of global annual revenue — a missing banner is not a minor oversight.',
    alertCopy: {
      subject: '[{{severity}}] Cookie consent banner missing — {{monitorName}}',
      headline: 'Cookie consent banner not detected',
      detail:
        'No cookie consent banner was detected on {{target}} at {{checkedAt}}. This may indicate a GDPR compliance failure. Check your consent management platform and recent deployments.',
      shortText: '[Uptrue] Cookie consent missing on {{target}} at {{checkedAt}}. GDPR risk.',
      voiceScript:
        'This is an Uptrue compliance alert. No cookie consent banner was detected on {{target}}. This is a potential GDPR compliance failure. Please investigate immediately.',
    },
    recoveryCopy: {
      subject: '✅ Cookie consent banner restored — {{monitorName}}',
      headline: 'Cookie consent banner is present',
      detail:
        'Cookie consent banner was detected on {{target}} again as of {{resolvedAt}}.',
      shortText: '[Uptrue] Cookie consent banner is back on {{target}}.',
      voiceScript:
        'This is an Uptrue recovery alert. The cookie consent banner for {{target}} is present and functioning again.',
    },
  },
  {
    type: 'nameserver-change',
    slug: 'nameserver-monitoring',
    name: 'Nameserver Change',
    emoji: '🌐',
    tagline: 'Detect unauthorised nameserver changes instantly',
    defaultInterval: 21600,
    minInterval: 3600,
    description:
      'Monitors the authoritative nameservers for your domain and alerts you when they change. Nameserver hijacking gives attackers full control over all your DNS records.',
    whatItCatches: [
      'Nameservers changed without your authorisation',
      'Domain transferred to a different DNS provider',
      'Registrar compromise leading to nameserver hijack',
      'Accidental nameserver override during migration',
    ],
    whyItMatters:
      'A nameserver change hands full control of your domain DNS to whoever controls the new nameservers — the most severe form of domain-level attack.',
    alertCopy: {
      subject: '[{{severity}}] Nameserver change detected — {{monitorName}}',
      headline: 'Authoritative nameservers have changed',
      detail:
        'Nameservers for {{target}} changed at {{checkedAt}}. If you did not authorise this, your domain may have been hijacked. Contact your registrar and lock your domain immediately.',
      shortText: '[Uptrue] Nameserver change on {{target}} at {{checkedAt}}. Verify now.',
      voiceScript:
        'This is an urgent Uptrue security alert. Nameservers for {{target}} have changed. If you did not authorise this, contact your registrar immediately as your domain may be compromised.',
    },
    recoveryCopy: {
      subject: '✅ Nameservers stable — {{monitorName}}',
      headline: 'Nameservers are back to expected values',
      detail:
        'Nameservers for {{target}} have returned to expected values as of {{resolvedAt}}.',
      shortText: '[Uptrue] Nameservers for {{target}} are back to expected values.',
      voiceScript:
        'This is an Uptrue recovery alert. Nameservers for {{target}} are back to their expected values.',
    },
  },
  {
    type: 'wordpress',
    slug: 'wordpress-site-monitor',
    name: 'Uptrue WordPress Monitor',
    emoji: '__wp__',
    tagline: 'Deep WordPress security and health monitoring via a lightweight plugin',
    defaultInterval: 7200,
    minInterval: 3600,
    description:
      'Installs a lightweight plugin on your WordPress site that monitors security threats, software health, content changes, and performance — then sends findings to Uptrue for real-time alerts and AI-powered fix suggestions.',
    whatItCatches: [
      'PHP and executable files injected into /uploads/',
      'New admin users created without your knowledge',
      'User role escalation attacks',
      'Outdated plugins and themes with known vulnerabilities',
      'Modified core files (wp-config.php, .htaccess, functions.php)',
      'Spam pages created in foreign languages',
      'WP debug mode left on in production',
    ],
    whyItMatters:
      'WordPress powers 43% of the web and is the most targeted CMS — without deep monitoring, attacks go undetected for days while your site serves malware to visitors.',
    alertCopy: {
      subject: '[{{severity}}] Security issue detected on {{monitorName}}',
      headline: 'WordPress security issue detected',
      detail:
        'Uptrue detected a security issue on {{target}} at {{checkedAt}}. Check your WordPress Monitor dashboard for details and AI-powered fix instructions.',
      shortText: '[Uptrue] Security issue on {{monitorName}}. Check your dashboard.',
      voiceScript:
        'This is an Uptrue alert. A security issue has been detected on your WordPress site {{monitorName}}. Please check your Uptrue dashboard immediately.',
    },
    recoveryCopy: {
      subject: '[Resolved] {{monitorName}} WordPress issue resolved',
      headline: 'WordPress issue resolved',
      detail:
        'The previously detected issue on {{target}} has been resolved as of {{resolvedAt}}.',
      shortText: '[Uptrue] {{monitorName}} WordPress issue resolved.',
      voiceScript:
        'This is an Uptrue alert. The WordPress issue on {{monitorName}} has been resolved.',
    },
  },
]

// Lookup helpers

export function getMonitorTypeBySlug(slug: string): MonitorTypeDefinition | undefined {
  return MONITOR_TYPES.find(m => m.slug === slug)
}

export function getMonitorTypeByType(type: string): MonitorTypeDefinition | undefined {
  return MONITOR_TYPES.find(m => m.type === type)
}

export function getAllSlugs(): string[] {
  return MONITOR_TYPES.map(m => m.slug)
}

// 8 curated types for homepage feature cards (by `type` DB value)
export const HOMEPAGE_FEATURE_TYPES: string[] = [
  'http',
  'ssl',
  'security-headers',
  'keyword',
  'domain',
  'blacklist',
  'api',
  'heartbeat',
]

export function getHomepageFeatureTypes(): MonitorTypeDefinition[] {
  return HOMEPAGE_FEATURE_TYPES
    .map(type => getMonitorTypeByType(type))
    .filter((m): m is MonitorTypeDefinition => m !== undefined)
}
