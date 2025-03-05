// hooks/use-trending-quotes.ts
import useSWR from "swr";
import { getTrendingQuotes } from "@/actions/trending-quotes";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

export interface TrendingQuotesResponse {
  data?: {
    quotes: QuoteDisplayData[];
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
 * Hook for fetching and managing trending quotes
 */
export function useTrendingQuotes({ 
  fallbackData, 
  limit = 6 
}: UseTrendingQuotesOptions = {}) {
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

  return {
    quotes: data?.data?.quotes || [],
    updatedAt: data?.data?.updatedAt,
    isLoading,
    isError: !!error,
    error: error?.message || data?.error?.message,
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