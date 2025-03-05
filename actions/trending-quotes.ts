// actions/trending-quotes.ts
'use server'

import { trendingQuoteService } from "@/lib/services/trending-quote.service";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { AppError } from "@/lib/api-error";
import { auth } from "@/auth";

// Define return type for trending quotes action
export interface TrendingQuotesActionResult {
  data?: QuoteDisplayData[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Get trending quotes server action
 * @param limit Maximum number of quotes to return (default: 6)
 */
export async function getTrendingQuotes(limit?: number): Promise<TrendingQuotesActionResult> {
  try {
    // Get trending quotes from service
    const trendingQuotes = await trendingQuoteService.getTrendingQuotes(limit);
    
    return {
      data: trendingQuotes
    };
  } catch (error) {
    console.error('Failed to fetch trending quotes:', error);
    
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
    
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch trending quotes'
      }
    };
  }
}

/**
 * Manually calculate new trending quotes (admin only)
 */
export async function calculateNewTrending(limit?: number): Promise<TrendingQuotesActionResult> {
  try {
    // Check authentication and authorization
    const session = await auth();
    
    if (!session?.user) {
      return {
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action'
        }
      };
    }

    if (session.user.role !== 'ADMIN') {
      return {
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can recalculate trending quotes'
        }
      };
    }

    // Calculate new trending quotes
    const newTrending = await trendingQuoteService.calculateTrendingQuotes(limit);

    return {
      data: newTrending
    };
  } catch (error) {
    console.error('Failed to calculate new trending quotes:', error);
    
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
    
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to calculate new trending quotes'
      }
    };
  }
}

/**
 * Force refresh trending quotes cache
 */
export async function refreshTrendingCache(): Promise<TrendingQuotesActionResult> {
  try {
    // Check authentication and authorization
    const session = await auth();
    
    // Fix: Remove the ! operator
    if (session?.user?.role !== 'ADMIN') {
      return {
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can refresh the trending cache'
        }
      };
    }

    // Invalidate cache and recalculate
    trendingQuoteService.invalidateCache();
    const newTrending = await trendingQuoteService.calculateTrendingQuotes();

    return {
      data: newTrending
    };
  } catch (error) {
    console.error('Failed to refresh trending cache:', error);
    
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
    
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh trending cache'
      }
    };
  }
}