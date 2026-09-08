import type { Metadata } from 'next'
import Link from 'next/link'
import { Hash, ArrowRightLeft, FileText, Clock } from 'lucide-react'
import { HttpStatusCheckerTool } from '@/components/tools/http-status-checker-tool'
import Faq from '@/components/landing/faq'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Free HTTP Status Checker — Check URL Response Codes | Upnotify',
  description:
    'Check any URL\'s HTTP status code instantly. See response codes, redirect chains, response headers, and server information. Free HTTP checker, no signup required.',
  alternates: { canonical: 'https://uptrue.io/tools/http-status-checker' },
  keywords: [
    'http status checker',
    'check url status code',
    'website response code checker',
    'http status code tool',
    'url checker online',
    'check website response',
    '404 checker',
    'redirect checker',
  ],
  openGraph: {
    title: 'Free HTTP Status Checker — Check URL Response Codes | Upnotify',
    description:
      'Check any URL\'s HTTP status code instantly. See redirects, response headers, and server information.',
    url: 'https://uptrue.io/tools/http-status-checker',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'HTTP Status Checker',
      description:
        'Free tool to check any URL\'s HTTP status code. See redirect chains, response headers, and server information instantly.',
      url: 'https://uptrue.io/tools/http-status-checker',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What do HTTP status codes mean?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'HTTP status codes are three-digit numbers returned by a server to indicate the result of a request. 2xx codes (200, 201, 204) mean success. 3xx codes (301, 302, 307) mean a redirect. 4xx codes (400, 403, 404) mean a client error — the page does not exist, you are not authorised, or the request was bad. 5xx codes (500, 502, 503) mean a server error — something went wrong on the server.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between 301 and 302 redirects?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A 301 redirect is permanent — it tells browsers and search engines that the page has moved forever. Search engines transfer link equity (PageRank) to the new URL. A 302 redirect is temporary — it tells browsers the page is temporarily elsewhere, so search engines keep the original URL indexed. Use 301 for permanent moves, 302 only for genuinely temporary redirects.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why is my website returning a 404?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A 404 means the server could not find the page at the requested URL. Common causes: the page was deleted without setting up a redirect, the URL was mistyped, the server configuration changed, or a database-driven page lost its record. Fix it by setting up a 301 redirect from the old URL to the new location, or restoring the page.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does a 503 error mean?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A 503 Service Unavailable error means the server is temporarily unable to handle the request. This is usually caused by the server being overloaded, down for maintenance, or having too many simultaneous connections. Unlike a 500 error, a 503 implies the problem is temporary. If you see persistent 503s, check your server load, memory usage, and any maintenance windows.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I check if a URL redirects?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Use this free HTTP Status Checker — enter any URL and it will follow all redirects and show you every hop in the chain, including the status code at each step. You can also use curl: curl -I -L https://example.com to see all headers including redirects. For SEO purposes, always check that redirect chains are short (ideally one hop) and use 301 for permanent redirects.',
          },
        },
      ],
    },
  ],
}

export default function HttpStatusCheckerPage(): React.ReactElement {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="tools-page">
        <ScrollReveal />
        <div className="tools-hero">
          <h1 className="tools-hero-title reveal-title">HTTP Status Checker</h1>
          <p className="tools-hero-subtitle reveal-title">
            Enter any URL to check its HTTP status code. See redirects, server headers, and a plain-English explanation of what the response means.
          </p>
        </div>

        <div className="tools-container">
          <HttpStatusCheckerTool />

          <div className="tools-info-section">
            <h2>What does this tool check?</h2>
            <div className="tools-info-grid reveal-stagger">
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Hash size={16} /></span>HTTP Status Code</h3>
                <p>The exact response code returned by the server — 200, 301, 404, 503 — with a plain-English explanation.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><ArrowRightLeft size={16} /></span>Redirect Chain</h3>
                <p>Every redirect hop is shown step by step, so you can see exactly where a URL ends up and how many hops it takes.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><FileText size={16} /></span>Response Headers</h3>
                <p>Key response headers including Content-Type, Server, Cache-Control, and X-Powered-By from the final URL.</p>
              </div>
              <div className="tools-info-card">
                <h3><span className="tools-info-icon"><Clock size={16} /></span>Response Time</h3>
                <p>How long the server took to respond in milliseconds — useful for diagnosing slow pages.</p>
              </div>
            </div>
          </div>

          <Faq
            headline="Frequently Asked Questions"
            items={[
              {
                question: 'What do HTTP status codes mean?',
                answer:
                  'HTTP status codes are three-digit numbers indicating the result of a request. 2xx = success (200 OK, 201 Created). 3xx = redirect (301 Permanent, 302 Temporary). 4xx = client error (403 Forbidden, 404 Not Found). 5xx = server error (500 Internal Error, 503 Unavailable). This tool shows the exact code and a plain-English explanation.',
              },
              {
                question: 'What is the difference between 301 and 302 redirects?',
                answer:
                  'A 301 is a permanent redirect — search engines transfer ranking signals (link equity) to the new URL and update their index. A 302 is temporary — search engines keep the original URL indexed. Always use 301 for permanent page moves. Misusing 302 means your SEO value stays on the old URL and may never transfer.',
              },
              {
                question: 'Why is my website returning a 404?',
                answer:
                  'A 404 means the server has nothing at that URL. Common causes: the page was deleted, the URL changed without a redirect, a CMS slug was edited, or the server config changed. Fix it by setting up a 301 redirect from the old URL to the correct page. Every 404 is a lost visitor and lost SEO signal.',
              },
              {
                question: 'What does a 503 error mean?',
                answer:
                  '503 Service Unavailable means the server cannot handle the request right now — usually because of overload, maintenance, or resource exhaustion. Unlike a 500 error, 503 implies the condition is temporary. If you see persistent 503s, check server memory and CPU, connection limits, and whether any maintenance mode is active.',
              },
              {
                question: 'How do I check if a URL redirects?',
                answer:
                  'Enter the URL in this tool — it will follow all redirects and show you every hop. You can also use curl -I -L https://example.com in a terminal. For SEO, aim for a maximum of one redirect hop. Multiple redirects slow down page load and dilute ranking signals.',
              },
            ]}
          />

          <div className="tools-cta reveal">
            <h2>Monitor your URLs around the clock</h2>
            <p>
              Upnotify&apos;s <Link href="/monitoring/http-uptime-monitoring">HTTP uptime monitoring</Link>{' '}
              checks every minute and alerts you the moment a page goes down or returns the wrong status code.
              Pair it with <Link href="/monitoring/redirect-chain-monitoring">redirect chain monitoring</Link> so a
              broken 301 chain doesn&apos;t silently kill SEO between deploys.
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
