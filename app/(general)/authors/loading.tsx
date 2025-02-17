import { AuthorHeader } from "@/components/authors/AuthorHeader"
import { AuthorSearchBar } from "@/components/authors/AuthorSearchBar"
import { AlphabetNav } from "@/components/authors/AlphabetNav"
import { Skeleton } from "@/components/ui/skeleton"

export function AuthorSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[120px] rounded-lg"
        />
      ))}
    </div>
  )
}

export default function Loading() {
  return (
    <div className="container space-y-8 py-8">
      <AuthorHeader />
      <div className="flex flex-col gap-6">
        <AuthorSearchBar />
        <AlphabetNav />
        <AuthorSkeleton />
      </div>
    </div>
  )
}