'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { AuthCanvas } from './auth-canvas'
import type { SupportedCurrency } from '@/lib/utils/currency'

function buildScenes(currency: SupportedCurrency) {
  const starterPrice = currency === 'inr' ? '₹999/yr' : '£10/yr'
  return [
    { title: 'Your monitors are watching.', sub: 'We check every 30 seconds, around the clock.' },
    { title: 'Add your first monitor.', sub: 'We check every 30 seconds from multiple regions.' },
    { title: 'Something goes wrong at 2:47am.', sub: "You're alerted instantly. Before your customers." },
    { title: 'You fix it. Nobody noticed.', sub: 'Your status page kept customers calm.' },
    { title: 'Most teams outgrow 3 monitors in a week.', sub: `Starter is ${starterPrice}. Cancel any time.` },
  ]
}

interface AuthLeftPanelProps {
  currency?: SupportedCurrency
}

export function AuthLeftPanel({ currency = 'gbp' }: AuthLeftPanelProps): React.ReactElement {
  const SCENES = buildScenes(currency)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [caption, setCaption] = useState(SCENES[0])

  const handleSceneChange = useCallback((title: string, sub: string) => {
    const idx = SCENES.findIndex(s => s.title === title)
    if (idx >= 0) setSceneIdx(idx)
    setCaption({ title, sub })
  }, [])

  return (
    <div className="auth-left">
      <AuthCanvas onSceneChange={handleSceneChange} />

      {/* Logo — matches public nav */}
      <Link href="/" className="auth-left-logo" aria-label="Upnotify home">
        <img src="/Logo_1.png" alt="Upnotify" height={28} style={{ height: 28, width: 'auto' }} />
      </Link>

      {/* Decorative background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{
          position: 'absolute', width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        }} />
      </div>

      {/* Caption */}
      <div className="auth-caption">
        <div className="auth-caption-title" style={{ transition: 'opacity 0.3s' }}>{caption.title}</div>
        <div className="auth-caption-sub">{caption.sub}</div>
      </div>

      {/* Scene dots */}
      <div className="auth-scene-dots">
        {SCENES.map((_, i) => (
          <div key={i} className={`auth-scene-dot${i === sceneIdx ? ' active' : ''}`} />
        ))}
      </div>

      {/* Proof bar */}
      <div className="auth-proof">
        <span className="auth-proof-item">
          <span className="auth-proof-dot" />
          2,800+ checks per minute
        </span>
        <span className="auth-proof-item">EU data · GDPR</span>
        <span className="auth-proof-item">99.97% accuracy</span>
      </div>
    </div>
  )
}
