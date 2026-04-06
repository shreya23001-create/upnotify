'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UptrueLogo } from '@/components/ui/uptrue-logo'
import { createClient } from '@/lib/supabase/client'

/**
 * PublicNav — consistent navigation for all public pages.
 * Layout: logo LEFT, nav links CENTER, login/signup RIGHT.
 * Shows "Dashboard" for authenticated users, "Log in / Start Free" for guests.
 */
export function PublicNav(): React.ReactElement {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    const supabase = createClient()
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
    // Listen for auth state changes (login/logout while page is open)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => { subscription.unsubscribe() }
  }, [])

  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-logo" aria-label="Uptrue home">
          <UptrueLogo />
        </Link>
        <div className="landing-nav-links">
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/score">Score <sup className="nav-free-tag">Free</sup></Link>
          <Link href="/tracker">Tracker <sup className="nav-free-tag">Free</sup></Link>
          <Link href="/tools">Tools <sup className="nav-free-tag">Free</sup></Link>
          <Link href="/compete">Compete</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/blog">Blog</Link>
        </div>
        <div className="landing-nav-actions">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
              <Link href="/signup" className="btn btn-primary">Start Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
