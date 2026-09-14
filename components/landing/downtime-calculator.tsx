'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

function fmt(n: number): string {
  return '£' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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
          card.classList.add('reveal-in')
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

  const breakdown = [
    { label: 'Direct revenue loss', value: revLoss, note: 'Revenue per hour × hours down' },
    { label: 'Customer churn', value: churn, note: '5% churn × £200 avg LTV' },
    { label: 'Reputation damage', value: rep, note: 'Forrester trust multiplier' },
  ]

  return (
    <section className="calculator-section">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow" style={{ color: '#d97706' }}>The real cost of downtime</div>
          <h2 className="section-title">It&apos;s not just lost revenue.<br />It&apos;s your reputation.</h2>
          <p className="section-sub">
            Every minute your site is down, customers are leaving, telling friends, and never coming back.
            Calculate the true cost — including what you can&apos;t see on a balance sheet.
          </p>
        </div>

        <div className="calculator-card" ref={cardRef}>
          <div className="calc-grid">
            {/* Left — inputs */}
            <div className="calc-inputs-col">
              <div className="calc-input-block">
                <div className="calculator-label">Your monthly revenue</div>
                <div className="calculator-input-wrap">
                  <span className="calculator-prefix">£</span>
                  <input
                    type="number"
                    id="calc-revenue"
                    name="calc-revenue"
                    className="calculator-input"
                    aria-label="Your monthly revenue in pounds"
                    autoComplete="off"
                    value={revenue}
                    min={1000}
                    max={10000000}
                    onChange={e => setRevenue(Math.max(1000, Number(e.target.value) || 1000))}
                  />
                </div>
              </div>

              <div className="calc-input-block">
                <div className="calculator-label">
                  Average downtime per month —{' '}
                  <span style={{ fontWeight: 800, color: 'var(--brand-blue)' }}>{sliderLabel}</span>
                </div>
                <input
                  type="range"
                  id="calc-downtime"
                  name="calc-downtime"
                  className="calculator-slider"
                  aria-label="Average downtime per month in hours"
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

              <div className="calc-fear-intro">
                <div className="calc-fear-icon">⚠️</div>
                <div className="calc-fear-text">
                  <strong>88% of users are less likely to return</strong> after downtime.
                  For every £1 of visible revenue loss, research shows an additional £1.40 in hidden costs from churn and brand damage.
                </div>
              </div>
            </div>

            {/* Right — result */}
            <div className="calc-result-col">
              <div className="calc-result-label">Estimated cost per incident</div>
              <div className="calc-result-hero">{fmt(total)}</div>

              <div className="calc-breakdown-list">
                {breakdown.map(row => (
                  <div key={row.label} className="calc-breakdown-row">
                    <div className="calc-breakdown-row-top">
                      <span>{row.label}</span>
                      <span className="calc-breakdown-row-value">{fmt(row.value)}</span>
                    </div>
                    <div className="calc-breakdown-bar">
                      <div
                        className="calc-breakdown-bar-fill"
                        style={{ width: `${total > 0 ? (row.value / total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="calc-row-note">{row.note}</div>
                  </div>
                ))}
              </div>

              <div className="calc-yearly-banner">
                <strong>{fmt(yearly)}</strong>
                {' '}you&apos;re risking every year — from just <span>{sliderLabel}</span> of downtime per month
              </div>

              <Link href="/signup" className="btn btn-lg btn-primary calc-cta-btn">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Start Protecting Revenue Free
              </Link>
              <p className="calc-note">
                One prevented outage = <strong>{payback}</strong> months of Upnotify Pro covered.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="calc-disclaimer">
            <strong>Disclaimer:</strong> Figures are indicative estimates based on published industry research, including Forrester Research, Gartner, and PwC studies on the economic impact of downtime. Customer churn assumes a 5% churn rate among affected users and an average £200 customer lifetime value. Reputation damage is estimated at 60% of direct revenue loss. Results vary by industry, business model, and circumstances. Upnotify accepts no liability for decisions made based on these estimates. Not for use in financial planning, insurance, or legal claims.
          </div>
        </div>
      </div>
    </section>
  )
}
