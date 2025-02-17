export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

export function getPaginationParams(params: {
  page?: string | number | null
  limit?: string | number | null
}) {
  return {
    page: Math.max(1, Number(params.page) || 1),
    limit: Math.min(50, Math.max(1, Number(params.limit) || 10))
  }
}

export function calculateSkip(page: number, limit: number) {
  return (page - 1) * limit
}

export function hasMorePages(total: number, page: number, limit: number) {
  return total > (page - 1) * limit + limit
}