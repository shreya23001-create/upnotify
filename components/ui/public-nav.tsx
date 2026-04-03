'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UptrueLogo } from '@/components/ui/uptrue-logo'

/**
 * PublicNav — consistent navigation for all public pages.
 * Layout: logo LEFT, nav links CENTER, login/signup RIGHT.
 * Client component so it can detect auth state via Supabase cookies
 * and show "Dashboard" instead of "Log in / Start Free" for logged-in users.
 */
export function PublicNav(): React.ReactElement {
  const [isLoggedIn] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.cookie.split(';').some(
      (c: string) => c.trim().startsWith('sb-') && c.includes('auth-token')
    )
  })

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
