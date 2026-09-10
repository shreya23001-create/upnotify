import type { Metadata } from 'next'
import { ToolPillarLanding, type ToolPillarData } from '@/components/landing/tool-pillar-landing'
import '../../landing.css'

const data: ToolPillarData = {
  pillarSlug: 'security',
  seoTitle: 'Free Website Security Tools — SSL, Headers, Blacklist, Port Checker | Upnotify',
  seoDescription:
    'Free website security tools: SSL certificate checker with chain validation, security headers checker (HSTS, CSP, X-Frame-Options), DNSBL blacklist checker, and TCP port checker. No signup required.',
  heroTitle: 'Free Website Security Tools',
  heroSubtitle:
    'Verify your SSL chain is valid, your security headers are in place, your IP isn\'t on a spam blacklist, and your ports are configured correctly. One-off checks; no signup.',
  whyItMatters: [
    "Web security regressions usually arrive silently. A CDN config change strips a security header. An auto-renewal cron quietly fails and the SSL certificate slides into expiry. A neighbour on shared hosting gets your IP listed on Spamhaus, and your transactional email starts bouncing.",
    "These four tools catch the most common regressions in seconds. SSL chain validation goes deeper than \"is the cert valid?\". The headers checker grades you on six baseline controls. The blacklist checker queries the four most-trusted DNSBLs. The port checker confirms the only ports open are the ones you intended.",
  ],
  tools: [
    {
      slug: 'ssl-checker',
      label: 'SSL Certificate Checker',
      oneLiner: 'Issuer, expiry, chain validity, TLS version. Color-coded warnings for expiring certificates.',
      badge: 'Popular',
    },
    {
      slug: 'security-headers-checker',
      label: 'Security Headers Checker',
      oneLiner: 'Grade your HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
    },
    {
      slug: 'blacklist-checker',
      label: 'Blacklist (DNSBL) Checker',
      oneLiner: 'Check your domain or IP against Spamhaus, SpamCop, SORBS, Barracuda. Identify deliverability issues.',
    },
    {
      slug: 'port-checker',
      label: 'Port Checker',
      oneLiner: 'Test if any TCP port is open — SSH, SMTP, MySQL, Postgres, Redis, custom ports.',
    },
  ],
  monitors: [
    {
      slug: 'ssl-certificate-monitoring',
      label: 'SSL certificate monitoring',
      why: 'Continuous version of SSL Checker. Get warned 30, 14, and 3 days before expiry — across every subdomain — even if your auto-renew cron silently fails.',
    },
    {
      slug: 'security-headers-monitoring',
      label: 'Security headers monitoring',
      why: 'Headers like HSTS and CSP can disappear after a CDN config change. Continuous checking catches the regression within minutes, not at the next pen test.',
    },
    {
      slug: 'blacklist-monitoring',
      label: 'Blacklist monitoring',
      why: 'Getting listed on Spamhaus tanks email deliverability instantly. Continuous monitoring alerts you before customers report missing emails.',
    },
    {
      slug: 'port-monitoring',
      label: 'Port monitoring',
      why: 'A closed database or SMTP port silently breaks app functionality. Continuous port checks catch it the moment it goes down.',
    },
  ],
  faq: [
    {
      q: 'What grade do I need on Security Headers?',
      a: 'Aim for "A" — all six baseline headers present (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). "C" or below means your site is exposed to clickjacking, MIME sniffing, or data leakage that a tightened CSP would prevent. The checker shows exactly which header is missing.',
    },
    {
      q: 'How do I know if my SSL certificate is set up correctly?',
      a: 'Run the SSL Checker. It validates the entire chain (root, intermediates, leaf), confirms days-to-expiry, checks for HSTS, and warns on self-signed or incomplete chain configurations. If the chain is broken, browser users will see a warning even though the cert itself is valid.',
    },
    {
      q: 'My IP is on a blacklist — what should I do?',
      a: 'Each blacklist has a delisting process. Spamhaus and Barracuda have web forms. SORBS and SpamCop expect you to fix the underlying spam/abuse issue first. The Blacklist Checker tells you which list flagged you and links to its delisting page.',
    },
    {
      q: 'Why are my mandatory security headers disappearing?',
      a: 'Most common causes: a CDN config change (stripping or proxying through), a framework update that removed a default header, a reverse-proxy reconfig, or a deploy that overrode your custom headers config. Continuous monitoring catches all four — see the matching monitor types below.',
    },
    {
      q: 'Is the Port Checker safe to run on my own server?',
      a: 'Yes. It performs an outgoing TCP connection from our edge — same as any anonymous internet user. It can\'t access anything beyond what an open port exposes. Most servers will see it as ordinary external traffic.',
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

export default function SecurityToolsPillarPage(): React.ReactElement {
  return <ToolPillarLanding data={data} />
}
