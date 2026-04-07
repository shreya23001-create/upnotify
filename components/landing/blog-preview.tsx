import Link from 'next/link'
import { getPublishedBlogPosts } from '@/lib/db/blog-posts'

const CARD_GRADIENTS: Record<string, string> = {
  Guide:             'linear-gradient(135deg,#3b82f6,#06b6d4)',
  Security:          'linear-gradient(135deg,#ef4444,#f59e0b)',
  Performance:       'linear-gradient(135deg,#10b981,#06b6d4)',
  Ecommerce:         'linear-gradient(135deg,#f59e0b,#ec4899)',
  'Incident Report': 'linear-gradient(135deg,#ef4444,#7c3aed)',
  Agency:            'linear-gradient(135deg,#0c1322,#3b82f6)',
  WordPress:         'linear-gradient(135deg,#21759b,#06b6d4)',
  Hosting:           'linear-gradient(135deg,#10b981,#3b82f6)',
  Outage:            'linear-gradient(135deg,#ef4444,#7c3aed)',
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Guide:             { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  Security:          { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
  Performance:       { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)'  },
  Ecommerce:         { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)'  },
  'Incident Report': { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
  Agency:            { bg: 'rgba(59,130,246,0.1)',  color: '#06b6d4', border: 'rgba(6,182,212,0.2)'   },
  WordPress:         { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
  Hosting:           { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)'  },
  Outage:            { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
}

const W  = 'rgba(255,255,255,0.20)'
const W2 = 'rgba(255,255,255,0.10)'
const W3 = 'rgba(255,255,255,0.06)'

function CardPattern({ category }: { category: string }): React.ReactElement {
  switch (category) {

    case 'Outage':
    case 'Incident Report':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Lightning bolts */}
          <polyline points="190,12 170,62 184,62 160,118" fill="none" stroke={W} strokeWidth="2.5" strokeLinejoin="round"/>
          <polyline points="230,20 214,65 226,65 204,115" fill="none" stroke={W2} strokeWidth="2" strokeLinejoin="round"/>
          {/* Alert circle */}
          <circle cx="330" cy="65" r="38" fill="none" stroke={W2} strokeWidth="1.5"/>
          <circle cx="330" cy="65" r="24" fill="none" stroke={W} strokeWidth="1.5"/>
          <line x1="330" y1="52" x2="330" y2="68" stroke={W} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="330" cy="76" r="2.5" fill={W}/>
          {/* Dots left */}
          {[30,60,90,120].map(y => <circle key={y} cx="60" cy={y} r="2" fill={W3}/>)}
          {[30,60,90,120].map(y => <circle key={y} cx="90" cy={y} r="2" fill={W3}/>)}
        </svg>
      )

    case 'Guide':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Document */}
          <rect x="145" y="15" width="110" height="100" rx="5" fill="none" stroke={W} strokeWidth="1.5"/>
          <line x1="162" y1="38" x2="238" y2="38" stroke={W} strokeWidth="1.5"/>
          <line x1="162" y1="53" x2="238" y2="53" stroke={W2} strokeWidth="1.5"/>
          <line x1="162" y1="68" x2="215" y2="68" stroke={W2} strokeWidth="1.5"/>
          <line x1="162" y1="83" x2="238" y2="83" stroke={W2} strokeWidth="1.5"/>
          <line x1="162" y1="98" x2="225" y2="98" stroke={W2} strokeWidth="1.5"/>
          {/* Corner fold */}
          <polyline points="225,15 255,15 255,45" fill="none" stroke={W} strokeWidth="1.5"/>
          <line x1="225" y1="15" x2="255" y2="45" stroke={W} strokeWidth="1"/>
          {/* Dots bg */}
          {[40,80,120].map(x => [25,65,105].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill={W3}/>))}
          {[320,360].map(x => [25,65,105].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill={W3}/>))}
        </svg>
      )

    case 'Security':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Shield */}
          <path d="M200,12 L228,24 L228,62 Q228,92 200,108 Q172,92 172,62 L172,24 Z" fill="none" stroke={W} strokeWidth="2"/>
          {/* Tick */}
          <polyline points="188,62 198,72 215,52" fill="none" stroke={W} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Circuit lines */}
          {[25,45,65,85,105].map(y => (
            <line key={y} x1="0" y1={y} x2="155" y2={y} stroke={W3} strokeWidth="1" strokeDasharray="5,10"/>
          ))}
          {[25,45,65,85,105].map(y => (
            <line key={y} x1="245" y1={y} x2="400" y2={y} stroke={W3} strokeWidth="1" strokeDasharray="5,10"/>
          ))}
          {/* Nodes */}
          {[50,100,140].map(x => [35,75].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={W2}/>))}
          {[260,310,360].map(x => [35,75].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={W2}/>))}
        </svg>
      )

    case 'Performance':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Sine waves */}
          <path d="M0,65 Q50,20 100,65 Q150,110 200,65 Q250,20 300,65 Q350,110 400,65" fill="none" stroke={W} strokeWidth="2.5"/>
          <path d="M0,80 Q50,35 100,80 Q150,125 200,80 Q250,35 300,80 Q350,125 400,80" fill="none" stroke={W2} strokeWidth="1.5"/>
          <path d="M0,50 Q50,5 100,50 Q150,95 200,50 Q250,5 300,50 Q350,95 400,50" fill="none" stroke={W2} strokeWidth="1.5"/>
          {/* Speed indicator */}
          <circle cx="310" cy="65" r="40" fill="none" stroke={W2} strokeWidth="1"/>
          <line x1="310" y1="65" x2="338" y2="44" stroke={W} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="310" cy="65" r="4" fill={W}/>
        </svg>
      )

    case 'Ecommerce':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Shopping cart */}
          <path d="M148,40 L160,40 L172,85 L228,85 L240,52 L160,52" fill="none" stroke={W} strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="180" cy="96" r="7" fill="none" stroke={W} strokeWidth="2"/>
          <circle cx="220" cy="96" r="7" fill="none" stroke={W} strokeWidth="2"/>
          {/* Price tags */}
          <rect x="268" y="30" width="50" height="30" rx="4" fill="none" stroke={W2} strokeWidth="1.5"/>
          <line x1="318" y1="40" x2="328" y2="40" stroke={W2} strokeWidth="1"/>
          <circle cx="328" cy="40" r="4" fill="none" stroke={W2} strokeWidth="1"/>
          <rect x="278" y="72" width="50" height="30" rx="4" fill="none" stroke={W2} strokeWidth="1.5"/>
          {/* Grid bg */}
          {[40,80,120].map(x => [30,60,90,120].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill={W3}/>))}
        </svg>
      )

    case 'WordPress':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* WP circle logo suggestion */}
          <circle cx="200" cy="65" r="50" fill="none" stroke={W} strokeWidth="2"/>
          <circle cx="200" cy="65" r="38" fill="none" stroke={W2} strokeWidth="1"/>
          {/* W letter */}
          <polyline points="178,50 186,80 196,60 206,80 214,50" fill="none" stroke={W} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
          {/* Block rows */}
          {[20,50,80,110,140,340,370].map((x, i) => (
            <rect key={i} x={x} y="45" width="28" height="40" rx="3" fill="none" stroke={W3} strokeWidth="1"/>
          ))}
        </svg>
      )

    case 'Hosting':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Server racks */}
          {[18, 46, 74, 102].map((y, i) => (
            <g key={y}>
              <rect x="100" y={y} width="200" height="22" rx="3" fill="none" stroke={i === 1 ? W : W2} strokeWidth={i === 1 ? 2 : 1.5}/>
              <circle cx="116" cy={y + 11} r="4" fill={i === 1 ? W : W2}/>
              <circle cx="130" cy={y + 11} r="3" fill={W3}/>
              <line x1="150" y1={y + 11} x2="280" y2={y + 11} stroke={W3} strokeWidth="1" strokeDasharray="6,4"/>
              <circle cx="290" cy={y + 11} r="3" fill={i === 1 ? W : W3}/>
            </g>
          ))}
          {/* Side lines */}
          {[40,70,100].map(x => <line key={x} x1={x} y1="10" x2={x} y2="120" stroke={W3} strokeWidth="1"/>)}
          {[300,330,360].map(x => <line key={x} x1={x} y1="10" x2={x} y2="120" stroke={W3} strokeWidth="1"/>)}
        </svg>
      )

    case 'Agency':
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Concentric arcs from bottom */}
          <path d="M200,130 A60,60 0 0,1 140,70 A60,60 0 0,1 200,10 A60,60 0 0,1 260,70 A60,60 0 0,1 200,130" fill="none" stroke={W} strokeWidth="1.5"/>
          <path d="M200,130 A90,90 0 0,1 110,60 A90,90 0 0,1 200,0" fill="none" stroke={W2} strokeWidth="1.5"/>
          <path d="M200,130 A120,120 0 0,1 80,55" fill="none" stroke={W3} strokeWidth="1"/>
          <path d="M200,130 A120,120 0 0,0 320,55" fill="none" stroke={W3} strokeWidth="1"/>
          {/* Center dot */}
          <circle cx="200" cy="65" r="6" fill={W}/>
          <circle cx="200" cy="65" r="14" fill="none" stroke={W2} strokeWidth="1"/>
          {/* Corner accents */}
          <circle cx="50" cy="20" r="25" fill="none" stroke={W3} strokeWidth="1"/>
          <circle cx="350" cy="20" r="25" fill="none" stroke={W3} strokeWidth="1"/>
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Dot grid */}
          {Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 10 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={col * 44 + 20} cy={row * 30 + 15} r="2" fill={W2}/>
            ))
          )}
          {/* Center accent */}
          <circle cx="200" cy="65" r="45" fill="none" stroke={W} strokeWidth="1.5"/>
          <circle cx="200" cy="65" r="28" fill="none" stroke={W2} strokeWidth="1"/>
        </svg>
      )
  }
}

function badgeStyle(cat: string) {
  return BADGE_STYLES[cat] ?? { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' }
}

function gradient(cat: string) {
  return CARD_GRADIENTS[cat] ?? 'linear-gradient(135deg,#3b82f6,#06b6d4)'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
}

export async function BlogPreview(): Promise<React.ReactElement> {
  const dbPosts = await getPublishedBlogPosts()

  const posts: Post[] = dbPosts
    .map(p => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? '',
      date: p.published_at ?? p.created_at,
      readTime: '5 min read',
      category: p.category ?? 'Outage',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  if (posts.length === 0) return <></>

  return (
    <section className="blog-section">
      <div className="container">
        <div className="blog-section-header">
          <div className="blog-section-header-left">
            <div className="section-eyebrow">From the blog</div>
            <h2 className="section-title">Latest articles</h2>
          </div>
          <Link href="/blog" className="btn btn-ghost">
            View all posts
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </Link>
        </div>

        <div className="blog-grid">
          {posts.map(post => {
            const bs = badgeStyle(post.category)
            const grad = gradient(post.category)
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="blog-card"
                style={{ '--card-gradient': grad } as React.CSSProperties}
              >
                <div className="blog-card-image" style={{ background: grad }}>
                  <CardPattern category={post.category} />
                </div>
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="blog-cat-badge" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
                      {post.category}
                    </span>
                    <span className="blog-card-readtime">{post.readTime}</span>
                    <span className="blog-meta-sep">·</span>
                    <span className="blog-card-date">{formatDate(post.date)}</span>
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

        <div className="blog-view-all">
          <Link href="/blog" className="btn btn-ghost btn-lg">
            Browse all 60+ articles
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
