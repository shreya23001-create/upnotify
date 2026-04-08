'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function PublicNav(): React.ReactElement {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => { subscription.unsubscribe() }
  }, [])

  return (
    <nav className="pub-nav">
      <div className="pub-nav-inner">
        <Link href="/" className="nav-logo" aria-label="Uptrue home">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" height="28" aria-hidden="true">
            <defs>
              <linearGradient id="navG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6"/>
                <stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
            </defs>
            <path d="M20 6 L36 12 L36 24 C36 32 28 38 20 42 C12 38 4 32 4 24 L4 12 Z" fill="url(#navG)"/>
            <text x="10" y="30" fontFamily="system-ui,-apple-system,sans-serif" fontSize="16" fontWeight="800" fill="white" letterSpacing="0.5">
              <tspan dy="0">U</tspan><tspan dy="-5">p</tspan>
            </text>
            <text x="46" y="34" fontFamily="system-ui,-apple-system,sans-serif" fontSize="28" fontWeight="700" fill="#0f172a" letterSpacing="-0.5">Uptrue</text>
          </svg>
        </Link>

        <ul className="nav-links">
          <li><Link href="/#features">Features</Link></li>
          <li><Link href="/#pricing">Pricing</Link></li>
          <li>
            <Link href="/score">
              Score <span className="nav-badge">Free</span>
            </Link>
          </li>
          <li>
            <Link href="/tracker">
              Tracker <span className="nav-badge">Free</span>
            </Link>
          </li>
          <li>
            <Link href="/tools">
              Tools <span className="nav-badge">Free</span>
            </Link>
          </li>
          <li><Link href="/compete">Compete</Link></li>
          <li><Link href="/blog">Blog</Link></li>
        </ul>

        <div className="nav-actions">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Start Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
