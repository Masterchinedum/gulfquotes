// components/home/TrendingQuotes.tsx
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTrendingQuotes } from "@/hooks/use-trending-quotes";
import { format } from "date-fns";
// Import our new components
import { QuoteLikeButton } from "@/components/shared/QuoteLikeButton";
import { QuoteCommentButton } from "@/components/shared/QuoteCommentButton";
import { QuoteShareButton } from "@/components/shared/QuoteShareButton";

export function TrendingQuotes() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { quotes, isLoading, isError, error, updatedAt, refresh } = useTrendingQuotes();
  const [operationError, setOperationError] = useState<string | null>(null);

  // Clear operation error when component refreshes
  useEffect(() => {
    if (operationError) {
      const timer = setTimeout(() => {
        setOperationError(null);
      }, 5000); // Clear error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [operationError]);

  const next = () => {
    setCurrentIndex((current) => 
      current + 3 >= quotes.length ? 0 : current + 3
    );
  };

  const previous = () => {
    setCurrentIndex((current) => 
      current - 3 < 0 ? Math.max(quotes.length - 3, 0) : current - 3
    );
  };

  // Handle component-level errors
  // const handleError = (message: string) => {
  //   setOperationError(message);
  //   toast.error(message);
    
  //   // Attempt to refresh data after an error
  //   setTimeout(() => {
  //     refresh();
  //   }, 3000);
  // };

  // Loading state
  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          </div>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Error state - enhanced with retry option
  if (isError) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          </div>
        </div>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="text-muted-foreground">
              {error || "Failed to load trending quotes"}
            </div>
            <Button variant="outline" onClick={refresh}>
              Try Again
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  // Empty state
  if (quotes.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          </div>
        </div>
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            No trending quotes yet
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Most liked quotes in the last 24 hours
              {updatedAt && (
                <span className="ml-1 text-xs">
                  (Updated {format(new Date(updatedAt), 'PP')})
                </span>
              )}
            </p>
            {operationError && (
              <span className="text-xs text-destructive">
                {operationError}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={previous}
            disabled={quotes.length <= 3}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={next}
            disabled={quotes.length <= 3}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quotes.slice(currentIndex, currentIndex + 3).map((quote) => (
          <Card 
            key={quote.id}
            className={cn(
              "transition-all duration-200",
              "hover:shadow-md"
            )}
          >
            <CardContent className="p-6 space-y-4">
              <Link 
                href={`/authors/${quote.authorProfile.slug}`}
                className="flex items-center gap-2 group"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={quote.authorProfile.image || ""} 
                    alt={quote.authorProfile.name}
                  />
                  <AvatarFallback>
                    {quote.authorProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium group-hover:text-primary">
                  {quote.authorProfile.name}
                </span>
              </Link>
              
              <Link href={`/quotes/${quote.slug}`}>
                <blockquote className="italic text-muted-foreground hover:text-foreground transition-colors">
                  &quot;{quote.content}&quot;
                </blockquote>
              </Link>
            </CardContent>

            <CardFooter className="border-t p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-4">
                  <QuoteLikeButton
                    initialLikes={quote.metrics?.likes || 0}
                    quoteId={quote.slug}
                    className="hover:text-red-500"
                  />
                  
                  <QuoteCommentButton
                    quoteSlug={quote.slug}
                    commentCount={quote.commentCount || 0}
                  />
                </div>
                
                <QuoteShareButton
                  quoteSlug={quote.slug}
                  quoteContent={quote.content}
                  authorName={quote.authorProfile.name}
                />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}