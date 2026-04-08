'use client'

import { useEffect, useRef, useState } from 'react'
import { DowntimeCalculatorCard } from './downtime-calculator'

const SESSION_KEY = 'uptrue_calc_popup_seen'

export function DowntimeCalculatorPopup(): React.ReactElement {
  const [isPopup, setIsPopup] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsPopup(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Lock / unlock body scroll
  useEffect(() => {
    if (isPopup) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isPopup])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setIsPopup(false)
  }

  return (
    <section className="calculator-section">
      <div className="container">

        {/* Section header — always visible on page */}
        <div className="section-header">
          <div className="section-eyebrow" style={{ color: '#ef4444' }}>The real cost of downtime</div>
          <h2 className="section-title">It&apos;s not just lost revenue.<br />It&apos;s your reputation.</h2>
          <p className="section-sub">
            Every minute your site is down, customers are leaving, telling friends, and never coming back.
            Calculate the true cost — including what you can&apos;t see on a balance sheet.
          </p>
        </div>

        {/* Sentinel — triggers popup when header scrolls into view */}
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

        {/* Popup — card floats above page */}
        {isPopup && (
          <div className="calc-popup-backdrop" onClick={dismiss}>
            <div className="calc-popup-panel" onClick={e => e.stopPropagation()}>
              <DowntimeCalculatorCard onClose={dismiss} />
            </div>
          </div>
        )}

        {/* Inline card — always rendered so no layout shift after dismiss */}
        <div style={{ visibility: isPopup ? 'hidden' : 'visible' }}>
          <DowntimeCalculatorCard />
        </div>

      </div>
    </section>
  )
}
