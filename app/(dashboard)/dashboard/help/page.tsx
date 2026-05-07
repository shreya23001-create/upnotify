'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HelpSidebar, helpTopics, WordPressIcon } from './help-sidebar'

export default function HelpIndexPage(): React.ReactElement {
  const [search, setSearch] = useState('')
  const pathname = usePathname()

  // Filter out admin-only topics for regular users, then apply search
  const userTopics = helpTopics.filter((topic) => !topic.adminOnly)
  const filtered = userTopics.filter((topic) => {
    const q = search.toLowerCase()
    return (
      topic.title.toLowerCase().includes(q) ||
      topic.description.toLowerCase().includes(q) ||
      topic.keywords.some((k) => k.includes(q))
    )
  })

  return (
    <div className="help-layout">
      <HelpSidebar currentPath={pathname} />
      <div className="help-main">
        <div className="help-hero">
          <h1 className="db-page-title">Help Center</h1>
          <p className="help-hero-sub">
            Everything you need to know about monitoring your websites with Uptrue.
          </p>
          <div className="help-search-wrap">
            <svg className="help-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-input help-search"
              placeholder="Search articles… monitors, alerts, billing"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search help articles"
            />
          </div>
        </div>

        <div className="help-topics-grid">
          {filtered.map((topic) => (
            <Link key={topic.href} href={topic.href} className="card help-topic-card">
              <div className="help-topic-icon-wrap">
                {topic.icon === '__wp__' ? <WordPressIcon size={24} /> : topic.icon}
              </div>
              <h2 className="help-topic-title">{topic.title}</h2>
              <p className="help-topic-desc">{topic.description}</p>
              <span className="help-topic-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          ))}

          {filtered.length > 0 && (
            <Link href="/dashboard/support" className="card help-topic-card">
              <div className="help-topic-icon-wrap">🎧</div>
              <h2 className="help-topic-title">Contact Support</h2>
              <p className="help-topic-desc">Can&rsquo;t find your answer? Open a ticket and we&rsquo;ll get back to you.</p>
              <span className="help-topic-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No results for &ldquo;{search}&rdquo;</h3>
            <p>Try a different search term, or <Link href="/dashboard/support" style={{ color: 'var(--accent)' }}>contact support</Link>.</p>
          </div>
        )}
      </div>
    </div>
  )
}
