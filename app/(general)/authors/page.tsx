import { Suspense } from "react"
import { AuthorHeader } from "@/components/authors/AuthorHeader"
import { AuthorSearchBar } from "@/components/authors/AuthorSearchBar"
import { AlphabetNav } from "@/components/authors/AlphabetNav"
import { AuthorGrid } from "@/components/authors/AuthorGrid"
import { AuthorPagination } from "@/components/authors/Pagination"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { AuthorSkeleton } from "./loading"
import { fetchAuthors } from "@/lib/authors"
import type { AuthorsResponse } from "@/types/author"

interface PageProps {
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    letter?: string
  }
}

export const metadata = {
  title: "Authors | Quoticon",
  description: "Browse through our collection of authors and their timeless quotes.",
}

export default async function AuthorsPage({ searchParams = {} }: PageProps) {
  // Await searchParams before using them
  const params = await Promise.resolve(searchParams)
  
  const page = Math.max(1, Number(params.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 10))
  const search = params.search?.trim()
  const letter = params.letter?.toUpperCase()

  try {
    const result = await fetchAuthors({
      page,
      limit,
      search,
      letter,
    })

    return (
      <div className="container space-y-8 py-8">
        <AuthorHeader />
        <ErrorBoundary>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <AuthorSearchBar />
              </div>
            </div>
            <AlphabetNav />
            <Suspense fallback={<AuthorSkeleton />}>
              <AuthorGrid authors={result.data?.items || []} isLoading={false} />
            </Suspense>
            {result.data && (
              <AuthorPagination
                currentPage={page}
                totalPages={Math.ceil((result.data.total || 0) / limit)}
              />
            )}
          </div>
        </ErrorBoundary>
      </div>
    )
  } catch (error) {
    console.error("[AUTHORS_PAGE]", error)
    return (
      <div className="container space-y-8 py-8">
        <AuthorHeader />
        <div className="flex flex-col gap-6">
          <AuthorSearchBar />
          <AlphabetNav />
          <div className="text-center py-12 text-muted-foreground">
            Failed to load authors. Please try again later.
          </div>
        </div>
      </div>
    )
  }
}