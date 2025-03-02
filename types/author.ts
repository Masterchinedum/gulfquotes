export interface Author {
  id: string
  name: string
  slug: string
  bio?: string | null
  image?: string | null
  quoteCount: number
  born?: string | null
  died?: string | null
  followers: number       // Add follower count
  isFollowed?: boolean    // Add follow status (optional)
}

// API Response types
export interface AuthorsResponse {
  data?: {
    items: Author[]
    total: number
    hasMore: boolean
    page: number
    limit: number
  }
  error?: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

// Query parameters interface
export interface AuthorListParams {
  page?: number
  limit?: number
  search?: string
  letter?: string
  userId?: string  // Add optional userId for follow status checking
}