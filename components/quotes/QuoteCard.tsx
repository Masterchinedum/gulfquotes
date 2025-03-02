"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Heart, BookmarkIcon } from "lucide-react";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteCardProps {
  quote: QuoteDisplayData;
  showActions?: boolean;
  className?: string;
}

export function QuoteCard({ quote, showActions = false, className }: QuoteCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6 space-y-4">
        {/* Quote Content */}
        <blockquote className="text-xl italic leading-relaxed">
          &quot;{quote.content}&quot;
        </blockquote>
        
        {/* Author and Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={quote.authorProfile?.image || ""} alt={quote.authorProfile.name} />
              <AvatarFallback>{quote.authorProfile.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Link 
                href={`/authors/${quote.authorProfile.slug}`} 
                className="text-sm font-medium hover:underline"
              >
                {quote.authorProfile.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                <Link 
                  href={`/categories/${quote.category.slug}`} 
                  className="hover:underline"
                >
                  {quote.category.name}
                </Link>
              </p>
            </div>
          </div>
          
          {/* Display metrics if showActions is true */}
          {showActions && quote.metrics && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <Heart className="h-3.5 w-3.5" />
                <span>{quote.metrics.likes}</span>
              </div>
              {quote.metrics.bookmarks !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  <BookmarkIcon className="h-3.5 w-3.5" />
                  <span>{quote.metrics.bookmarks}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Tags */}
        {quote.tags && quote.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quote.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}