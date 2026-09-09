'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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
        <Link href="/" className="nav-logo" aria-label="Upnotify home" onClick={close}>
          <img src="/Logo_2.png" alt="Upnotify" height={28} style={{ height: 28, width: 'auto' }} />
        </Link>

        <ul className="nav-links">
          {links.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <li key={link.href}>
                <Link href={link.href} className={isActive ? 'active' : undefined}>
                  {link.label}
                  {link.badge && <span className="nav-badge">{link.badge}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="nav-actions">
          <ThemeToggle />
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
          {mobileOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
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
              <div className="nav-mobile-cta-row">
                <ThemeToggle />
                <Link href="/dashboard" className="btn btn-primary" onClick={close}>Dashboard</Link>
              </div>
            ) : (
              <>
                <div className="nav-mobile-cta-row">
                  <ThemeToggle />
                  <Link href={primaryHref} className="btn btn-primary" onClick={close}>{primaryText}</Link>
                </div>
                <Link href={secondaryHref} className="btn btn-ghost" onClick={close} style={{ display: 'block', textAlign: 'center' }}>{secondaryText}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
