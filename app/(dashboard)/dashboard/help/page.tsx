'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HelpSidebar, helpTopics } from './help-sidebar'

export default function HelpIndexPage() {
  const [search, setSearch] = useState('')
  const pathname = usePathname()

  const filtered = helpTopics.filter((topic) => {
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
          <h1 className="page-title">Help Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginTop: 8, marginBottom: 24 }}>
            Everything you need to know about monitoring your websites with Uptrue.
          </p>
          <input
            type="text"
            className="form-input help-search"
            placeholder="Search help articles... (e.g. monitors, alerts, billing)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search help articles"
          />
        </div>

        <div className="help-topics-grid">
          {filtered.map((topic) => (
            <Link key={topic.href} href={topic.href} className="card card-link help-topic-card">
              <div className="card-content">
                <div className="help-topic-icon">{topic.icon}</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                  {topic.title}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {topic.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">?</div>
            <h3>No results found</h3>
            <p>Try a different search term, or browse the topics in the sidebar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
