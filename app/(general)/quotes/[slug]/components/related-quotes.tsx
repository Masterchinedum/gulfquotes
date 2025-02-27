"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
// import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface RelatedQuotesProps {
  currentQuoteId: string;
  authorProfileId?: string; // Make this optional
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

// Sample quotes for placeholder data
const placeholderQuotes: RelatedQuote[] = [
  {
    id: "q1",
    slug: "to-be-or-not-to-be",
    content: "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
    backgroundImage: null,
    authorProfile: {
      name: "William Shakespeare",
      slug: "william-shakespeare",
    },
    category: {
      name: "Philosophy",
      slug: "philosophy",
    },
  },
  {
    id: "q2",
    slug: "all-the-worlds-a-stage",
    content: "All the world's a stage, and all the men and women merely players: they have their exits and their entrances; and one man in his time plays many parts.",
    backgroundImage: null,
    authorProfile: {
      name: "William Shakespeare",
      slug: "william-shakespeare",
    },
    category: {
      name: "Life",
      slug: "life",
    },
  },
  {
    id: "q3",
    slug: "love-looks-not-with-the-eyes",
    content: "Love looks not with the eyes, but with the mind, and therefore is winged Cupid painted blind.",
    backgroundImage: null,
    authorProfile: {
      name: "William Shakespeare",
      slug: "william-shakespeare",
    },
    category: {
      name: "Love",
      slug: "love",
    },
  },
  {
    id: "q4",
    slug: "brevity-soul-of-wit",
    content: "Brevity is the soul of wit.",
    backgroundImage: null,
    authorProfile: {
      name: "William Shakespeare",
      slug: "william-shakespeare",
    },
    category: {
      name: "Wisdom",
      slug: "wisdom",
    },
  },
];

export function RelatedQuotes({ 
  currentQuoteId,
  authorProfileId,
  authorName,
  authorSlug,
  tags,
  limit = 3,
  className 
}: RelatedQuotesProps) {
  const [relatedQuotes, setRelatedQuotes] = useState<RelatedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching related quotes
  useEffect(() => {
    const fetchRelatedQuotes = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, you'd fetch from an API
        // For now, use the placeholder data and filter out the current quote
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Filter out current quote from placeholders and limit results
        const filteredQuotes = placeholderQuotes
          .filter(quote => quote.id !== currentQuoteId)
          .slice(0, limit);
          
        setRelatedQuotes(filteredQuotes);
      } catch (err) {
        console.error("Error fetching related quotes:", err);
        setError("Failed to load related quotes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedQuotes();
  }, [currentQuoteId, limit, tags]);

  const displayAuthorName = () => {
    if (relatedQuotes.length > 0 && relatedQuotes.every(q => q.authorProfile.slug === authorSlug)) {
      return `More from ${authorName}`;
    }
    return "Related Quotes";
  };

  if (error) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-muted", className)}>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{displayAuthorName()}</h3>
          
          <Link href={`/authors/${authorSlug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
            <span className="flex items-center gap-1">
              View author 
              <ExternalLink className="h-3 w-3" />
            </span>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center space-x-2 pt-2">
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {relatedQuotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No related quotes found
              </p>
            ) : (
              relatedQuotes.map((quote) => (
                <Link href={`/quotes/${quote.slug}`} key={quote.id}>
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <p className="line-clamp-2 text-sm font-medium">
                      &quot;{quote.content}&quot;
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {quote.authorProfile.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs py-0">
                        {quote.category.name}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </CardContent>
      
      {relatedQuotes.length > 0 && (
        <CardFooter className="px-6 py-4 border-t bg-muted/10">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/quotes?author=${authorProfileId}`}>
              <span className="flex items-center justify-center gap-1">
                Browse all quotes by {authorName}
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}