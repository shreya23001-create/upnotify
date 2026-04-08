'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

function fmt(n: number): string {
  return '£' + Math.round(n).toLocaleString('en-GB')
}

export function DowntimeCalculator(): React.ReactElement {
  const [revenue, setRevenue] = useState(50000)
  const [hours, setHours] = useState(2)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.classList.add('buzz')
          card.addEventListener('animationend', () => card.classList.remove('buzz'), { once: true })
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  const calc = useCallback(() => {
    const hourlyRevenue = revenue / (30 * 24)
    const revLoss = hourlyRevenue * hours
    const churn = revLoss * 0.4          // 5% churn × £200 LTV proxy
    const rep = revLoss * 0.6            // Forrester reputation multiplier
    const total = revLoss + churn + rep
    const yearly = total * 12
    const proMonthly = 49
    const payback = Math.round(yearly / proMonthly)
    return { revLoss, churn, rep, total, yearly, payback }
  }, [revenue, hours])

  const { revLoss, churn, rep, total, yearly, payback } = calc()

  const sliderLabel = hours === 1 ? '1 hour' : `${hours} hours`

  return (
    <section className="calculator-section">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow" style={{ color: '#ef4444' }}>The real cost of downtime</div>
          <h2 className="section-title">It&apos;s not just lost revenue.<br />It&apos;s your reputation.</h2>
          <p className="section-sub">
            Every minute your site is down, customers are leaving, telling friends, and never coming back.
            Calculate the true cost — including what you can&apos;t see on a balance sheet.
          </p>
        </div>

        <div className="calculator-card" ref={cardRef}>
          {/* Fear callout */}
          <div className="calc-fear-intro">
            <div className="calc-fear-icon">⚠️</div>
            <div className="calc-fear-text">
              <strong>88% of users are less likely to return</strong> after downtime.
              For every £1 of visible revenue loss, research shows an additional £1.40 in hidden costs from churn and brand damage.
              Only 8% of outages are detected by the business before a customer notices.
              {' '}<span style={{ color: '#ef4444', fontWeight: 600 }}>Are you in the 8%?</span>
            </div>
          </div>

          {/* Inputs */}
          <div className="calculator-inputs-row">
            <div>
              <div className="calculator-label">Your monthly revenue (£)</div>
              <div className="calculator-input-wrap">
                <span className="calculator-prefix">£</span>
                <input
                  type="number"
                  className="calculator-input"
                  value={revenue}
                  min={1000}
                  max={10000000}
                  onChange={e => setRevenue(Math.max(1000, Number(e.target.value) || 1000))}
                />
              </div>
            </div>
            <div>
              <div className="calculator-label">
                Average downtime per month —{' '}
                <span style={{ fontWeight: 800, color: '#ef4444' }}>{sliderLabel}</span>
              </div>
              <div style={{ paddingTop: 10 }}>
                <input
                  type="range"
                  className="calculator-slider"
                  min={0}
                  max={24}
                  step={0.5}
                  value={hours}
                  onChange={e => setHours(Number(e.target.value))}
                  style={{ width: '100%', '--pct': `${(hours / 24) * 100}%` } as React.CSSProperties}
                />
                <div className="calculator-slider-label">
                  <span>0 hrs</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Industry avg: 3–7 hrs/month</span>
                  <span>24 hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="calculator-breakdown-row">
            <div className="calc-row revenue">
              <div className="calc-row-header">
                <span className="calc-row-icon">💰</span>
                <span className="calc-row-label">Revenue loss</span>
              </div>
              <div className="calc-row-value">{fmt(revLoss)}</div>
              <small className="calc-row-note">Revenue per hour × hours down</small>
            </div>

            <div className="calc-row churn">
              <div className="calc-row-header">
                <span className="calc-row-icon">👤</span>
                <span className="calc-row-label">Customer churn</span>
              </div>
              <div className="calc-row-value">{fmt(churn)}</div>
              <small className="calc-row-note">5% churn × £200 avg LTV</small>
            </div>

            <div className="calc-row rep">
              <div className="calc-row-header">
                <span className="calc-row-icon">📉</span>
                <span className="calc-row-label">Reputation damage</span>
              </div>
              <div className="calc-row-value">{fmt(rep)}</div>
              <small className="calc-row-note">Forrester trust multiplier</small>
            </div>

            <div className="calc-row total">
              <div className="calc-row-header">
                <span className="calc-row-icon">🔴</span>
                <span className="calc-row-label" style={{ color: '#ef4444' }}>Total impact</span>
              </div>
              <div className="calc-row-value" style={{ fontSize: 28 }}>{fmt(total)}</div>
              <small className="calc-row-note">per incident</small>
            </div>
          </div>

          {/* Yearly + CTA */}
          <div className="calc-bottom-row">
            <div className="calc-yearly-banner">
              <strong>{fmt(yearly)}</strong>
              {' '}you&apos;re risking every year — from just <span>{sliderLabel}</span> of downtime per month
            </div>
            <div className="calc-cta-col">
              <Link
                href="/signup"
                className="btn btn-lg"
                style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Start Protecting Revenue Free
              </Link>
              <p className="calc-note">
                One prevented outage = <strong>{payback}</strong> months of Uptrue Pro covered.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="calc-disclaimer">
            <strong>Disclaimer:</strong> Figures are indicative estimates based on published industry research, including Forrester Research, Gartner, and PwC studies on the economic impact of downtime. Customer churn assumes a 5% churn rate among affected users and an average £200 customer lifetime value. Reputation damage is estimated at 60% of direct revenue loss. Results vary by industry, business model, and circumstances. Uptrue accepts no liability for decisions made based on these estimates. Not for use in financial planning, insurance, or legal claims.
          </div>
        </div>
      </div>
    </section>
  )
}
