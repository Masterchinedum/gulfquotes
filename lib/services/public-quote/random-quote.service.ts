// lib/services/public-quote/random-quote.service.ts
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { quoteDisplayService } from "./quote-display.service";
import type { QuoteDisplayData } from "./quote-display.service";
import { Prisma } from "@prisma/client";

// Cache interface
interface RandomQuoteCache {
  data: QuoteDisplayData;
  timestamp: number;
  categoryId?: string;
}

/**
 * Interface for random quote service
 */
export interface RandomQuoteService {
  /**
   * Get a random quote
   * @param categoryId Optional category ID to filter quotes by category
   */
  getRandomQuote(categoryId?: string): Promise<QuoteDisplayData>;
  
  /**
   * Refresh the random quote cache
   * @param categoryId Optional category ID to filter quotes by category
   */
  refreshRandomQuote(categoryId?: string): Promise<QuoteDisplayData>;
  
  /**
   * Invalidate the cache
   */
  invalidateCache(): void;
}

/**
 * Service for managing random quotes functionality
 */
class RandomQuoteServiceImpl implements RandomQuoteService {
  private cache: Map<string, RandomQuoteCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  
  /**
   * Check if cache is valid for the given category
   */
  private isCacheValid(categoryId?: string): boolean {
    const cacheKey = categoryId || 'default';
    const cacheEntry = this.cache.get(cacheKey);
    if (!cacheEntry) return false;
    
    const now = Date.now();
    return (now - cacheEntry.timestamp) < this.CACHE_TTL;
  }
  
  /**
   * Get quote from cache if valid
   */
  private getCachedQuote(categoryId?: string): QuoteDisplayData | null {
    const cacheKey = categoryId || 'default';
    if (!this.isCacheValid(categoryId)) return null;
    
    return this.cache.get(cacheKey)?.data || null;
  }
  
  /**
   * Set quote in cache
   */
  private setCacheQuote(quote: QuoteDisplayData, categoryId?: string): void {
    const cacheKey = categoryId || 'default';
    this.cache.set(cacheKey, {
      data: quote,
      timestamp: Date.now(),
      categoryId
    });
  }
  
  /**
   * Get a random quote
   * @param categoryId Optional category ID to filter quotes by category
   */
  async getRandomQuote(categoryId?: string): Promise<QuoteDisplayData> {
    try {
      // Check cache first
      const cached = this.getCachedQuote(categoryId);
      if (cached) {
        console.log("Returning random quote from cache");
        return cached;
      }

      // Build base query conditions
      const baseConditions: Prisma.QuoteWhereInput = {
        content: {
          not: "",
        },
        // We'll ensure these fields are not null by using the proper syntax
        authorProfileId: { not: undefined },
        categoryId: { not: undefined },
      };

      // Add category filter if provided
      if (categoryId) {
        baseConditions.categoryId = categoryId;
      }

      // APPROACH 1: Try to find high-quality quotes with background images
      const highQualityConditions: Prisma.QuoteWhereInput = {
        ...baseConditions,
        content: {
          // Replace spread with explicit properties
          not: "",  // Copy the original property manually
          contains: " ", // Add the new property for content length check
        },
        // For background image, we can't use NOT null, so we use "not equals empty string"
        backgroundImage: { 
          not: "" 
        }
      };

      // Count high quality quotes
      const highQualityCount = await db.quote.count({ where: highQualityConditions });

      // If we have high quality quotes, use them
      if (highQualityCount > 0) {
        // Get a random index
        const randomIndex = Math.floor(Math.random() * highQualityCount);
        
        // Fetch a random quote using the random index
        const randomQuote = await db.quote.findMany({
          where: highQualityConditions,
          take: 1,
          skip: randomIndex,
          select: { slug: true }
        });
        
        if (randomQuote.length) {
          const quote = await quoteDisplayService.getQuoteBySlug(randomQuote[0].slug);
          
          if (quote) {
            // Check minimum content length
            if (quote.content.length >= 20) {
              // Cache and return the quote
              this.setCacheQuote(quote, categoryId);
              return quote;
            }
          }
        }
      }

      // APPROACH 2: FALLBACK - Try any quotes without requiring a background image
      const fallbackCount = await db.quote.count({ where: baseConditions });
      
      if (fallbackCount === 0) {
        throw new AppError(
          categoryId 
            ? "No quotes found in this category" 
            : "No quotes available", 
          "NOT_FOUND", 
          404
        );
      }
      
      // Get a random index for the fallback quotes
      const randomIndex = Math.floor(Math.random() * fallbackCount);
      
      // Fetch a random quote using the random index
      const randomQuote = await db.quote.findMany({
        where: baseConditions,
        take: 1,
        skip: randomIndex,
        select: { slug: true }
      });
      
      if (!randomQuote.length) {
        throw new AppError("Failed to get random quote", "NOT_FOUND", 404);
      }
      
      const quote = await quoteDisplayService.getQuoteBySlug(randomQuote[0].slug);
      
      if (!quote) {
        throw new AppError("Quote data not found", "NOT_FOUND", 404);
      }
      
      // Cache the result
      this.setCacheQuote(quote, categoryId);
      
      return quote;
    } catch (error) {
      console.error("Error getting random quote:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get random quote", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Force refresh the random quote cache
   * @param categoryId Optional category ID to filter quotes by category
   */
  async refreshRandomQuote(categoryId?: string): Promise<QuoteDisplayData> {
    // Remove from cache to force a refresh
    const cacheKey = categoryId || 'default';
    this.cache.delete(cacheKey);
    
    // Get a new random quote
    return this.getRandomQuote(categoryId);
  }
  
  /**
   * Clear the cache
   */
  public invalidateCache(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const randomQuoteService = new RandomQuoteServiceImpl();