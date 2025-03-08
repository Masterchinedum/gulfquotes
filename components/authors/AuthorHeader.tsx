import { Metadata } from "next"
import { cn } from "@/lib/utils"

interface AuthorHeaderProps {
  className?: string
}

export const metadata: Metadata = {
  title: 'Authors | gulfquotes',
  description: 'Discover a vast collection of authors and their timeless quotes. Browse through history\'s greatest minds and thinkers.',
  openGraph: {
    title: 'Authors | gulfquotes',
    description: 'Discover a vast collection of authors and their timeless quotes.',
    type: 'website',
  },
}

export function AuthorHeader({ className }: AuthorHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Authors
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover a vast collection of authors and their timeless quotes. Browse through history&apos;s greatest minds and thinkers.
        </p>
      </div>
    </div>
  )
}