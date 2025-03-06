// hooks/use-trending-quotes.ts
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getTrendingQuotes } from "@/actions/trending-quotes";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

// Enhanced interface to include comment count and like status
export interface EnhancedQuoteDisplayData extends QuoteDisplayData {
  commentCount?: number;
  isLiked?: boolean;
}

export interface TrendingQuotesResponse {
  data?: {
    quotes: EnhancedQuoteDisplayData[];
    updatedAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface UseTrendingQuotesOptions {
  fallbackData?: TrendingQuotesResponse;
  limit?: number;
}

/**
 * Enhanced hook for fetching and managing trending quotes with comment counts and like status
 */
export function useTrendingQuotes({ 
  fallbackData, 
  limit = 6 
}: UseTrendingQuotesOptions = {}) {
  const { status, data: session } = useSession();
  const [enhancedQuotes, setEnhancedQuotes] = useState<EnhancedQuoteDisplayData[]>([]);
  
  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<TrendingQuotesResponse>(
    `/api/quotes/trending?limit=${limit}`,
    async () => {
      const result = await getTrendingQuotes(limit);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return {
        data: {
          quotes: result.data || [],
          updatedAt: new Date().toISOString()
        }
      };
    },
    {
      fallbackData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 300000, // 5 minutes
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  // Enhanced data fetching for comment counts and like status
  useEffect(() => {
    const fetchEnhancedData = async () => {
      if (!data?.data?.quotes.length) return;
      
      const quotes = [...data.data.quotes];
      const quoteIds = quotes.map(quote => quote.id);
      
      try {
        // Fetch comment counts for all quotes in one request
        const commentCountsResponse = await fetch('/api/quotes/comment-counts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quoteIds })
        });
        
        if (commentCountsResponse.ok) {
          const commentCountsData = await commentCountsResponse.json();
          
          // Apply comment counts to quotes
          quotes.forEach(quote => {
            quote.commentCount = commentCountsData.data[quote.id] || 0;
          });
        }
        
        // If authenticated, fetch like status
        if (status === 'authenticated' && session?.user?.id) {
          const likeStatusResponse = await fetch('/api/quotes/like-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quoteIds })
          });
          
          if (likeStatusResponse.ok) {
            const likeStatusData = await likeStatusResponse.json();
            
            // Apply like status to quotes
            quotes.forEach(quote => {
              quote.isLiked = likeStatusData.data[quote.id] || false;
            });
          }
        }
        
        setEnhancedQuotes(quotes);
      } catch (error) {
        console.error('Error fetching enhanced quote data:', error);
        // Fall back to basic quotes without enhancement
        setEnhancedQuotes(quotes);
      }
    };
    
    fetchEnhancedData();
  }, [data, status, session]);

  return {
    quotes: enhancedQuotes.length > 0 ? enhancedQuotes : (data?.data?.quotes || []),
    updatedAt: data?.data?.updatedAt,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error?.message,
    isAuthenticated: status === 'authenticated',
    refresh: () => mutate()
  };
}

// Export additional utility hooks
export function useTrendingQuote(id: string) {
  const { quotes, ...rest } = useTrendingQuotes();
  const quote = quotes.find(q => q.id === id);

  return {
    quote,
    ...rest
  };
}