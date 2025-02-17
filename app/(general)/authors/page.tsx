import { AuthorHeader } from "@/components/authors/AuthorHeader"
import { AuthorSearchBar } from "@/components/authors/AuthorSearchBar"
import { AlphabetNav } from "@/components/authors/AlphabetNav"

export default function AuthorsPage() {
  return (
    <div className="container space-y-8 py-8">
      <AuthorHeader />
      <div className="flex flex-col gap-6">
        <AuthorSearchBar />
        <AlphabetNav />
      </div>
    </div>
  )
}