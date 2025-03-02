// components/categories/CategoryQuotesList.tsx
"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuoteDisplayData } from "@/lib/services/public-quote/types";
import { LikeButton } from "@/components/quotes/like-button";
import { BookmarkButton } from "@/components/quotes/bookmark-button";
import Link from "next/link";

interface CategoryQuotesListProps {
  quotes: QuoteDisplayData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  categorySlug?: string; // Pass this to help with navigation
}

export function CategoryQuotesList({
  quotes,
  isLoading = false,
  emptyMessage = "No quotes found in this category",
  className,
//   categorySlug,
}: CategoryQuotesListProps) {
  // Track which quotes have been interacted with
  const [likedQuotes, setLikedQuotes] = useState<Record<string, boolean>>({});
  const [bookmarkedQuotes, setBookmarkedQuotes] = useState<Record<string, boolean>>({});

  // Handle like and bookmark interactions
  const handleLike = (quoteId: string, isLiked: boolean) => {
    setLikedQuotes((prev) => ({ ...prev, [quoteId]: isLiked }));
  };

  const handleBookmark = (quoteId: string, isBookmarked: boolean) => {
    setBookmarkedQuotes((prev) => ({ ...prev, [quoteId]: isBookmarked }));
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <QuoteCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 border rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">{emptyMessage}</p>
          <Button asChild>
            <Link href="/categories">Browse other categories</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show quotes
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {quotes.map((quote) => (
        <QuoteCard 
          key={quote.id} 
          quote={quote}
          isLiked={likedQuotes[quote.id] ?? quote.isLiked}
          isBookmarked={bookmarkedQuotes[quote.id] ?? quote.isBookmarked}
          onLike={handleLike}
          onBookmark={handleBookmark}
        />
      ))}
    </div>
  );
}

// QuoteCard component
interface QuoteCardProps {
  quote: QuoteDisplayData;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: (quoteId: string, isLiked: boolean) => void;
  onBookmark: (quoteId: string, isBookmarked: boolean) => void;
}

function QuoteCard({ quote, isLiked, isBookmarked, onLike, onBookmark }: QuoteCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-grow">
        {/* Quote content */}
        <Link 
          href={`/quotes/${quote.slug}`} 
          className="flex-grow group"
        >
          <blockquote className="text-lg mb-4 group-hover:text-primary/90 transition-colors">
            &quot;{quote.content.length > 150 
              ? quote.content.substring(0, 150) + '...' 
              : quote.content}&quot;
          </blockquote>
        </Link>
        
        {/* Author and category info */}
        <div className="mt-4 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <Link 
              href={`/authors/${quote.authorProfile.slug}`}
              className="hover:underline"
            >
              {quote.authorProfile.name}
            </Link>
            
            <Link
              href={`/categories/${quote.category.slug}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              {quote.category.name}
            </Link>
          </div>
          
          {/* Interaction buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <LikeButton 
                quoteId={quote.id}
                isLiked={isLiked}
                onLike={(isLiked) => onLike(quote.id, isLiked)}
              />
              <BookmarkButton
                quoteId={quote.id}
                isBookmarked={isBookmarked}
                onBookmark={(isBookmarked) => onBookmark(quote.id, isBookmarked)}
              />
            </div>
            <Button
              variant="ghost" 
              size="sm" 
              className="text-xs" 
              asChild
            >
              <Link href={`/quotes/${quote.slug}`}>
                Read more
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
function QuoteCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-full animate-pulse" />
          <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <div className="h-4 bg-muted rounded w-20 animate-pulse" />
          <div className="h-4 bg-muted rounded w-16 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
