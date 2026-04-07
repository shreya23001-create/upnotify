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
          <div className="nav-logo-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          Uptrue
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
