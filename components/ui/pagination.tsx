'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function Pagination({ page, pageSize, total, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigate = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // Build visible page numbers with ellipsis
  function getPages(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong>
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => navigate(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {getPages().map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
            : (
              <button
                key={p}
                className={`pagination-btn pagination-page${p === page ? ' active' : ''}`}
                onClick={() => navigate(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
        )}

        <button
          className="pagination-btn"
          onClick={() => navigate(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
