'use client'

import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
}

interface MonitorHelp {
  emoji: string
  name: string
  what: string
  targetLabel: string
  targetHint: string
  faqs: FaqItem[]
}

const helpData: Record<string, MonitorHelp> = {
  http: {
    emoji: '🌐',
    name: 'HTTP / HTTPS Uptime',
    what: 'Checks if your website is reachable and returning a valid response. Upnotify does a double-confirmation before alerting to eliminate false positives.',
    targetLabel: 'Enter a full URL',
    targetHint: 'e.g. https://yoursite.com or https://yoursite.com/checkout',
    faqs: [
      { q: 'What counts as "down"?', a: 'A 5xx server error or a connection timeout on two consecutive checks within 5 seconds of each other.' },
      { q: 'Do you follow redirects?', a: 'Yes. Upnotify follows HTTP redirects and reports the final destination status code.' },
      { q: 'How often does it check?', a: 'Depending on your plan — every 30 seconds to 10 minutes. You set the interval when creating the monitor.' },
    ],
  },
  ssl: {
    emoji: '🔒',
    name: 'SSL Certificate',
    what: 'Checks your certificate\'s expiry date and chain validity. Alerts at 30 days then again at 7 days before expiry.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com — no https:// needed',
    faqs: [
      { q: 'What if auto-renewal is on?', a: 'Auto-renewal can fail silently. Monitoring gives you a safety net independent of your registrar.' },
      { q: 'Does it detect chain issues?', a: 'Yes — missing intermediate certificates, self-signed certs, and expired chains are all flagged.' },
      { q: 'How far in advance do you warn?', a: '30 days (warning / degraded) and 7 days (critical / down).' },
    ],
  },
  dns: {
    emoji: '📡',
    name: 'DNS Record Monitor',
    what: 'Watches your A, MX, NS, and TXT records and alerts the moment any record changes from the baseline snapshot.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com — no protocol needed',
    faqs: [
      { q: 'Which record types do you watch?', a: 'A (IPv4), MX (mail), NS (nameservers), and TXT (SPF, DMARC, verification tokens).' },
      { q: 'Will I get an alert for my own DNS changes?', a: 'Yes — pause or delete the monitor before making planned DNS changes to avoid noise.' },
      { q: 'Is the first run always "up"?', a: 'Yes. The first check sets the baseline. Only subsequent changes trigger an alert.' },
    ],
  },
  keyword: {
    emoji: '🔍',
    name: 'Keyword Detection',
    what: 'Fetches your page and checks for the presence or absence of specific text. Catch broken checkouts, maintenance pages, and missing compliance text.',
    targetLabel: 'Enter the full page URL',
    targetHint: 'e.g. https://yoursite.com/checkout — not just the domain',
    faqs: [
      { q: 'What\'s the difference between positive and negative keywords?', a: 'Positive = must exist (alert if missing). Negative = must not exist (alert if found, e.g. "error", "maintenance").' },
      { q: 'Is matching case-sensitive?', a: 'No — keyword matching is always case-insensitive.' },
      { q: 'Can I check API JSON responses?', a: 'Yes — keyword search runs on the raw response body, so JSON strings work.' },
    ],
  },
  domain: {
    emoji: '📅',
    name: 'Domain Expiry',
    what: 'Tracks when your domain registration expires and alerts you weeks before it lapses. Auto-renewal can fail silently.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com — bare domain only',
    faqs: [
      { q: 'How far in advance do you alert?', a: '30 days and 7 days before expiry.' },
      { q: 'Does it work for all TLDs?', a: 'Most common TLDs via WHOIS. Some country-code TLDs have restricted WHOIS data.' },
    ],
  },
  port: {
    emoji: '🔌',
    name: 'Port Check',
    what: 'Attempts a TCP connection to your host on the specified port. Essential for databases, SMTP servers, Redis, and custom TCP services.',
    targetLabel: 'Enter host and port',
    targetHint: 'e.g. db.yoursite.com — then enter port number below',
    faqs: [
      { q: 'Which ports can I check?', a: 'Any TCP port — common ones: 22 (SSH), 25/587 (SMTP), 3306 (MySQL), 5432 (Postgres), 6379 (Redis).' },
      { q: 'Does it verify the service, not just the port?', a: 'It checks TCP connectivity only — not the application protocol. Use API monitoring for deeper checks.' },
    ],
  },
  ping: {
    emoji: '📶',
    name: 'Ping / Reachability',
    what: 'Sends ICMP echo requests to verify a host is alive on the network. The fastest check — good for servers and network devices.',
    targetLabel: 'Enter IP or hostname',
    targetHint: 'e.g. 203.0.113.5 or server.yoursite.com',
    faqs: [
      { q: 'What if the server blocks ICMP?', a: 'Many firewalls block ICMP. Use Port or HTTP monitoring instead — TCP is rarely blocked.' },
      { q: 'Can I monitor internal IPs?', a: 'No — Upnotify monitors external IPs only to prevent security risks.' },
    ],
  },
  api: {
    emoji: '⚡',
    name: 'API Endpoint',
    what: 'Tests your REST API with custom assertions on status code, response body content, and response time. Catches semantic failures that status-only checks miss.',
    targetLabel: 'Enter the full API endpoint URL',
    targetHint: 'e.g. https://api.yoursite.com/v1/health',
    faqs: [
      { q: 'Can I send POST requests?', a: 'Yes — select POST as the method and add a JSON body if needed.' },
      { q: 'Can I monitor authenticated APIs?', a: 'Yes — add an Authorization header with your Bearer token or API key in the Headers field.' },
      { q: 'What\'s a body assertion?', a: 'A string that must appear in the response body. Use it to verify the API returned useful data, not just a 200 OK.' },
    ],
  },
  heartbeat: {
    emoji: '💓',
    name: 'Heartbeat Monitor',
    what: 'Flips the model — your cron job or script pings Upnotify on success. If we stop hearing from it within the expected window, we alert you. Perfect for silent background task failures.',
    targetLabel: 'No target needed',
    targetHint: 'Give the monitor a name (e.g. "Daily Backup Job")',
    faqs: [
      { q: 'How do I send a heartbeat?', a: 'After creating the monitor, you\'ll get a unique URL. Add curl -s YOUR_URL to the end of your cron job.' },
      { q: 'What\'s the grace period?', a: '2x your expected ping interval. If your job runs every 5 min, we alert after 10 min of silence.' },
      { q: 'What can I monitor with this?', a: 'Backup scripts, invoice generators, queue workers, log rotation, data sync jobs — anything that should run on a schedule.' },
    ],
  },
  competitor: {
    emoji: '👁️',
    name: 'Page Change Detection',
    what: 'Fetches a page and alerts you when its content changes. Track competitor pricing, partner terms, or regulatory pages.',
    targetLabel: 'Enter the page URL to watch',
    targetHint: 'e.g. https://competitor.com/pricing',
    faqs: [
      { q: 'Does it detect what changed?', a: 'It detects that the page changed. You\'ll need to manually compare — section-level diffing is on our roadmap.' },
      { q: 'Does it work on JavaScript-rendered pages?', a: 'It checks the raw HTTP response. JS-rendered content that\'s injected after load won\'t be captured.' },
    ],
  },
  'security-headers': {
    emoji: '🛡️',
    name: 'Security Headers',
    what: 'Checks your HTTP response headers for six key security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.',
    targetLabel: 'Enter your site URL',
    targetHint: 'e.g. https://yoursite.com',
    faqs: [
      { q: 'Why would headers go missing?', a: 'CDN config changes, framework upgrades, or reverse proxy changes can silently strip security headers.' },
      { q: 'What happens if some are missing?', a: 'Status goes degraded (some missing) or down (all missing). You\'ll see which headers are absent.' },
    ],
  },
  'response-time': {
    emoji: '⏱️',
    name: 'Response Time Threshold',
    what: 'Measures server response time (TTFB) and alerts when it exceeds your warn or critical thresholds. Separates slow from down.',
    targetLabel: 'Enter your site URL',
    targetHint: 'e.g. https://yoursite.com',
    faqs: [
      { q: 'What thresholds should I use?', a: 'A common setup: warn at 1,500ms, critical at 3,000ms. Adjust to your users\' expectations.' },
      { q: 'Does this measure full page load time?', a: 'No — it measures time to first byte (TTFB) from our server to yours, not client-side render time.' },
    ],
  },
  'robots-txt': {
    emoji: '🤖',
    name: 'robots.txt Change',
    what: 'Fetches /robots.txt on each check and alerts when the content changes. An accidental Disallow: / can de-index your whole site overnight.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com — we\'ll fetch /robots.txt automatically',
    faqs: [
      { q: 'Is the first check always "up"?', a: 'Yes — the first run sets the baseline. Only changes from that point trigger alerts.' },
      { q: 'What if my robots.txt changes intentionally?', a: 'You\'ll get one alert on the change. After that, the new content becomes the new baseline on the next check.' },
    ],
  },
  'ip-change': {
    emoji: '🗺️',
    name: 'IP Address Change',
    what: 'Resolves your domain\'s A record on each check and alerts when the IP address changes. Catches unexpected CDN failovers, BGP changes, or DNS hijacking.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com',
    faqs: [
      { q: 'Will it alert on planned migrations?', a: 'Yes — pause or delete the monitor before an intentional IP change, then recreate it.' },
      { q: 'Is the first check always "up"?', a: 'Yes — the first run sets the baseline IP. Alerts only fire on subsequent changes.' },
    ],
  },
  'mx-health': {
    emoji: '📧',
    name: 'MX Health',
    what: 'Checks that your domain has valid MX records and that the primary mail server resolves. Broken MX means lost email — often silent for days.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com — the domain email is sent to',
    faqs: [
      { q: 'What does "MX host does not resolve" mean?', a: 'The MX record points to a mail server that has no A record — incoming mail has nowhere to go.' },
      { q: 'Does it test sending email?', a: 'No — it checks DNS only. SMTP banner checks are on our roadmap.' },
    ],
  },
  'whois-change': {
    emoji: '📋',
    name: 'WHOIS Registrar Change',
    what: 'Detects changes to your domain\'s SOA record and nameservers — the earliest DNS signals of a registrar transfer or domain hijacking.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com',
    faqs: [
      { q: 'Is this the same as a full WHOIS lookup?', a: 'We use DNS SOA and NS records as a fast proxy. Full WHOIS is rate-limited by most registries.' },
      { q: 'Is the first check always "up"?', a: 'Yes — the first run sets the baseline. Only subsequent changes trigger alerts.' },
    ],
  },
  sitemap: {
    emoji: '🗺️',
    name: 'Sitemap Validity',
    what: 'Fetches /sitemap.xml and verifies it\'s accessible and valid XML. A broken sitemap silently stops Google from discovering new pages.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com — we\'ll fetch /sitemap.xml automatically',
    faqs: [
      { q: 'What if my sitemap is at a custom path?', a: 'Currently we always check /sitemap.xml. Custom path support is on the roadmap.' },
      { q: 'Does it validate every URL in the sitemap?', a: 'No — we validate the XML structure and count URLs, not individual URL accessibility.' },
    ],
  },
  'redirect-chain': {
    emoji: '🔗',
    name: 'Redirect Chain',
    what: 'Follows all redirect hops from your URL and alerts if the chain is too long, ends in an error, or forms a loop. Redirect bloat hurts Core Web Vitals.',
    targetLabel: 'Enter your URL',
    targetHint: 'e.g. http://yoursite.com — enter the starting URL, not the final destination',
    faqs: [
      { q: 'How many redirects are too many?', a: 'Google recommends fewer than 3 hops. We alert at 5 by default — configurable.' },
      { q: 'Does it detect HTTP → HTTPS redirects?', a: 'Yes. Every hop is recorded, including the HTTP to HTTPS transition.' },
    ],
  },
  'spf-dmarc': {
    emoji: '✉️',
    name: 'SPF / DMARC Validity',
    what: 'Checks your domain\'s SPF and DMARC DNS records are present and correctly configured. Missing or weak records allow attackers to spoof your email domain.',
    targetLabel: 'Enter your email domain',
    targetHint: 'e.g. yoursite.com — the domain you send email from',
    faqs: [
      { q: 'What\'s the difference between SPF and DMARC?', a: 'SPF says which servers can send on your behalf. DMARC tells receiving servers what to do if SPF/DKIM fail (quarantine or reject).' },
      { q: 'My DMARC is p=none — is that bad?', a: 'p=none is monitoring-only, no enforcement. We flag it as a warning. Move to p=quarantine or p=reject to protect your brand.' },
    ],
  },
  blacklist: {
    emoji: '🚫',
    name: 'Blacklist Check',
    what: 'Checks your server\'s IP against Spamhaus, SpamCop, SORBS, and Barracuda block lists. Being listed destroys email deliverability instantly.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com — we\'ll resolve the IP and check it',
    faqs: [
      { q: 'How do I get delisted?', a: 'Each block list has a delisting form. Fix the underlying spam issue first, then request removal.' },
      { q: 'Why might I be listed?', a: 'Sending spam, a compromised server, or sharing a cloud IP with a bad neighbour. Spamhaus ZEN is the most common.' },
    ],
  },
  'page-size': {
    emoji: '📦',
    name: 'Page Size',
    what: 'Measures response body size in KB and alerts when it exceeds your warn or critical thresholds. Page bloat hurts Core Web Vitals and CDN costs.',
    targetLabel: 'Enter your page URL',
    targetHint: 'e.g. https://yoursite.com',
    faqs: [
      { q: 'What thresholds should I set?', a: 'Typical: warn at 1,000 KB, critical at 3,000 KB for HTML pages. APIs should be much lower (warn 100 KB).' },
      { q: 'Does this include images and CSS?', a: 'No — this measures the HTML response body only, not external assets.' },
    ],
  },
  'cookie-consent': {
    emoji: '🍪',
    name: 'Cookie Consent Presence',
    what: 'Scans your page for known cookie consent platform signatures. A missing banner can trigger GDPR/CCPA compliance violations.',
    targetLabel: 'Enter your site URL',
    targetHint: 'e.g. https://yoursite.com',
    faqs: [
      { q: 'Which consent platforms do you detect?', a: 'CookieYes, OneTrust, TrustArc, Cookiebot, Usercentrics, ConsentManager, and generic GDPR/cookie-law patterns.' },
      { q: 'Does it verify consent is working?', a: 'It checks presence in the HTML only — not whether the banner is functioning or compliant.' },
    ],
  },
  'nameserver-change': {
    emoji: '🖥️',
    name: 'Nameserver Change',
    what: 'Watches your domain\'s authoritative nameservers and alerts the moment they change. Nameserver changes cause global DNS propagation and can cause outages.',
    targetLabel: 'Enter your domain',
    targetHint: 'e.g. yoursite.com',
    faqs: [
      { q: 'How is this different from DNS record monitoring?', a: 'DNS monitoring watches A, MX, TXT changes. This specifically watches NS records — which affect all DNS globally.' },
      { q: 'Is the first check always "up"?', a: 'Yes — the first run sets the baseline nameservers. Only subsequent changes trigger alerts.' },
    ],
  },
  wordpress: {
    emoji: '__wp__',
    name: 'Upnotify WordPress Monitor',
    what: 'A lightweight plugin installed on your WordPress site pushes security and health data to Upnotify on a schedule. Unlike external monitors, this runs from inside your site — detecting threats that HTTP checks can never see.',
    targetLabel: 'Enter your WordPress site URL',
    targetHint: 'e.g. https://yoursite.com — the same URL you use to access the site',
    faqs: [
      { q: 'How is this different from uptime monitoring?', a: 'Uptime monitoring only checks if your site responds. This plugin checks inside — file injections in uploads, rogue admin users, modified core files, outdated plugins, and more.' },
      { q: 'Do I need to install a plugin?', a: 'Yes — after creating this monitor you\'ll get a secure token. Install the Upnotify plugin on your WordPress site and paste the token in Upnotify → Settings. The plugin then pushes data to Upnotify automatically.' },
      { q: 'Will the plugin slow down my site?', a: 'No. All scans run via WordPress Cron in the background, staggered across the day so no single run is heavy.' },
      { q: 'What does it check?', a: 'PHP/JS files in uploads, .htaccess & wp-config.php changes, core file modifications, new admin/editor users, recently created pages, foreign-language SEO spam, outdated plugins and themes, PHP version, and debug mode status.' },
      { q: 'What if my site goes down?', a: 'Your standard HTTP uptime monitor (set up separately) covers that. This monitor focuses on security and health from inside the site.' },
    ],
  },
}

function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="monitor-faq">
      <button type="button" onClick={() => setOpen(o => !o)} className="monitor-faq-btn">
        <span className="monitor-faq-q">{q}</span>
        <span className={`monitor-faq-icon${open ? ' open' : ''}`}>+</span>
      </button>
      {open && <p className="monitor-faq-answer">{a}</p>}
    </div>
  )
}

function WordPressLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="28" height="28" aria-label="WordPress">
      <circle cx="256" cy="256" r="248" fill="#21759b" />
      <path fill="#fff" d="M38.4 256c0 86.6 50.3 161.7 123.5 197.9L58.1 163.7C45.5 193.5 38.4 226.9 38.4 256zm336.8-10.1c0-27-9.7-45.7-18-60.2-11.1-18-21.5-33.2-21.5-51.2 0-20.1 15.2-38.8 36.7-38.8.97 0 1.9.1 2.84.16C338.8 63 299 48 256 48c-57.2 0-107.5 29.3-136.8 73.7 3.84.12 7.46.19 10.6.19 17.2 0 43.8-2.1 43.8-2.1 8.86-.52 9.9 12.5 1.05 13.5 0 0-8.91 1.05-18.8 1.57l59.9 178.3 36-107.8-25.6-70.5c-8.86-.52-17.2-1.57-17.2-1.57-8.86-.52-7.82-14 1.04-13.5 0 0 27.1 2.1 43.3 2.1 17.2 0 43.8-2.1 43.8-2.1 8.87-.52 9.91 12.5 1.05 13.5 0 0-8.92 1.05-18.8 1.57l59.4 176.8 16.4-54.7c7.1-22.7 12.5-39 12.5-53z"/>
      <path fill="#fff" d="M259.4 273.6l-49.3 143.3c14.7 4.33 30.3 6.69 46.4 6.69 19.1 0 37.5-3.3 54.6-9.3-.44-.7-.84-1.44-1.17-2.24L259.4 273.6zm150.5-99.4c.78 5.76 1.22 11.9 1.22 18.5 0 18.3-3.42 38.8-13.7 64.5l-55 159c53.5-31.2 89.5-89.1 89.5-155.2 0-31.8-8.13-61.7-22-87.8z"/>
    </svg>
  )
}

export function MonitorTypeHelp({ type }: { type: string }) {
  const help = helpData[type]
  if (!help) return null

  return (
    <div className="monitor-help-panel">
      <div className="monitor-help-header">
        {help.emoji === '__wp__'
          ? <span className="monitor-help-icon monitor-help-icon-svg"><WordPressLogo /></span>
          : <span className="monitor-help-icon">{help.emoji}</span>
        }
        <span className="monitor-help-name">{help.name}</span>
      </div>
      <div className="monitor-help-body">
        <p className="monitor-help-desc">{help.what}</p>
        <div className="monitor-help-target">
          <div className="monitor-help-target-label">{help.targetLabel}</div>
          <div className="monitor-help-target-hint">{help.targetHint}</div>
        </div>
        <div className="monitor-help-faqs-label">Common questions</div>
        <div>
          {help.faqs.map((faq, i) => (
            <Accordion key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </div>
  )
}
