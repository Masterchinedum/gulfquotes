"use client"

import { Author } from "@/types/author"
import { AuthorCard } from "./AuthorCard"

interface AuthorGridProps {
  authors: Author[]
  isLoading?: boolean
}

export function AuthorGrid({ authors, isLoading }: AuthorGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <AuthorCard.Skeleton key={i} />
        ))}
      </div>
    )
  }

  if (authors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No authors found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {authors.map((author) => (
        <AuthorCard key={author.id} author={author} />
      ))}
    </div>
  )
}