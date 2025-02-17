import { Author } from "@/types/author"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface AuthorCardProps {
  author: Author
}

export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <Link href={`/authors/${author.slug}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <Avatar>
            <AvatarImage src={author.image || ""} alt={author.name} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-medium">{author.name}</h3>
            <p className="text-sm text-muted-foreground">
              {author.quoteCount} quotes
            </p>
          </div>
        </CardHeader>
        {author.bio && (
          <CardContent className="pt-0 pb-4 px-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {author.bio}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}

// Add Skeleton component for loading state
AuthorCard.Skeleton = function AuthorCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardContent>
    </Card>
  )
}