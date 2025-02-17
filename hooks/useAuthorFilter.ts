import { useState, useCallback } from "react"
import type { Author, AuthorsResponse, AuthorListParams } from "@/types/author"

interface UseAuthorsReturn {
  authors: Author[]
  total: number
  isLoading: boolean
  error: string | null
  fetchAuthors: (params: AuthorListParams) => Promise<void>
}

export function useAuthors(): UseAuthorsReturn {
  const [authors, setAuthors] = useState<Author[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAuthors = useCallback(async (params: AuthorListParams) => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", params.page.toString())
      if (params.limit) searchParams.set("limit", params.limit.toString())
      if (params.search) searchParams.set("search", params.search)
      if (params.letter) searchParams.set("letter", params.letter)

      const response = await fetch(`/api/authors?${searchParams.toString()}`)
      const result: AuthorsResponse = await response.json()

      if (result.error) {
        throw new Error(result.error.message)
      }

      if (!result.data) {
        throw new Error("No data returned from API")
      }

      setAuthors(result.data.items)
      setTotal(result.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch authors")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { authors, total, isLoading, error, fetchAuthors }
}