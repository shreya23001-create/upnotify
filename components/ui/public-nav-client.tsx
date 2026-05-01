'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { NavContent } from '@/lib/types/cms'

interface PublicNavClientProps {
  links:        NavContent['links']
  ctaPrimary?:  NavContent['cta_primary']
  ctaSecondary?: NavContent['cta_secondary']
}

export function PublicNavClient({ links, ctaPrimary, ctaSecondary }: PublicNavClientProps): React.ReactElement {
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

  useEffect(() => { setMobileOpen(false) }, [pathname])

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

  const primaryHref   = ctaPrimary?.href   ?? '/signup'
  const primaryText   = ctaPrimary?.text   ?? 'Start Free'
  const secondaryHref = ctaSecondary?.href ?? '/login'
  const secondaryText = ctaSecondary?.text ?? 'Log in'

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
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>
                {link.label}
                {link.badge && <span className="nav-badge">{link.badge}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <>
              <Link href={secondaryHref} className="btn btn-ghost btn-sm">{secondaryText}</Link>
              <Link href={primaryHref}   className="btn btn-primary btn-sm">{primaryText}</Link>
            </>
          )}
        </div>

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

      {mobileOpen && (
        <div className="nav-mobile-menu">
          <ul className="nav-mobile-links">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close}>
                  {link.label}
                  {link.badge && <span className="nav-badge">{link.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav-mobile-cta">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary" onClick={close} style={{ display: 'block', textAlign: 'center' }}>Dashboard</Link>
            ) : (
              <>
                <Link href={secondaryHref} className="btn btn-ghost" onClick={close} style={{ display: 'block', textAlign: 'center' }}>{secondaryText}</Link>
                <Link href={primaryHref}   className="btn btn-primary" onClick={close} style={{ display: 'block', textAlign: 'center' }}>{primaryText}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
