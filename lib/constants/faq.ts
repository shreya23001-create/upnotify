export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How does the two-confirmation detection work?',
    answer: 'When a check detects a potential issue, Uptrue waits 30 seconds and runs a second check from a different region. An incident is only created if both checks confirm the problem. This eliminates false alarms caused by temporary network blips or routing issues.',
  },
  {
    question: 'What monitor types are available?',
    answer: 'Uptrue supports 10 monitor types: HTTP/HTTPS uptime, SSL certificate expiry, DNS record changes, keyword presence, domain expiry, port availability, ping/ICMP, API endpoint validation, heartbeat (cron job monitoring), and page content detection.',
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
    answer: 'Yes. The Agency plan includes full white-label capabilities. Your clients see your brand, not ours. You can add your own Google Tag Manager, analytics, and custom scripts to client-facing pages.',
  },
  {
    question: 'What alert channels are supported?',
    answer: 'Uptrue sends alerts via email, Slack, Microsoft Teams, and webhooks. Webhook payloads are signed with HMAC-SHA256 for security. You can configure different channels per monitor and set escalation rules.',
  },
  {
    question: 'Is there a free plan?',
    answer: 'Yes. The Free plan includes usage-based monitoring with basic features. No credit card required to start. You can upgrade at any time as your needs grow.',
  },
  {
    question: 'Where is my data stored?',
    answer: 'All data is stored in the EU (Frankfurt region) on Supabase infrastructure. We encrypt data at rest and in transit. Row-level security ensures complete data isolation between organisations.',
  },
]
