"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileFollowedAuthor } from "@/types/api/users";
import { Users, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { AuthorFollowButton } from "@/app/(general)/authors/components/author-follow-button";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface FollowedAuthorsProps {
  authors: ProfileFollowedAuthor[];
  title?: string;
  emptyMessage?: string | React.ReactNode;
  viewAllLink?: string;
  isCurrentUser: boolean;
  limit?: number;
  className?: string;
  layout?: "grid" | "list";
  showFollowButton?: boolean;
}

export function FollowedAuthors({
  authors,
  title = "Following",
  emptyMessage = "Not following any authors yet.",
  viewAllLink,
  limit = 6,
  className,
  layout = "grid",
  showFollowButton = true
}: FollowedAuthorsProps) {
  const { status } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [followCounts, setFollowCounts] = useState<Record<string, number>>(
    authors.reduce((acc, author) => {
      // Initialize with default counts (this would typically come from the API)
      acc[author.id] = 0; // We don't have this data yet, so initialize at 0
      return acc;
    }, {} as Record<string, number>)
  );

  // Number of authors to display initially (before expanding)
  const visibleAuthors = expanded ? authors : authors.slice(0, limit);
  const hasMore = authors.length > limit;

  // Handle follow state changes
  const handleFollowChange = useCallback((authorId: string, isFollowed: boolean, followerCount: number) => {
    setFollowCounts(prev => ({
      ...prev,
      [authorId]: followerCount
    }));
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          {title} {authors.length > 0 ? `(${authors.length})` : ""}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {authors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {typeof emptyMessage === "string" ? (
              <p>{emptyMessage}</p>
            ) : (
              emptyMessage
            )}
          </div>
        ) : (
          <>
            <div className={cn(
              layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"
            )}>
              {visibleAuthors.map((author) => (
                <div
                  key={author.id}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    "hover:border-primary/40 hover:bg-accent/40"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Author Avatar */}
                    <Link href={`/authors/${author.slug}`} className="shrink-0">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={author.image || ""} alt={author.name} />
                        <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Link>

                    {/* Author Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/authors/${author.slug}`} 
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {author.name}
                      </Link>
                      
                      {/* Bio excerpt if available */}
                      {author.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {author.bio}
                        </p>
                      )}
                      
                      {/* Author stats */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{followCounts[author.id] || 0} followers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Quotes</span>
                        </div>
                      </div>
                    </div>

                    {/* Follow button if enabled and user is logged in */}
                    {showFollowButton && status === "authenticated" && (
                      <div className="shrink-0 ml-2">
                        <AuthorFollowButton
                          authorSlug={author.slug}
                          initialFollowers={followCounts[author.id] || 0}
                          initialFollowed={true} // Already following these authors
                          size="sm"
                          onFollowChange={(followed, count) => 
                            handleFollowChange(author.id, followed, count)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Show more/less toggles and view all link */}
            {(hasMore || viewAllLink) && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-center gap-2">
                  {hasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(!expanded)}
                      className="text-xs"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          Show More ({authors.length - limit} more)
                        </>
                      )}
                    </Button>
                  )}
                  
                  {viewAllLink && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={viewAllLink}>View All Authors</Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}