// components/home/RandomQuoteSidebar.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // Add useCallback import
import { RandomQuoteCard } from "@/components/quotes/RandomQuoteCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { getRandomQuote, refreshRandomQuote } from "@/actions/random-quote";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

interface RandomQuoteSidebarProps {
  initialQuote?: QuoteDisplayData;
  categoryId?: string;
  className?: string;
}

export function RandomQuoteSidebar({ 
  initialQuote, 
  categoryId,
  className 
}: RandomQuoteSidebarProps) {
  // State
  const [quote, setQuote] = useState<QuoteDisplayData | undefined>(initialQuote);
  const [isLoading, setIsLoading] = useState(!initialQuote);
  const [error, setError] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Memoize the fetch function with useCallback
  const fetchRandomQuote = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      const result = await getRandomQuote(categoryId);
      
      if (result.error) {
        setError(result.error.message);
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        });
      } else if (result.data?.quote) {
        setQuote(result.data.quote);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to fetch random quote");
      toast({
        title: "Error",
        description: "Failed to fetch random quote",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, toast]); // Include dependencies of fetchRandomQuote

  // Load initial quote if not provided
  useEffect(() => {
    if (!initialQuote) {
      fetchRandomQuote();
    }
  }, [initialQuote, fetchRandomQuote]); // Add fetchRandomQuote to dependency array

  // Refresh the quote with animation
  const handleRefreshQuote = async () => {
    try {
      setRefreshing(true);
      
      const result = await refreshRandomQuote(categoryId);
      
      if (result.error) {
        setError(result.error.message);
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        });
      } else if (result.data?.quote) {
        setQuote(result.data.quote);
        toast({
          title: "Quote Refreshed",
          description: "Here's a new inspirational quote for you"
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to refresh random quote",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={className}>
      <RandomQuoteCard 
        quote={quote}
        isLoading={isLoading}
        error={error}
        isCompact={true}
        refreshing={refreshing}
      />
      
      <div className="flex items-center justify-between mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshQuote} 
          disabled={isLoading || refreshing}
          className="text-xs"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", refreshing && "animate-spin")} />
          New Quote
        </Button>

        {quote && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs"
          >
            <Link href={`/quotes/${quote.slug}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper function from utils
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}