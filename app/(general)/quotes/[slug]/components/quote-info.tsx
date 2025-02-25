// app/(general)/quotes/[slug]/components/quote-info.tsx
"use client"

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface QuoteInfoProps {
  quote: QuoteDisplayData;
  className?: string;
}

export function QuoteInfo({ quote, className }: QuoteInfoProps) {
  // Format the creation date
  const formattedDate = new Date(quote.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Author Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Author</h2>
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={quote.authorProfile?.image || ""} 
              alt={quote.authorProfile?.name || "Author"} 
            />
            <AvatarFallback className="bg-primary/10">
              {quote.authorProfile?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Link 
              href={`/authors/${quote.authorProfile.slug}`}
              className="text-sm font-medium hover:underline"
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
      </div>

      {/* Category and Tags */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Category</h2>
        <div className="flex items-center space-x-2">
          <Link href={`/categories/${quote.category.slug}`}>
            <Badge variant="secondary" className="hover:bg-secondary/80">
              {quote.category.name}
            </Badge>
          </Link>
        </div>
      </div>

      {/* Tags Section */}
      {quote.tags && quote.tags.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Tags</h2>
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

      {/* Creation Date */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Added</h2>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-2" />
          <time dateTime={quote.createdAt.toString()}>{formattedDate}</time>
        </div>
      </div>

      {/* Quote Stats */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{quote.metrics?.views || 0}</p>
            <p className="text-sm text-muted-foreground">Views</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{quote.metrics?.likes || 0}</p>
            <p className="text-sm text-muted-foreground">Likes</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{quote.metrics?.shares || 0}</p>
            <p className="text-sm text-muted-foreground">Shares</p>
          </div>
        </div>
      </div>
    </div>
  );
}