export const DEFAULT_PAGE_SIZE = 10

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  from: number
  to: number
}

export function getPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1
  return { page: safePage, pageSize, total, totalPages, from, to }
}

export function parsePage(raw: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(raw) ? raw[0] : raw ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}
