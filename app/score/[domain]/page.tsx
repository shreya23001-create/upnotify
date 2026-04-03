/**
 * /score/[domain] — Results page for Uptrue Score.
 * ISR with 1-hour revalidation. Calls the score service server-side.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { calculateScore } from '@/lib/services/score'
import type { ScoreResult, CategoryScore, CheckItem } from '@/lib/services/score'
import { ScoreForm } from '@/components/score/score-form'
import { PublicNav } from '@/components/ui/public-nav'
import { PublicFooter } from '@/components/ui/public-footer'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ domain: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = await params
  const decodedDomain = decodeURIComponent(domain)

  return {
    title: `${decodedDomain} — Website Health Score`,
    description: `${decodedDomain} website health score. Free analysis of uptime, SSL, DNS, security headers, and performance by Uptrue.`,
    alternates: { canonical: `https://uptrue.io/score/${encodeURIComponent(decodedDomain)}` },
    openGraph: {
      title: `${decodedDomain} — Health Score | Uptrue`,
      description: `See the website health score for ${decodedDomain}. Instant analysis across 5 categories.`,
      images: [`/api/badge/score/${encodeURIComponent(decodedDomain)}`],
    },
  }
}

function CategoryCard({ category }: { category: CategoryScore }): React.ReactElement {
  const percentage = Math.round((category.score / category.maxScore) * 100)
  const isGood = percentage >= 80
  const isOk = percentage >= 50 && percentage < 80

  return (
    <div className="score-category-card card">
      <div className="score-category-header">
        <h3 className="score-category-name">{category.name}</h3>
        <div className={`score-category-points ${isGood ? 'good' : isOk ? 'ok' : 'bad'}`}>
          {category.score}/{category.maxScore}
        </div>
      </div>
      <div className="score-category-bar-track">
        <div
          className={`score-category-bar-fill ${isGood ? 'good' : isOk ? 'ok' : 'bad'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ul className="score-checks-list">
        {category.checks.map((check: CheckItem) => (
          <li key={check.label} className="score-check-item">
            <div className="score-check-row">
              <span className={`score-check-icon ${check.passed ? 'pass' : 'fail'}`}>
                {check.passed ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                )}
              </span>
              <span className="score-check-label">{check.label}</span>
              <span className="score-check-value">{check.value}</span>
            </div>
            {check.recommendation && (
              <p className="score-check-recommendation">{check.recommendation}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ScoreCircle({ result }: { result: ScoreResult }): React.ReactElement {
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (result.totalScore / 100) * circumference

  return (
    <div className="score-circle-wrapper">
      <svg className="score-circle-svg" viewBox="0 0 120 120" width="180" height="180">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="var(--border-primary)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={result.gradeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="score-circle-progress"
        />
      </svg>
      <div className="score-circle-inner">
        <span className="score-circle-grade" style={{ color: result.gradeColor }}>
          {result.grade}
        </span>
        <span className="score-circle-number">{result.totalScore}/100</span>
      </div>
    </div>
  )
}

function JsonLd({ result }: { result: ScoreResult }): React.ReactElement {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Uptrue Score',
    url: `https://uptrue.io/score/${encodeURIComponent(result.domain)}`,
    description: `Website health score for ${result.domain}: ${result.grade} (${result.totalScore}/100)`,
    applicationCategory: 'WebApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
    },
    author: {
      '@type': 'Organization',
      name: 'Vision Software Solutions Limited',
      url: 'https://uptrue.io',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default async function ScoreResultsPage({ params }: PageProps): Promise<React.ReactElement> {
  const { domain } = await params
  const decodedDomain = decodeURIComponent(domain)

  let result: ScoreResult | null = null
  let error: string | null = null

  try {
    result = await calculateScore(decodedDomain)
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to scan website'
  }

  return (
    <div className="score-results-wrapper">
      <div className="score-results-page">
      {result && <JsonLd result={result} />}

      <PublicNav />

      <div className="score-results-header">
        <h1 className="score-results-title">
          Health Score for <span className="score-results-domain">{decodedDomain}</span>
        </h1>
        <p className="score-results-scanned">
          {result
            ? `Scanned ${new Date(result.scannedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`
            : 'Scan failed'}
        </p>
      </div>

      {error && (
        <div className="score-error card">
          <div className="card-content">
            <h2>Scan failed</h2>
            <p>{error}</p>
            <p>Check that the domain is correct and the website is accessible.</p>
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="score-overview card">
            <div className="score-overview-inner">
              <ScoreCircle result={result} />
              <div className="score-overview-details">
                <h2 className="score-overview-domain">{result.domain}</h2>
                <p className="score-overview-url">{result.url}</p>
                <div className="score-overview-summary">
                  {result.categories.map((cat: CategoryScore) => (
                    <div key={cat.name} className="score-overview-cat">
                      <span className="score-overview-cat-name">{cat.name}</span>
                      <span className={`score-overview-cat-score ${cat.score >= cat.maxScore * 0.8 ? 'good' : cat.score >= cat.maxScore * 0.5 ? 'ok' : 'bad'}`}>
                        {cat.score}/{cat.maxScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="score-badge-section">
            <h3>Embed this score</h3>
            <div className="score-badge-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/badge/score/${encodeURIComponent(result.domain)}`}
                alt={`Uptrue Score: ${result.grade}`}
                width="160"
                height="28"
              />
            </div>
            <code className="score-badge-code">
              {`<a href="https://uptrue.io/score/${encodeURIComponent(result.domain)}"><img src="https://uptrue.io/api/badge/score/${encodeURIComponent(result.domain)}" alt="Uptrue Score" /></a>`}
            </code>
          </div>

          <div className="score-categories-grid">
            {result.categories.map((cat: CategoryScore) => (
              <CategoryCard key={cat.name} category={cat} />
            ))}
          </div>

          <div className="score-cta card">
            <div className="card-content" style={{ textAlign: 'center' }}>
              <h2>Monitor {result.domain} 24/7</h2>
              <p>
                Get instant alerts when your site goes down. Monitor uptime, SSL, DNS,
                and performance continuously with Uptrue.
              </p>
              <Link href="/signup" className="btn btn-primary" style={{ marginTop: '16px' }}>
                Start free monitoring
              </Link>
            </div>
          </div>
        </>
      )}

      <div className="score-recheck">
        <h3>Check another website</h3>
        <ScoreForm />
      </div>

      <div className="score-disclaimer">
        <p>
          This score is generated automatically by scanning publicly available data. It is
          provided for informational purposes only and does not constitute professional security
          advice. Results may vary between scans due to network conditions, caching, and server
          configuration. Uptrue is not responsible for any decisions made based on this score.
        </p>
      </div>

      </div>

      <PublicFooter />
    </div>
  )
}
