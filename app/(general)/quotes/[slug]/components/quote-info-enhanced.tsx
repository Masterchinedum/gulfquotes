"use client"

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Heart, Share2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteInfoEnhancedProps {
  quote: QuoteDisplayData;
  className?: string;
}

export function QuoteInfoEnhanced({ quote, className }: QuoteInfoEnhancedProps) {
  // Format the creation date
  const formattedDate = new Date(quote.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6 space-y-6">
        {/* Author Information */}
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12 border-2 border-primary/10">
            <AvatarImage src={quote.authorProfile?.image || ""} alt={quote.authorProfile?.name || "Author"} />
            <AvatarFallback className="bg-primary/10">
              {quote.authorProfile?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <Link 
              href={`/authors/${quote.authorProfile.slug}`}
              className="font-semibold text-lg hover:text-primary transition-colors"
            >
              {quote.authorProfile.name}
            </Link>
            {quote.authorProfile.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {quote.authorProfile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Quote Metadata - Category and Publication Date */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Category</span>
            <div>
              <Link href={`/categories/${quote.category.slug}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80">
                  {quote.category.name}
                </Badge>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 mr-2" />
            <time dateTime={quote.createdAt.toString()}>{formattedDate}</time>
          </div>
        </div>

        {/* Tags */}
        {quote.tags && quote.tags.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {quote.tags.map((tag) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Badge 
                    variant="outline" 
                    className="hover:bg-muted"
                  >
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Views</span>
            </div>
            <p className="font-semibold">{quote.metrics?.views || 0}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-xs">Likes</span>
            </div>
            <p className="font-semibold">{quote.metrics?.likes || 0}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Shares</span>
            </div>
            <p className="font-semibold">{quote.metrics?.shares || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}