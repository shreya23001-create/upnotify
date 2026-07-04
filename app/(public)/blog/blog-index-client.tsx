'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { Search } from 'lucide-react'
import type { UnifiedPost } from './page'
import { BlogCardImage } from '@/components/ui/blog-card-image'
import { ScrollReveal } from '@/components/landing/scroll-reveal'

const POSTS_PER_PAGE = 12

const FILTER_TABS = ['All posts', 'Guide', 'WordPress', 'Security', 'Performance', 'Ecommerce', 'Hosting', 'Incident Report', 'Agency', 'AI Tools']

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Guide: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
  WordPress: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  Security: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  Performance: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  Ecommerce: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  Hosting: { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.2)' },
  'Incident Report': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  Agency: { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: 'rgba(6,182,212,0.2)' },
  'AI Tools': { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
}

function badgeStyle(cat: string) {
  return BADGE_STYLES[cat] ?? BADGE_STYLES['AI Tools'] ?? { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' }
}

// Normalise category for matching — handles "ai-tools", "AI Tools", "ai tools" all the same
function normCat(cat: string): string {
  return cat.toLowerCase().replace(/[\s-_]/g, '')
}


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function BlogIndexContent({ posts }: { posts: UnifiedPost[] }) {
  const [activeTab, setActiveTab] = useState('All posts')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const [subEmail, setSubEmail] = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [subMsg, setSubMsg] = useState('')

  const catFilter = activeTab === 'All posts' ? null : activeTab

  const filtered = posts.filter(p => {
    const matchesCat = !catFilter || normCat(p.category) === normCat(catFilter)
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  const featuredPost = filtered[0]
  const remainingPosts = filtered.slice(1)
  const pagePosts = remainingPosts.slice(0, visibleCount)
  const hasMore = visibleCount < remainingPosts.length

  function loadMore() {
    setVisibleCount(c => c + POSTS_PER_PAGE)
  }

  function switchTab(tab: string) {
    setActiveTab(tab)
    setVisibleCount(POSTS_PER_PAGE)
  }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = subEmail.trim()
    if (!trimmed) { setSubStatus('error'); setSubMsg('Email address is required.'); return }
    if (!EMAIL_RE.test(trimmed)) { setSubStatus('error'); setSubMsg('Please enter a valid email address.'); return }
    setSubStatus('loading')
    try {
      const res = await fetch('/api/v1/blog/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'blog-index' }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.success) {
        setSubStatus('success')
        setSubMsg("You're subscribed! We'll email you when new articles are published.")
        setSubEmail('')
      } else {
        setSubStatus('error')
        setSubMsg(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setSubStatus('error')
      setSubMsg('Network error. Please try again.')
    }
  }

  return (
    <div className="blog-page">
      <ScrollReveal />

      {/* Hero */}
      <div className="blog-hero">
        <div className="container" style={{ maxWidth: 1080, padding: '0 24px', margin: '0 auto' }}>
          <div className="blog-hero-inner reveal-title">
            <div className="blog-hero-eyebrow">Uptrue Blog</div>
            <h1>Uptime, monitoring &amp;<br />reliability insights</h1>
            <p className="blog-hero-sub">
              Practical guides, incident reports, and deep dives for developers and agencies who care about keeping sites up.
            </p>
            <div className="blog-search-wrap">
              <div className="blog-search-icon-wrap">
                <svg className="blog-search-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="blog-search"
                  type="text"
                  placeholder="Search articles…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, padding: '0 24px', margin: '0 auto' }}>

        {/* Featured post */}
        {featuredPost && (
          <div className="blog-featured-wrap reveal">
            <div className="blog-featured-label">Featured</div>
            <Link href={`/blog/${featuredPost.slug}`} className="blog-featured-card">
              <div className="blog-featured-img">
                <BlogCardImage category={featuredPost.category} title={featuredPost.title} style={{ height: '100%' }} />
              </div>
              <div className="blog-featured-body">
                <div className="blog-featured-meta">
                  <span
                    className="blog-cat-badge"
                    style={{
                      background: badgeStyle(featuredPost.category).bg,
                      color: badgeStyle(featuredPost.category).color,
                      border: `1px solid ${badgeStyle(featuredPost.category).border}`,
                    }}
                  >
                    {featuredPost.category}
                  </span>
                  <span className="blog-card-readtime">{featuredPost.readTime}</span>
                  <span className="blog-meta-sep">·</span>
                  <span className="blog-card-date">{featuredPost.displayDate}</span>
                </div>
                <div className="blog-featured-title">{featuredPost.title}</div>
                <div className="blog-featured-excerpt">{featuredPost.excerpt}</div>
                <div className="blog-featured-footer">
                  <div className="blog-author">
                    <div className="blog-author-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>U</div>
                    <div>
                      <div className="blog-author-name">Uptrue Team</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{featuredPost.displayDate}</div>
                    </div>
                  </div>
                  <span className="blog-card-link">
                    Read article
                    <svg className="blog-card-arrow" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Filter row */}
        <div className="blog-filter-row">
          <div className="blog-filter-tabs">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                className={`blog-filter-btn${activeTab === tab ? ' active' : ''}`}
                onClick={() => switchTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="blog-sort">
            Sort by:
            <select>
              <option>Latest</option>
              <option>Most read</option>
            </select>
          </div>
        </div>

        {/* Posts grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Search size={36} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 16 }}>No articles found. Try a different search or category.</p>
          </div>
        ) : (
          <>
            {pagePosts.length > 0 && (
              <div className="blog-posts-grid reveal-stagger">
                {pagePosts.map(post => {
                  const bs = badgeStyle(post.category)
                  return (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                      <div className="blog-card-image">
                        <BlogCardImage category={post.category} title={post.title} style={{ height: '100%' }} />
                      </div>
                      <div className="blog-card-body">
                        <div className="blog-card-meta">
                          <span className="blog-cat-badge" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
                            {post.category}
                          </span>
                          <span className="blog-card-readtime">{post.readTime}</span>
                          <span className="blog-meta-sep">·</span>
                          <span className="blog-card-date">{post.displayDate}</span>
                        </div>
                        <div className="blog-card-title">{post.title}</div>
                        <div className="blog-card-excerpt">{post.excerpt}</div>
                      </div>
                      <div className="blog-card-footer">
                        <span className="blog-card-link">
                          Read article
                          <svg className="blog-card-arrow" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                          </svg>
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>uptrue.io/blog</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="blog-load-more">
                <button className="btn btn-ghost" onClick={loadMore}>
                  Load more articles
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* Newsletter */}
        <div className="blog-newsletter reveal">
          <div className="blog-newsletter-left">
            <h3>Get articles in your inbox</h3>
            <p>One email when we publish. No noise. Unsubscribe any time.</p>
          </div>
          {subStatus === 'success' ? (
            <p style={{ fontSize: 14, color: '#16a34a', fontWeight: 500 }}>{subMsg}</p>
          ) : (
            <form className="blog-newsletter-form" onSubmit={handleSubscribe} noValidate style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', width: '100%' }}>
                <input
                  className={`blog-newsletter-input${subStatus === 'error' ? ' input-error' : ''}`}
                  type="email"
                  placeholder="you@company.com"
                  value={subEmail}
                  onChange={e => { setSubEmail(e.target.value); setSubStatus('idle') }}
                  disabled={subStatus === 'loading'}
                />
                <button className="btn btn-primary" type="submit" disabled={subStatus === 'loading'}>
                  {subStatus === 'loading' ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
              {subStatus === 'error' && (
                <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>{subMsg}</p>
              )}
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

export function BlogIndexClient({ posts }: { posts: UnifiedPost[] }) {
  return (
    <Suspense fallback={<div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>}>
      <BlogIndexContent posts={posts} />
    </Suspense>
  )
}
