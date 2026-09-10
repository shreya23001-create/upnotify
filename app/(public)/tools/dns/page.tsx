import type { Metadata } from 'next'
import { ToolPillarLanding, type ToolPillarData } from '@/components/landing/tool-pillar-landing'
import '../../landing.css'

const data: ToolPillarData = {
  pillarSlug: 'dns',
  seoTitle: 'Free DNS & Email Tools — DNS Lookup, WHOIS, SPF, DMARC | Upnotify',
  seoDescription:
    'Free DNS and email-authentication tools: DNS record lookup (A, AAAA, MX, NS, TXT, CNAME, SOA), WHOIS domain expiry lookup, and SPF/DMARC email authentication checker. No signup required.',
  heroTitle: 'Free DNS & Email Tools',
  heroSubtitle:
    'Look up DNS records, verify domain expiry, and confirm your email authentication is configured correctly. The three tools every domain owner should know about.',
  whyItMatters: [
    "DNS and email authentication are quietly the most fragile parts of any web setup. A single nameserver change can take a site dark. A missed WHOIS renewal lets a competitor or squatter grab your domain. A missing DMARC record lets attackers spoof your brand in phishing emails — and Google + Yahoo now actively reject mail from domains without it.",
    "These three tools cover the basics: query any DNS record type for any domain in milliseconds, look up the registrar, expiry date, and nameservers from authoritative WHOIS / RDAP, and confirm your SPF and DMARC records are present and configured strictly enough to actually block spoofing.",
  ],
  tools: [
    {
      slug: 'dns-lookup',
      label: 'DNS Lookup',
      oneLiner: 'Query A, AAAA, MX, NS, TXT, CNAME, and SOA records for any domain. Instant results.',
    },
    {
      slug: 'whois-lookup',
      label: 'WHOIS Lookup',
      oneLiner: 'Domain registration details, expiry date, registrar, nameservers, RDAP data.',
    },
    {
      slug: 'spf-dmarc-checker',
      label: 'SPF & DMARC Checker',
      oneLiner: 'Check email authentication. See if your domain is protected against spoofing and phishing.',
    },
  ],
  monitors: [
    {
      slug: 'dns-monitoring',
      label: 'DNS record monitoring',
      why: 'Continuous version of DNS Lookup. Catches unauthorised record changes — a common signal of registrar compromise — within minutes.',
    },
    {
      slug: 'nameserver-monitoring',
      label: 'Nameserver monitoring',
      why: 'NS records change rarely. When they do — registrar transfer, hijack, or planned migration — every other DNS record is affected. Continuous NS monitoring catches it instantly.',
    },
    {
      slug: 'domain-expiry-monitoring',
      label: 'Domain expiry monitoring',
      why: 'Auto-renew cron failed silently? WHOIS-driven monitoring alerts you 30 and 7 days before the registration lapses, so a squatter doesn\'t snap up your domain.',
    },
    {
      slug: 'spf-dmarc-monitoring',
      label: 'SPF / DMARC monitoring',
      why: 'A removed or weakened DMARC record opens the door to brand-impersonation phishing. Continuous monitoring catches policy regressions the moment they happen.',
    },
    {
      slug: 'mx-health-monitoring',
      label: 'MX health monitoring',
      why: 'Broken MX configuration silently drops email for days before anyone notices. Continuous MX checks confirm mail servers resolve and respond.',
    },
  ],
  faq: [
    {
      q: 'Why should I check my DNS records when nothing has changed?',
      a: 'Because changes happen without you. Registrar account compromise, automation scripts, or a migrating provider can rewrite records overnight. A periodic DNS Lookup gives you a baseline; continuous DNS monitoring catches every change within minutes.',
    },
    {
      q: 'My DMARC is "p=none" — is that a problem?',
      a: 'p=none means monitoring-only — no enforcement. Recipients see DMARC failures but won\'t reject the email. The SPF & DMARC Checker flags this as a warning. Once you\'re confident your legitimate mail passes, move to p=quarantine and then p=reject for real spoofing protection. Google and Yahoo bulk-sender rules now expect this.',
    },
    {
      q: 'How accurate is the WHOIS Lookup?',
      a: 'It pulls from authoritative WHOIS / RDAP for each TLD. Some ccTLDs restrict registrant data — you\'ll see "redacted for privacy" instead of the registrant name. Expiry date, registrar, and nameservers are always returned where the registry exposes them.',
    },
    {
      q: 'Why don\'t my MX changes show up immediately?',
      a: 'DNS propagation. MX records have a TTL that resolvers cache — typically 1–24 hours. Until each resolver\'s cache expires, the old MX answer is served. Run the DNS Lookup against `8.8.8.8` (Google) vs `1.1.1.1` (Cloudflare) to compare propagation across providers.',
    },
    {
      q: 'Do I need both SPF and DMARC?',
      a: 'Yes. SPF tells receiving servers which IPs can send for your domain. DMARC tells receivers what to do when SPF or DKIM fails (quarantine or reject). Without DMARC, SPF alone won\'t block spoofing — receivers may still deliver. The two work together.',
    },
  ],
}

export const metadata: Metadata = {
  title: data.seoTitle,
  description: data.seoDescription,
  alternates: { canonical: `https://upnotify-monitoring.vercel.app/tools/${data.pillarSlug}` },
  openGraph: {
    title: data.seoTitle,
    description: data.seoDescription,
    url: `https://upnotify-monitoring.vercel.app/tools/${data.pillarSlug}`,
    type: 'website',
  },
}

export default function DnsToolsPillarPage(): React.ReactElement {
  return <ToolPillarLanding data={data} />
}
