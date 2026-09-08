import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightLeft, Repeat, Lock, AlertTriangle } from 'lucide-react'
import { RedirectChainCheckerTool } from '@/components/tools/redirect-chain-checker-tool'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Free Redirect Chain Checker — Trace URL Redirects | Upnotify',
  description:
    'Trace the full redirect chain for any URL. See every 301, 302, 307 redirect, detect redirect loops, and find SEO-damaging redirect chains. Free tool, no signup.',
  alternates: { canonical: 'https://uptrue.io/tools/redirect-chain-checker' },
  keywords: [
    'redirect chain checker',
    'url redirect checker',
    'follow redirects tool',
    '301 redirect checker',
    'redirect loop detector',
    'check url redirects',
    'redirect tracer',
    'seo redirect checker',
  ],
  openGraph: {
    title: 'Free Redirect Chain Checker — Trace URL Redirects | Upnotify',
    description:
      'Trace the full redirect chain for any URL. Detect loops, count hops, and find SEO-damaging redirect chains instantly.',
    url: 'https://uptrue.io/tools/redirect-chain-checker',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Redirect Chain Checker',
      description:
        'Free tool to trace the full redirect chain for any URL. Detects redirect loops, counts hops, highlights HTTP→HTTPS upgrades, and flags SEO issues.',
      url: 'https://uptrue.io/tools/redirect-chain-checker',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a redirect chain?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A redirect chain occurs when a URL redirects to another URL, which then redirects again — creating a sequence of multiple hops before the browser reaches the final page. For example: http://example.com → https://example.com → https://www.example.com → https://www.example.com/home. Each extra hop adds latency, and search engines may stop following chains that are too long.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do redirect chains hurt SEO?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Long redirect chains hurt SEO in several ways: they slow down page load times, search engine crawlers may not follow chains longer than 3-5 hops, and each redirect hop can dilute the passing of link equity (PageRank). Google recommends keeping redirect chains to one hop wherever possible. A chain of HTTP → HTTPS → non-www → www can typically be consolidated into a single redirect.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between 301 and 302 redirects?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A 301 (Moved Permanently) tells browsers and search engines the page has permanently moved. Search engines transfer link equity to the new URL and update their index. A 302 (Found / Temporary Redirect) tells browsers the page is temporarily elsewhere — search engines keep the original URL indexed and do not fully transfer link signals. Use 301 for permanent moves, 302 only when the redirect is genuinely temporary.',
          },
        },
        {
          '@type': 'Question',
          name: 'How many redirects are too many?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Best practice is one redirect hop. Two is acceptable. Three or more starts to impact performance and SEO. Google has stated it follows up to 10 redirects but may reduce crawl budget for pages with long chains. For users, each hop adds 100-300ms of latency. Consolidate chains to direct the old URL straight to the final destination with a single 301.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I fix a redirect loop?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A redirect loop happens when URL A redirects to URL B which redirects back to URL A (or through a longer cycle). To fix it: check your .htaccess or Nginx config for conflicting redirect rules, check any CMS redirect plugins for duplicates, check CDN redirect rules (Cloudflare Page Rules), and ensure your HTTPS/www redirect rules do not conflict with each other. This tool detects loops automatically.',
          },
        },
      ],
    },
  ],
}

export default function RedirectChainCheckerPage(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="tools-page">
        <ScrollReveal />
        <div className="tools-hero">
          <h1 className="tools-hero-title reveal-title">Redirect Chain Checker</h1>
          <p className="tools-hero-subtitle reveal-title">
            Trace every redirect hop for any URL. Detect loops, count hops, and find redirect chains that are slowing your site and hurting your SEO.
          </p>
        </div>

        <div className="tools-container">
          <RedirectChainCheckerTool />

          <div className="tools-info-section">
            <h2>What does this tool check?</h2>
            <div className="tools-info-grid reveal-stagger">
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><ArrowRightLeft size={16} /></span>Full Redirect Chain</h3>
                <p>Every redirect hop is traced and shown visually with its status code, destination URL, and response time.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Repeat size={16} /></span>Loop Detection</h3>
                <p>Automatically detects redirect loops where URLs redirect back to themselves, causing infinite cycles.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Lock size={16} /></span>HTTP → HTTPS Upgrades</h3>
                <p>Highlights which hops perform HTTP-to-HTTPS upgrades or www/non-www changes so you can consolidate them.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><AlertTriangle size={16} /></span>SEO Issue Flags</h3>
                <p>Flags issues that hurt SEO: long chains, temporary 302 redirects where 301 is needed, and missing HTTPS upgrades.</p>
              </div>
            </div>
          </div>

          <Faq
            headline="Frequently Asked Questions"
            items={[
              {
                question: 'What is a redirect chain?',
                answer:
                  'A redirect chain is a sequence of redirects before reaching the final URL. For example: http://example.com → https://example.com → https://www.example.com is a 2-hop chain. Each extra hop adds delay and can reduce how much SEO value passes through the chain.',
              },
              {
                question: 'Do redirect chains hurt SEO?',
                answer:
                  'Yes. Long chains slow down page load, search engine crawlers may stop following them after 3-5 hops, and each hop can reduce the link equity passed to the final URL. Consolidate chains to a single direct redirect to the final destination wherever possible.',
              },
              {
                question: 'What is the difference between 301 and 302 redirects?',
                answer:
                  '301 (Permanent) — search engines transfer link equity to the new URL and update their index. Best for permanent page moves. 302 (Temporary) — search engines keep the original URL indexed and do not fully transfer ranking signals. Only use 302 when the redirect is genuinely temporary, such as during A/B testing or maintenance.',
              },
              {
                question: 'How many redirects are too many?',
                answer:
                  'One redirect hop is ideal. Two is acceptable. Three or more starts to impact SEO and performance. Google follows up to 10 redirects but may reduce crawl budget for pages with long chains. Each hop adds 100–300ms of latency. Aim to direct old URLs straight to the final destination in a single 301.',
              },
              {
                question: 'How do I fix a redirect loop?',
                answer:
                  'A redirect loop occurs when URL A redirects to URL B which redirects back to URL A. To fix: check your .htaccess or Nginx config for conflicting rules, check any CMS redirect plugins for duplicates, and review CDN redirect rules (Cloudflare Page Rules). Make sure your HTTP→HTTPS and www→non-www rules do not create a cycle.',
              },
            ]}
          />

          <div className="tools-cta reveal">
            <h2>Monitor your redirects automatically</h2>
            <p>
              Redirect chains often appear silently after deployments. Upnotify&apos;s{' '}
              <Link href="/monitoring/redirect-chain-monitoring">redirect chain monitoring</Link> watches your URLs
              continuously and alerts you when a chain changes or a loop appears. Pair it with{' '}
              <Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link> for end-to-end coverage.
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
