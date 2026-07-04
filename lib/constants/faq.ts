export interface FaqItem {
  question: string
  answer: React.ReactNode
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How does the two-confirmation detection work?',
    answer: 'When a check detects a potential issue, Uptrue waits 30 seconds and runs a second check from a different region. An incident is only created if both checks confirm the problem. This eliminates false alarms caused by temporary network blips or routing issues.',
  },
  {
    question: 'What monitor types does Uptrue support for website uptime monitoring?',
    answer: 'Uptrue supports 24 monitor types covering uptime, security, and infrastructure: HTTP/HTTPS uptime, SSL certificate expiry, DNS record changes, keyword presence, domain expiry, port availability, ping/ICMP, API endpoint validation, heartbeat (cron job monitoring), page change detection, security headers, response time, robots.txt, IP change, MX health, WHOIS/registrar, sitemap, redirect chain, SPF/DMARC, blacklist, page size, cookie consent, nameserver monitoring, and Uptrue WordPress Monitor for site-internal scanning.',
  },
  {
    question: 'How do public status pages work?',
    answer: 'You can create branded status pages that display real-time uptime data for your monitors. Share the link with customers or embed it on your site. Status pages update automatically when incidents are detected or resolved.',
  },
  {
    question: 'What are AI-powered reports?',
    answer: 'Uptrue uses Claude AI to generate executive summaries of your monitoring data. Reports analyse uptime trends, incident patterns, and performance metrics, then present actionable insights in plain language — perfect for sharing with clients or stakeholders.',
  },
  {
    question: 'Can I white-label Uptrue for my agency?',
    answer: 'Yes. Our upcoming Agency tier will include full white-label capabilities — your clients see your brand, not ours. You will be able to add your own Google Tag Manager, analytics, and custom scripts to client-facing pages. Join the waitlist now for early access.',
  },
  {
    question: 'What alert channels are supported?',
    answer: 'Uptrue sends alerts via email, Slack, Microsoft Teams, Telegram, and webhooks. Webhook payloads are signed with HMAC-SHA256 for security. You can configure multiple channels per monitor and filter by severity.',
  },
  {
    question: 'Is there a free plan?',
    answer: 'Yes. The Free plan includes 3 monitors with 10-minute checks and email alerts. No credit card required to start. You can upgrade at any time as your needs grow.',
  },
  {
    question: 'Can I cancel or pause my subscription?',
    answer: 'Yes. You can cancel from Settings > Billing at any time. If cost is the concern, you can pause your subscription for up to 3 months — no charges, data preserved, resume anytime. We send reminders 14 and 3 days before billing resumes.',
  },
  {
    question: 'Where is my data stored?',
    answer: 'All data is stored in the EU (Frankfurt region) on Supabase infrastructure. We encrypt data at rest and in transit. Row-level security ensures complete data isolation between organisations.',
  },
]
