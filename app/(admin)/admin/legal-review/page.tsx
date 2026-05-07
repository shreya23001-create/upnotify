import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { canAccessAdminModule } from '@/lib/db/admin-roles'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

// blog_posts columns from migration 00101 (legal_review_*) not yet in generated
// database.types.ts — use raw client until types are regenerated.
function getRawClient(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

export const dynamic = 'force-dynamic'

interface LegalReviewPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  post_type: string | null
  primary_keyword: string | null
  created_at: string
  legal_review_outcome: string | null
  legal_review_by: string | null
  legal_reviewed_at: string | null
}

async function getLegalReviewQueue(): Promise<LegalReviewPost[]> {
  const supabase = getRawClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, post_type, primary_keyword, created_at, legal_review_outcome, legal_review_by, legal_reviewed_at')
    .eq('post_type', 'commercial')
    .order('created_at', { ascending: true })

  return (data ?? []) as LegalReviewPost[]
}

function statusBadge(outcome: string | null): React.ReactElement {
  if (outcome === 'approved') return <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>Approved</span>
  if (outcome === 'rejected') return <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 12 }}>Rejected</span>
  if (outcome === 'needs_changes') return <span style={{ color: '#d97706', fontWeight: 600, fontSize: 12 }}>Needs changes</span>
  return <span style={{ color: '#6b7280', fontWeight: 600, fontSize: 12 }}>Pending review</span>
}

export default async function LegalReviewPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSuperAdmin = !!user.is_super_admin
  const canRead = await canAccessAdminModule(user.email, isSuperAdmin, 'blog')
  if (!canRead) redirect('/admin')

  const posts = await getLegalReviewQueue()
  const pending = posts.filter(p => !p.legal_review_outcome)
  const reviewed = posts.filter(p => p.legal_review_outcome)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Legal Review Queue</h1>
          <p className="admin-page-subtitle">
            Comparison and commercial pages must be approved here before they can publish.
            Reviewed by Harvey (legal@uptrue.io).
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{pending.length}</span>
          <span className="admin-page-header-stat-label">awaiting review</span>
        </div>
      </div>

      {pending.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Pending Review ({pending.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map(post => (
              <div key={post.id} className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {statusBadge(post.legal_review_outcome)}
                      {post.primary_keyword && (
                        <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                          {post.primary_keyword}
                        </span>
                      )}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>{post.title}</p>
                    {post.excerpt && (
                      <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{post.excerpt}</p>
                    )}
                    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                      Draft created: {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link href={`/blog/${post.slug}`} target="_blank" className="btn btn-secondary btn-sm">
                      Preview
                    </Link>
                    <form action={`/api/admin/legal-review?id=${post.id}&action=approved&reviewer=${encodeURIComponent(user.email)}`} method="GET" style={{ display: 'inline' }}>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                        Approve
                      </button>
                    </form>
                    <form action={`/api/admin/legal-review?id=${post.id}&action=needs_changes&reviewer=${encodeURIComponent(user.email)}`} method="GET" style={{ display: 'inline' }}>
                      <button type="submit" className="btn btn-secondary btn-sm" style={{ color: '#d97706', borderColor: '#d97706' }}>
                        Needs changes
                      </button>
                    </form>
                    <form action={`/api/admin/legal-review?id=${post.id}&action=rejected&reviewer=${encodeURIComponent(user.email)}`} method="GET" style={{ display: 'inline' }}>
                      <button type="submit" className="btn btn-secondary btn-sm" style={{ color: '#dc2626', borderColor: '#dc2626' }}>
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#6b7280' }}>No posts pending legal review.</p>
        </div>
      )}

      {reviewed.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Reviewed ({reviewed.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reviewed.map(post => (
              <div key={post.id} className="card" style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    {statusBadge(post.legal_review_outcome)}
                    <span style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                    {post.legal_reviewed_at && (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(post.legal_reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {post.legal_review_by ? ` · ${post.legal_review_by}` : ''}
                      </span>
                    )}
                    {post.legal_review_outcome === 'approved' && (
                      <Link href={`/blog/${post.slug}`} target="_blank" className="btn btn-secondary btn-sm">
                        View live
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
