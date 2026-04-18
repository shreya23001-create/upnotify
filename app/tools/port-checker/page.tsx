import type { Metadata } from 'next'
import { PortCheckerTool } from '@/components/tools/port-checker-tool'

export const metadata: Metadata = {
  title: 'Free Port Checker — Check If a TCP Port Is Open | Uptrue',
  description:
    'Check if any TCP port is open on any host. Test ports 80, 443, 22, 3306, and more. Free open port checker, instant results, no signup required.',
  alternates: { canonical: 'https://uptrue.io/tools/port-checker' },
  openGraph: {
    title: 'Free Port Checker — Check If a TCP Port Is Open | Uptrue',
    description:
      'Check if any TCP port is open on any host. Test ports 80, 443, 22, 3306, and more instantly.',
    url: 'https://uptrue.io/tools/port-checker',
    type: 'website',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I check if a port is open?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Enter the hostname or IP address and the port number in the tool above, then click "Check Port". The tool will attempt a TCP connection and tell you within seconds whether the port is open or closed.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a TCP port?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A TCP port is a numbered endpoint (1–65535) on a server that allows specific types of network traffic. For example, port 80 handles HTTP web traffic, port 443 handles HTTPS, and port 22 is used for SSH remote access.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why would a port be blocked?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ports can be blocked by a server-side firewall, a cloud provider\'s security group rules, or a network firewall between you and the server. A port may also appear closed if the service is not running or is configured to listen on a different port.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are common port numbers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Common ports include: 21 (FTP), 22 (SSH), 25 (SMTP), 53 (DNS), 80 (HTTP), 143 (IMAP), 443 (HTTPS), 587 (SMTP Submission), 3306 (MySQL), 5432 (PostgreSQL), 6379 (Redis), and 27017 (MongoDB).',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I open a port on my server?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To open a port, you typically need to update your firewall rules. On Linux with UFW: `sudo ufw allow 443/tcp`. On AWS, update your Security Group inbound rules. On GCP, update your VPC firewall rules. Also ensure the service is running and listening on that port.',
      },
    },
  ],
}

export default function PortCheckerPage(): React.ReactElement {
  return (
    <div className="tools-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="tools-hero">
        <h1 className="tools-hero-title">Port Checker</h1>
        <p className="tools-hero-subtitle">
          Enter a hostname and port to check if the TCP port is open. Test firewall rules,
          verify services are running, and troubleshoot connectivity — instantly.
        </p>
      </div>

      <div className="tools-container">
        <PortCheckerTool />

        <div className="tools-info-section">
          <h2>What does this tool check?</h2>
          <div className="tools-info-grid">
            <div className="tools-info-card">
              <h3>Port Reachability</h3>
              <p>Attempts a real TCP connection to verify whether the port is open and accepting connections from the internet.</p>
            </div>
            <div className="tools-info-card">
              <h3>Service Detection</h3>
              <p>Identifies the known service running on well-known ports — HTTP, HTTPS, SSH, SMTP, MySQL, PostgreSQL, Redis, and more.</p>
            </div>
            <div className="tools-info-card">
              <h3>Response Time</h3>
              <p>Measures how long the TCP handshake takes, helping you identify latency and connectivity issues.</p>
            </div>
            <div className="tools-info-card">
              <h3>Firewall Testing</h3>
              <p>Verify your server&apos;s firewall, security group, or cloud networking rules are allowing the right traffic through.</p>
            </div>
          </div>
        </div>

        <div className="tools-info-section">
          <h2>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqSchema.mainEntity.map((faq, i) => (
              <div key={i} className="tools-info-card">
                <h3>{faq.name}</h3>
                <p>{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tools-cta">
          <h2>Monitor your ports 24/7</h2>
          <p>
            Uptrue can monitor any TCP port and alert you instantly if it goes down.
            Get notified by email, Slack, or webhook — before your users notice.
          </p>
          <a href="/signup" className="btn btn-primary btn-lg">
            Start Monitoring Free
          </a>
        </div>
      </div>
    </div>
  )
}
