'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HelpSidebar, helpTopics, WordPressIcon } from './help-sidebar'

export default function HelpIndexPage(): React.ReactElement {
  const [search, setSearch] = useState('')
  const pathname = usePathname()

  const userTopics = helpTopics.filter((topic) => !topic.adminOnly)
  const filtered = userTopics.filter((topic) => {
    const q = search.toLowerCase()
    return (
      topic.title.toLowerCase().includes(q) ||
      topic.description.toLowerCase().includes(q) ||
      topic.keywords.some((k) => k.includes(q))
    )
  })

  const POPULAR_TOPICS = new Set(['/dashboard/help/getting-started', '/dashboard/help/monitors'])
  const NEW_TOPICS = new Set(['/dashboard/help/ai-visibility'])

  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">

        {/* ── Hero ── */}
        <div className="help-hero">
          <div className="help-hero-cluster" aria-hidden="true">
            <div className="help-hero-cluster-icon help-hero-cluster-icon--1">
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div className="help-hero-cluster-icon help-hero-cluster-icon--2">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="help-hero-cluster-icon help-hero-cluster-icon--3">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
          </div>
          <div className="help-hero-body">
            <div className="help-hero-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h1 className="help-hero-title">Help Center</h1>
              <p className="help-hero-sub">Everything you need to get the most out of Upnotify.</p>
            </div>
          </div>
          <div className="help-search-wrap">
            <svg className="help-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="form-input help-search"
              placeholder="Search articles… monitors, alerts, billing"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search help articles"
            />
            {search && (
              <button className="help-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Topics grid ── */}
        {filtered.length > 0 && (
          <div className="help-topics-grid">
            {filtered.map((topic, i) => (
              <Link key={topic.href} href={topic.href} className="help-topic-card" style={{ animationDelay: `${i * 35}ms` }}>
                {POPULAR_TOPICS.has(topic.href) && <span className="help-topic-badge help-topic-badge--popular">Popular</span>}
                {NEW_TOPICS.has(topic.href) && <span className="help-topic-badge help-topic-badge--new">New</span>}
                <div className="help-topic-icon-wrap">
                  {topic.icon === '__wp__' ? <WordPressIcon size={20} /> : topic.icon}
                </div>
                <div className="help-topic-body">
                  <h2 className="help-topic-title">{topic.title}</h2>
                  <p className="help-topic-desc">{topic.description}</p>
                </div>
                <span className="help-topic-arrow">
                  Read more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </Link>
            ))}

            <Link href="/dashboard/support" className="help-topic-card help-topic-card-support" style={{ animationDelay: `${filtered.length * 35}ms` }}>
              <div className="help-topic-icon-wrap">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="help-topic-body">
                <h2 className="help-topic-title">Contact Support</h2>
                <p className="help-topic-desc">Can&rsquo;t find your answer? Open a ticket and we&rsquo;ll get back to you.</p>
              </div>
              <span className="help-topic-arrow">
                Read more
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            </Link>
          </div>
        )}

        {/* ── Footer CTA ── */}
        {filtered.length > 0 && (
          <div className="help-footer-cta">
            <div>
              <h3 className="help-footer-cta-title">Still need help?</h3>
              <p className="help-footer-cta-sub">Our team typically replies within a few hours.</p>
            </div>
            <Link href="/dashboard/support" className="btn btn-primary help-footer-cta-btn">
              Contact Support
            </Link>
          </div>
        )}

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="help-empty">
            <div className="help-empty-icon">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3 className="help-empty-title">No results for &ldquo;{search}&rdquo;</h3>
            <p className="help-empty-sub">Try a different search term, or <Link href="/dashboard/support" style={{ color: 'var(--accent)' }}>contact support</Link>.</p>
          </div>
        )}

      </div>
    </div>
  )
}
