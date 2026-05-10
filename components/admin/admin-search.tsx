'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchItem {
  href: string
  label: string
  group: string
  keywords: string
}

const SEARCH_INDEX: SearchItem[] = [
  // Overview
  { href: '/admin', label: 'Dashboard', group: 'Overview', keywords: 'dashboard home overview' },
  // People
  { href: '/admin/users', label: 'Users', group: 'People', keywords: 'users accounts signups customers' },
  { href: '/admin/organisations', label: 'Organisations', group: 'People', keywords: 'organisations orgs teams companies' },
  { href: '/admin/agency-waitlist', label: 'Agency Waitlist', group: 'People', keywords: 'agency waitlist partners' },
  { href: '/admin/user360', label: 'User 360', group: 'People', keywords: 'user 360 profile detail' },
  // Billing
  { href: '/admin/plans', label: 'Plans & Pricing', group: 'Billing', keywords: 'plans pricing billing stripe razorpay lite builder scale free' },
  { href: '/admin/revenue', label: 'Revenue', group: 'Billing', keywords: 'revenue income mrr arr stripe' },
  { href: '/admin/revenue/entities', label: 'Vision vs Crozent', group: 'Billing', keywords: 'vision crozent entities revenue split' },
  { href: '/admin/credits', label: 'Credit Approvals', group: 'Billing', keywords: 'credits approvals community referral' },
  // Product
  { href: '/admin/tracker', label: 'Public Tracker', group: 'Product', keywords: 'tracker public sites monitoring uptime' },
  { href: '/admin/feature-flags', label: 'Feature Flags', group: 'Product', keywords: 'feature flags toggles enable disable' },
  { href: '/admin/ai-engines', label: 'AI Engines', group: 'Product', keywords: 'ai engines keys api chatgpt perplexity claude gemini' },
  { href: '/admin/ai-profile-prompts', label: 'AI Profile Prompts', group: 'Product', keywords: 'ai profile prompts introspection visibility questions' },
  // Content
  { href: '/admin/blog', label: 'Blog', group: 'Content', keywords: 'blog posts content articles outage' },
  { href: '/admin/aoe', label: 'AOE Outreach', group: 'Content', keywords: 'aoe outreach ssl email automated campaigns' },
  { href: '/admin/emails', label: 'Email & Nurture', group: 'Content', keywords: 'email nurture onboarding sequences resend' },
  { href: '/admin/messages', label: 'Messages', group: 'Content', keywords: 'messages notifications in-app banners' },
  // System
  { href: '/admin/system', label: 'System Health', group: 'System', keywords: 'system health crons jobs status checks' },
  { href: '/admin/audit-log', label: 'Audit Log', group: 'System', keywords: 'audit log history actions events' },
  { href: '/admin/team', label: 'Admin Team', group: 'System', keywords: 'admin team roles permissions sub-admin' },
  { href: '/admin/settings', label: 'Settings', group: 'System', keywords: 'settings config environment live test mode' },
  { href: '/admin/support', label: 'Support', group: 'System', keywords: 'support tickets help requests' },
]

function highlight(text: string, query: string): React.ReactElement {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#fef08a', color: '#000', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function AdminSearch(): React.ReactElement {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const results = query.trim().length > 0
    ? SEARCH_INDEX.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  const navigate = useCallback((href: string) => {
    router.push(href)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }, [router])

  useEffect(() => {
    setFocused(0)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global keyboard shortcut: / to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); if (results[focused]) navigate(results[focused].href) }
    if (e.key === 'Escape')    { setOpen(false); setQuery('') }
  }

  return (
    <div className="admin-search-wrapper">
      <div className="admin-search-input-row">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="admin-search-icon">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="admin-search-input"
          placeholder="Search admin… ( / )"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && (
          <button className="admin-search-clear" onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}>✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div ref={dropdownRef} className="admin-search-dropdown">
          {results.map((item, i) => (
            <button
              key={item.href}
              className={`admin-search-result${i === focused ? ' admin-search-result-focused' : ''}`}
              onMouseEnter={() => setFocused(i)}
              onClick={() => navigate(item.href)}
            >
              <span className="admin-search-result-group">{item.group}</span>
              <span className="admin-search-result-label">{highlight(item.label, query)}</span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim().length > 0 && results.length === 0 && (
        <div ref={dropdownRef} className="admin-search-dropdown">
          <div className="admin-search-empty">No results for &ldquo;{query}&rdquo;</div>
        </div>
      )}
    </div>
  )
}
