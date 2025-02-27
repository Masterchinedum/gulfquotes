"use client"

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface RelatedQuotesProps {
  currentQuoteId: string;
  categoryId: string; // Add categoryId as a required prop
  authorProfileId?: string; // Keep this optional
  authorName: string;
  authorSlug: string;
  tags: Array<{ id: string; name: string; slug: string }>;
  limit?: number;
  className?: string;
}

interface RelatedQuote {
  id: string;
  slug: string;
  content: string;
  backgroundImage: string | null;
  authorProfile: {
    name: string;
    slug: string;
  };
  category: {
    name: string;
    slug: string;
  };
}

export function RelatedQuotes({ 
  currentQuoteId,
  categoryId, // Use this for API call
  authorName,
  authorSlug,
  limit = 3,
  className 
}: RelatedQuotesProps) {
  const [relatedQuotes, setRelatedQuotes] = useState<RelatedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch related quotes from our API endpoint
  useEffect(() => {
    const fetchRelatedQuotes = async () => {
      if (!categoryId) {
        setError("Category information is missing");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Build the API URL with query parameters
        const url = new URL('/api/quotes/related', window.location.origin);
        url.searchParams.append('categoryId', categoryId);
        url.searchParams.append('currentQuoteId', currentQuoteId);
        url.searchParams.append('limit', limit.toString());
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to load related quotes');
        }
        
        if (data.data && Array.isArray(data.data.quotes)) {
          setRelatedQuotes(data.data.quotes);
        } else {
          setRelatedQuotes([]);
        }
      } catch (err) {
        console.error("Error fetching related quotes:", err);
        setError(err instanceof Error ? err.message : "Failed to load related quotes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedQuotes();
  }, [categoryId, currentQuoteId, limit]);

  // Display heading based on what kinds of quotes we're showing
  const displayTitle = () => {
    if (relatedQuotes.length > 0 && relatedQuotes.every(q => q.authorProfile.slug === authorSlug)) {
      return `More from ${authorName}`;
    }
    return "Related Quotes";
  };

  if (isLoading) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardHeader className="pb-3">
          <CardTitle>Related Quotes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(limit).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (relatedQuotes.length === 0) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          No related quotes found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-muted overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b">
        <CardTitle>{displayTitle()}</CardTitle>
        <CardDescription>
          Discover more quotes in the same category
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4 divide-y divide-border">
          {relatedQuotes.map(quote => (
            <div key={quote.id} className="group pt-4 first:pt-0">
              <Link 
                href={`/quotes/${quote.slug}`} 
                className="block transition-colors duration-200 hover:bg-accent/50 rounded-md p-2 -mx-2"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarImage 
                      src={`/authors/${quote.authorProfile.slug}.jpg`} 
                      alt={quote.authorProfile.name} 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {quote.authorProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      &quot;{quote.content}&quot;
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {quote.authorProfile.name}
                      </p>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {quote.category.name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}