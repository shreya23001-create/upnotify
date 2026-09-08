import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Frame, FileWarning, Gauge } from 'lucide-react'
import { SecurityHeadersCheckerTool } from '@/components/tools/security-headers-checker-tool'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Free Security Headers Checker — Test HTTP Headers | Upnotify',
  description:
    'Check your website\'s HTTP security headers instantly. Test for HSTS, CSP, X-Frame-Options, and more. Get a security grade and actionable recommendations. Free tool.',
  alternates: { canonical: 'https://uptrue.io/tools/security-headers-checker' },
  keywords: [
    'security headers checker',
    'http security headers test',
    'check security headers',
    'website security test',
    'csp header checker',
    'hsts checker',
    'x-frame-options checker',
    'security headers grade',
  ],
  openGraph: {
    title: 'Free Security Headers Checker — Test HTTP Headers | Upnotify',
    description:
      'Check your website\'s HTTP security headers instantly. Get a security grade, see missing headers, and fix vulnerabilities.',
    url: 'https://uptrue.io/tools/security-headers-checker',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Security Headers Checker',
      description:
        'Free tool to check HTTP security headers for any website. Tests for HSTS, CSP, X-Frame-Options, and more. Provides a security grade and actionable recommendations.',
      url: 'https://uptrue.io/tools/security-headers-checker',
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What are HTTP security headers?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'HTTP security headers are response headers that your web server sends to the browser to instruct it how to behave when handling your website. Headers like Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Frame-Options tell the browser to enforce HTTPS, restrict resource loading, and prevent clickjacking — protecting your users from a wide range of attacks.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is HSTS and why is it important?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'HSTS (HTTP Strict Transport Security) is a security header that tells browsers to only communicate with your website over HTTPS, never HTTP. Once a browser sees the HSTS header, it will automatically redirect all future HTTP requests to HTTPS, even before sending them to the server. This prevents man-in-the-middle attacks and protocol downgrade attacks. A site without HSTS can be attacked by stripping HTTPS at the network level.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I add a Content Security Policy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "A Content Security Policy (CSP) is added as an HTTP response header: Content-Security-Policy: default-src 'self'. You configure it in your web server (Nginx: add_header Content-Security-Policy ...; Apache: Header always set Content-Security-Policy ...) or via your CDN or hosting provider. Start with a report-only mode (Content-Security-Policy-Report-Only) to identify violations before enforcing. A strict CSP is one of the most effective defences against XSS attacks.",
          },
        },
        {
          '@type': 'Question',
          name: 'What does X-Frame-Options do?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "X-Frame-Options controls whether your website can be embedded in an iframe on another site. Setting it to DENY or SAMEORIGIN prevents clickjacking attacks, where an attacker overlays your site inside a hidden iframe to trick users into clicking buttons or entering data. Modern browsers also support the frame-ancestors directive in CSP, which does the same job with more flexibility. Both should be set.",
          },
        },
        {
          '@type': 'Question',
          name: 'How do I get an A+ security headers grade?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'To achieve an A+ grade, your site needs to return all eight security headers: Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy (COOP), and Cross-Origin-Embedder-Policy (COEP). The most impactful are HSTS and CSP. Add headers in your web server config, CDN settings (Cloudflare, Fastly), or via middleware in your application framework.',
          },
        },
      ],
    },
  ],
}

export default function SecurityHeadersCheckerPage(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="tools-page">
        <ScrollReveal />
        <div className="tools-hero">
          <h1 className="tools-hero-title reveal-title">Security Headers Checker</h1>
          <p className="tools-hero-subtitle reveal-title">
            Check your website&apos;s HTTP security headers instantly. Get a security grade, see what&apos;s missing, and understand what each header protects against.
          </p>
        </div>

        <div className="tools-container">
          <SecurityHeadersCheckerTool />

          <div className="tools-info-section">
            <h2>What does this tool check?</h2>
            <div className="tools-info-grid reveal-stagger">
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><ShieldCheck size={16} /></span>HSTS &amp; CSP</h3>
                <p>The two most critical headers: HSTS enforces HTTPS, CSP prevents cross-site scripting attacks.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Frame size={16} /></span>Clickjacking Protection</h3>
                <p>Checks X-Frame-Options to confirm your site cannot be embedded in malicious iframes.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><FileWarning size={16} /></span>Content Type Sniffing</h3>
                <p>Verifies X-Content-Type-Options is set to prevent browsers from guessing file types.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Gauge size={16} /></span>Security Grade</h3>
                <p>Overall A+ to F grade based on which headers are present, so you know exactly where you stand.</p>
              </div>
            </div>
          </div>

          <Faq
            headline="Frequently Asked Questions"
            items={[
              {
                question: 'What are HTTP security headers?',
                answer:
                  'HTTP security headers are response headers that your web server sends to browsers to control their behaviour. They instruct the browser to enforce HTTPS, restrict what scripts can run, prevent embedding in iframes, and more — protecting users from attacks like XSS, clickjacking, and protocol downgrade.',
              },
              {
                question: 'What is HSTS and why is it important?',
                answer:
                  'HSTS (HTTP Strict Transport Security) tells browsers to only connect to your site over HTTPS, forever. Without it, attackers can strip HTTPS at the network level and intercept traffic. HSTS is the single most important security header for any site that uses HTTPS.',
              },
              {
                question: 'How do I add a Content Security Policy?',
                answer:
                  'Add a Content-Security-Policy header in your web server config (Nginx: add_header, Apache: Header always set), your CDN (Cloudflare Transform Rules), or application middleware. Start with report-only mode to see violations before enforcing. A strict CSP is the most powerful defence against XSS attacks.',
              },
              {
                question: 'What does X-Frame-Options do?',
                answer:
                  'X-Frame-Options: DENY or SAMEORIGIN prevents your pages from being loaded in iframes on other websites. This blocks clickjacking attacks where attackers overlay a hidden version of your site to trick users into clicking buttons or logging in. The modern CSP frame-ancestors directive provides the same protection with more flexibility.',
              },
              {
                question: 'How do I get an A+ security headers grade?',
                answer:
                  'To score A+, you need all eight headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy (COOP), and Cross-Origin-Embedder-Policy (COEP). Start with HSTS and CSP as they carry the most weight, then add the remaining headers one by one. Many hosting platforms and CDNs let you add headers with no code changes.',
              },
            ]}
          />

          <div className="tools-cta reveal">
            <h2>Monitor your security headers 24/7</h2>
            <p>
              Security headers go missing in deployments more often than teams realise. Upnotify&apos;s{' '}
              <Link href="/monitoring/security-headers-monitoring">security headers monitoring</Link> checks
              every six hours and pairs naturally with{' '}
              <Link href="/monitoring/ssl-certificate-monitoring">SSL certificate monitoring</Link> for the full
              transport-security picture.
            </p>
            <a href="/signup" className="btn btn-primary btn-lg">
              Start Monitoring Free
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
