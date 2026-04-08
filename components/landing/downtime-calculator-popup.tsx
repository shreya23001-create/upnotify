'use client'

import { useEffect, useRef, useState } from 'react'
import { DowntimeCalculator } from './downtime-calculator'

const SESSION_KEY = 'uptrue_calc_popup_seen'

export function DowntimeCalculatorPopup(): React.ReactElement {
  const [mode, setMode] = useState<'idle' | 'popup' | 'inline'>('idle')
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Already seen this session — go straight to inline
    if (sessionStorage.getItem(SESSION_KEY)) {
      setMode('inline')
      return
    }

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMode('popup')
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setMode('inline')
  }

  return (
    <>
      {/* Sentinel — sits at the top of where the calculator section is */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

      {/* Backdrop + popup */}
      {mode === 'popup' && (
        <div className="calc-popup-backdrop" onClick={dismiss}>
          <div
            className="calc-popup-panel"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="calc-popup-close"
              onClick={dismiss}
              aria-label="Close calculator"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <DowntimeCalculator />
          </div>
        </div>
      )}

      {/* Inline — normal page position after dismiss */}
      {mode === 'inline' && <DowntimeCalculator />}
    </>
  )
}
