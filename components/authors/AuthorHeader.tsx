import { cn } from "@/lib/utils"

interface AuthorHeaderProps {
  className?: string
}

export function AuthorHeader({ className }: AuthorHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h1 className="text-3xl font-bold tracking-tight">Authors</h1>
      <p className="text-muted-foreground">
        Explore our collection of authors and their timeless quotes. Browse through history&apos;s greatest minds and discover their wisdom.
      </p>
    </div>
  )
}