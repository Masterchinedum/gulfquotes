"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileQuote } from "@/types/api/users";
import { format } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, Share2 } from "lucide-react";

interface UserQuoteListProps {
  quotes: ProfileQuote[];
  title: string;
  emptyMessage?: string;
  viewAllLink?: string;
  viewAllText?: string;
  displayMode?: "compact" | "expanded";
  limit?: number;
  actionButtons?: boolean;
  // Replace function prop with simpler props
  showEmptyAction?: boolean;
  emptyActionLink?: string;
  emptyActionText?: string;
}

export function UserQuoteList({
  quotes,
  title,
  emptyMessage = "No quotes found.",
  viewAllLink,
  viewAllText = "View All",
  displayMode = "compact",
  limit = 5,
  actionButtons = false,
  showEmptyAction,
  emptyActionLink,
  emptyActionText
}: UserQuoteListProps) {
  const [visibleQuotes, setVisibleQuotes] = useState(limit);
  const hasMoreToShow = quotes.length > visibleQuotes;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Handle showing more quotes
  const showMore = () => {
    setVisibleQuotes(prev => prev + limit);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {quotes.length > 0 
            ? `${title} (${quotes.length})`
            : title}
        </CardTitle>
      </CardHeader>
      {quotes.length > 0 ? (
        <CardContent className="space-y-4">
          {quotes.slice(0, visibleQuotes).map((quote) => (
            <div key={quote.id} className={cn(
              "border rounded-lg overflow-hidden",
              "transition-all hover:shadow-sm",
              displayMode === "expanded" ? "flex flex-col" : ""
            )}>
              {/* Quote content with optional background image */}
              {displayMode === "expanded" && quote.backgroundImage && (
                <div className="relative w-full h-36">
                  <Image
                    src={quote.backgroundImage}
                    alt={`Background for quote by ${quote.authorProfile.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
                  <div className="absolute inset-0 p-4 flex items-center justify-center">
                    <p className="text-white font-medium text-center line-clamp-3">
                      &ldquo;{quote.content}&rdquo;
                    </p>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                {/* Only show quote content here if in compact mode or no background image */}
                {(displayMode === "compact" || !quote.backgroundImage) && (
                  <Link href={`/quotes/${quote.slug}`} className="block">
                    <p className="font-medium line-clamp-2 mb-2">{quote.content}</p>
                  </Link>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <span>by</span>
                    <Link href={`/authors/${quote.authorProfile.slug}`} className="hover:underline">
                      {quote.authorProfile.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/categories/${quote.category.slug}`} className="hover:underline">
                      {quote.category.name}
                    </Link>
                    {displayMode === "expanded" && (
                      <span className="text-xs">{formatDate(quote.createdAt)}</span>
                    )}
                  </div>
                </div>
                
                {/* Action buttons for expanded mode */}
                {actionButtons && displayMode === "expanded" && (
                  <div className="flex items-center justify-between mt-3 pt-2 border-t">
                    <div className="flex gap-4">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Heart className="h-4 w-4 mr-1" />
                        <span className="text-xs">Like</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span className="text-xs">Comment</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Share2 className="h-4 w-4 mr-1" />
                        <span className="text-xs">Share</span>
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-8">
                      <Link href={`/quotes/${quote.slug}`}>
                        Read more
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Show more or view all buttons */}
          <div className="flex justify-center gap-2 pt-2">
            {hasMoreToShow && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={showMore}
              >
                Show More
              </Button>
            )}
            
            {viewAllLink && quotes.length > limit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={viewAllLink}>
                  {viewAllText}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      ) : (
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>{emptyMessage}</p>
          {showEmptyAction && emptyActionLink && (
            <div className="mt-4">
              <Link href={emptyActionLink}>
                <Button variant="outline" size="sm">{emptyActionText || "Browse"}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}