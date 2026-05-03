/**
 * /score — Public input page for Uptrue Score.
 * Server component with a client-side form that redirects to /score/[domain].
 */

import type { Metadata } from 'next'
import { ScoreForm } from '@/components/score/score-form'

export const metadata: Metadata = {
  title: 'Free Website Health Score',
  description:
    'Check your website health for free. Uptrue Score analyses uptime, SSL, DNS, security headers, and performance — giving you an instant grade from A+ to F.',
  alternates: { canonical: 'https://uptrue.io/score' },
}

export default function ScorePage(): React.ReactElement {
  return (
    <div className="score-hero">
      

      <div className="score-hero-content">
        <div className="score-hero-badge">Free tool</div>
        <h1 className="score-hero-title">
          Website Health Score
        </h1>
        <p className="score-hero-subtitle">
          Get an instant health check across 5 categories: uptime, SSL, DNS,
          security headers, and performance. No signup required.
        </p>

        <ScoreForm />

        <div className="score-features-row">
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            Uptime
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            SSL
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            DNS
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Security
          </div>
          <div className="score-feature-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Performance
          </div>
        </div>
      </div>

      
    </div>
  )
}
