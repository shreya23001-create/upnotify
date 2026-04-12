'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function PublicNav(): React.ReactElement {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()

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

  // Close menu on route change — layout doesn't remount between navigations
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close menu when window resizes to desktop width
  useEffect(() => {
    function handleResize(): void {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    if (mobileOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileOpen])

  function close(): void { setMobileOpen(false) }

  return (
    <nav className="pub-nav" ref={navRef}>
      <div className="pub-nav-inner">
        <Link href="/" className="nav-logo" aria-label="Uptrue home" onClick={close}>
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
          <li><Link href="/score">Score <span className="nav-badge">Free</span></Link></li>
          <li><Link href="/tracker">Tracker <span className="nav-badge">Free</span></Link></li>
          <li><Link href="/tools/ai-seo-checker">AI SEO <span className="nav-badge">Free</span></Link></li>
          <li><Link href="/tools">Tools <span className="nav-badge">Free</span></Link></li>
          <li><Link href="/blog">Blog</Link></li>
        </ul>

        <div className="nav-actions">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Start Free</Link>
            </>
          )}
        </div>

        {/* Hamburger — visible only on mobile */}
        <button
          className="nav-hamburger"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="nav-mobile-menu">
          <ul className="nav-mobile-links">
            <li><Link href="/#features" onClick={close}>Features</Link></li>
            <li><Link href="/#pricing" onClick={close}>Pricing</Link></li>
            <li><Link href="/score" onClick={close}>Score <span className="nav-badge">Free</span></Link></li>
            <li><Link href="/tracker" onClick={close}>Tracker <span className="nav-badge">Free</span></Link></li>
            <li><Link href="/tools/ai-seo-checker" onClick={close}>AI SEO Checker <span className="nav-badge">Free</span></Link></li>
            <li><Link href="/tools" onClick={close}>Tools <span className="nav-badge">Free</span></Link></li>
            <li><Link href="/blog" onClick={close}>Blog</Link></li>
          </ul>
          <div className="nav-mobile-cta">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary" onClick={close} style={{ display: 'block', textAlign: 'center' }}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost" onClick={close} style={{ display: 'block', textAlign: 'center' }}>Log in</Link>
                <Link href="/signup" className="btn btn-primary" onClick={close} style={{ display: 'block', textAlign: 'center' }}>Start Free</Link>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
