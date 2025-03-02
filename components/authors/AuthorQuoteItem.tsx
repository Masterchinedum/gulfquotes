// components/authors/AuthorQuoteItem.tsx
import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, BookmarkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface AuthorQuoteItemProps {
  quote: QuoteDisplayData;
  className?: string;
}

export function AuthorQuoteItem({ quote, className }: AuthorQuoteItemProps) {
  // Extract tags safely with a default empty array
  const tags = quote.tags || [];
  
  return (
    <Card className={cn("hover:bg-muted/30 transition-colors", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Quote Content */}
        <div className="font-serif text-lg">
          <Link href={`/quotes/${quote.slug}`} className="hover:text-primary transition-colors">
            <blockquote className="italic leading-relaxed">
              &ldquo;{quote.content}&rdquo;
            </blockquote>
          </Link>
        </div>
        
        {/* Quote Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/categories/${quote.category.slug}`}>
              <Badge variant="outline" className="hover:bg-primary/10">
                {quote.category.name}
              </Badge>
            </Link>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                {tags.slice(0, 2).map(tag => (
                  <Link key={tag.id} href={`/tags/${tag.slug}`}>
                    <Badge variant="secondary" className="bg-muted/50 hover:bg-muted text-xs">
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
                {tags.length > 2 && (
                  <span className="text-xs">+{tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
          
          {/* Metrics */}
          <div className="flex items-center gap-4 text-xs">
            {quote.likes > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                <span>{quote.likes}</span>
              </div>
            )}
            {quote.bookmarks > 0 && (
              <div className="flex items-center gap-1">
                <BookmarkIcon className="h-3.5 w-3.5" />
                <span>{quote.bookmarks}</span>
              </div>
            )}
            <Link href={`/quotes/${quote.slug}`} className="text-xs hover:text-primary">
              View quote
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}