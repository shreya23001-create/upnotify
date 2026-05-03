import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Security — Uptrue',
  description:
    'How Uptrue protects your data: encryption, infrastructure security, access controls, vulnerability management, and compliance.',
  alternates: { canonical: 'https://uptrue.io/security' },
}

export default function SecurityPage(): React.ReactElement {
  return (
    <>
      <h1>Security</h1>
      <p className="legal-updated">Last updated: April 2026</p>

      <p>
        Security is foundational to Uptrue. As a monitoring platform, we understand that you trust us
        with information about your infrastructure. This page describes the measures we take to protect
        your data and our platform.
      </p>

      <h2>1. Infrastructure</h2>
      <ul>
        <li>
          <strong>Hosting:</strong> Uptrue runs on Vercel&apos;s edge network with automatic scaling,
          DDoS protection, and global CDN.
        </li>
        <li>
          <strong>Database:</strong> All data is stored in Supabase (PostgreSQL) in the Frankfurt,
          Germany (EU) region with automated backups and point-in-time recovery.
        </li>
        <li>
          <strong>Uptime:</strong> We target 99.9% platform availability. See our{' '}
          <Link href="/sla">SLA</Link> for details.
        </li>
      </ul>

      <h2>2. Encryption</h2>
      <ul>
        <li>
          <strong>In transit:</strong> All communication uses HTTPS with TLS 1.2 minimum (TLS 1.3
          preferred). HTTP is rejected at the edge.
        </li>
        <li>
          <strong>At rest:</strong> Database storage is encrypted at rest using AES-256. Backups are
          also encrypted.
        </li>
        <li>
          <strong>API keys:</strong> Customer API keys are hashed using bcrypt before storage. The
          plain-text key is displayed once at creation and never stored.
        </li>
        <li>
          <strong>Webhooks:</strong> All outbound webhook payloads are signed with HMAC-SHA256 so
          you can verify authenticity.
        </li>
      </ul>

      <h2>3. Authentication and Access Control</h2>
      <ul>
        <li>
          Authentication is handled by Supabase Auth with support for magic links and Google OAuth.
        </li>
        <li>
          Admin access is restricted to Google OAuth with an email whitelist enforced in middleware.
        </li>
        <li>
          Rate limiting on login endpoints: 5 failed attempts trigger a 15-minute lockout.
        </li>
        <li>
          Sessions auto-expire after 24 hours of inactivity.
        </li>
        <li>
          Role-based access control separates Owner, Administrator, Member, and Viewer permissions.
        </li>
      </ul>

      <h2>4. Data Isolation</h2>
      <ul>
        <li>
          <strong>Row Level Security (RLS):</strong> PostgreSQL RLS policies are enforced at the
          database level on every table. Users can only access data belonging to their organisation.
        </li>
        <li>
          All application queries are additionally scoped by organisation ID as a defence-in-depth
          measure.
        </li>
        <li>
          Admin impersonation is read-only and fully audit-logged.
        </li>
      </ul>

      <h2>5. Vulnerability Management</h2>
      <ul>
        <li>
          <code>npm audit</code> runs in CI on every deployment. High-severity vulnerabilities block
          the build.
        </li>
        <li>
          Dependencies are reviewed for active maintenance and known CVEs before adoption.
        </li>
        <li>
          GitHub secret scanning prevents accidental commits of API keys and credentials.
        </li>
      </ul>

      <h2>6. Audit Logging</h2>
      <ul>
        <li>
          All authentication events, admin actions, API key operations, and data access are logged to
          an immutable audit log.
        </li>
        <li>
          Audit logs include timestamp, user ID, action, resource, and IP address.
        </li>
        <li>
          Audit logs are retained for 1 year and cannot be modified or deleted.
        </li>
      </ul>

      <h2>7. Compliance</h2>
      <ul>
        <li>
          <strong>GDPR:</strong> We comply with the General Data Protection Regulation. See our{' '}
          <Link href="/gdpr">GDPR Compliance</Link> page.
        </li>
        <li>
          <strong>UK GDPR:</strong> We comply with the UK implementation of GDPR under the Data
          Protection Act 2018.
        </li>
        <li>
          <strong>DPA:</strong> A Data Processing Agreement is available for all customers. See our{' '}
          <Link href="/dpa">DPA</Link>.
        </li>
        <li>
          <strong>SOC 2:</strong> Targeted within 12 months of launch.
        </li>
      </ul>

      <h2>8. Responsible Disclosure</h2>
      <p>
        If you discover a security vulnerability in Uptrue, please report it responsibly by emailing{' '}
        <a href="mailto:security@uptrue.io">security@uptrue.io</a>. We will acknowledge receipt
        within 24 hours and provide an initial assessment within 5 business days.
      </p>
      <p>
        Please do not disclose vulnerabilities publicly until we have had a reasonable opportunity to
        address them. We do not currently operate a formal bug bounty programme, but we recognise and
        appreciate responsible security researchers.
      </p>

      <h2>9. Contact</h2>
      <p>For security questions or to report an issue:</p>
      <ul>
        <li>
          <strong>Security:</strong>{' '}
          <a href="mailto:security@uptrue.io">security@uptrue.io</a>
        </li>
        <li>
          <strong>Privacy:</strong>{' '}
          <a href="mailto:privacy@uptrue.io">privacy@uptrue.io</a>
        </li>
      </ul>
    </>
  )
}
