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

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10))
  
  return {
    page,
    limit
  }
}

export function calculateSkip(page: number, limit: number) {
  return (page - 1) * limit
}

export function hasMorePages(total: number, page: number, limit: number) {
  return total > (page - 1) * limit + limit
}