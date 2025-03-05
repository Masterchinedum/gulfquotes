// lib/services/trending-quote.service.ts

import { Prisma, Quote } from "@prisma/client";
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { QuoteDisplayData } from "./public-quote/quote-display.service";
import { quoteDisplayService } from "./public-quote/quote-display.service";
import { randomUUID } from "crypto";

/**
 * Interface for trending quote service
 */
export interface TrendingQuoteService {
  /**
   * Calculate trending quotes based on likes in the past 24 hours
   * @param limit Maximum number of quotes to return
   */
  calculateTrendingQuotes(limit?: number): Promise<QuoteDisplayData[]>;
  
  /**
   * Get currently active trending quotes
   * @param limit Maximum number of quotes to return
   */
  getTrendingQuotes(limit?: number): Promise<QuoteDisplayData[]>;
  
  /**
   * Store the provided quotes as trending
   * @param quotes The quotes to store as trending
   */
  storeTrendingQuotes(quotes: QuoteDisplayData[]): Promise<void>;
  
  /**
   * Get previous trending quotes if no new trending quotes exist
   * @param limit Maximum number of quotes to return
   */
  getPreviousTrendingQuotes(limit?: number): Promise<QuoteDisplayData[]>;
}

type QuoteWithCount = Quote & {
  _count: {
    userLikes: number;
    comments: number;
  };
  authorProfile: {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    followers: number;
    images: { url: string }[];
    _count: {
      quotes: number;
    };
  };
  category: {
    name: string;
    slug: string;
  };
};

/**
 * Service for managing trending quotes functionality
 */
class TrendingQuoteServiceImpl implements TrendingQuoteService {
  /**
   * Calculate trending quotes based on likes in the past 24 hours
   * @param limit Maximum number of quotes to return (default: 6)
   */
  async calculateTrendingQuotes(limit = 6): Promise<QuoteDisplayData[]> {
    try {
      // Calculate the timestamp for 24 hours ago
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      // Use the Quote type from Prisma here
      const quotesWithRecentLikes = await db.quote.findMany({
        where: {
          userLikes: {
            some: {
              createdAt: {
                gte: oneDayAgo
              }
            }
          }
        },
        include: {
          authorProfile: {
            select: {
              id: true,
              name: true,
              slug: true,
              bio: true,
              followers: true,
              images: {
                select: { url: true },
                take: 1
              },
              _count: {
                select: { quotes: true }
              }
            }
          },
          category: {
            select: {
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              userLikes: {
                where: {
                  createdAt: {
                    gte: oneDayAgo
                  }
                }
              },
              comments: true
            }
          }
        },
        orderBy: [
          {
            userLikes: {
              _count: 'desc'
            }
          },
          {
            likes: 'desc'
          }
        ],
        take: limit
      }) as unknown as QuoteWithCount[]; // Add type assertion here
      
      // If no quotes have received likes in the past 24 hours, fall back to previous trending
      if (quotesWithRecentLikes.length === 0) {
        console.log("No trending quotes found in the last 24 hours, using previous trending");
        return this.getPreviousTrendingQuotes(limit);
      }
      
      // Transform quotes with proper metrics initialization
      const trendingQuotes = await Promise.all(quotesWithRecentLikes.map(async (quote: QuoteWithCount) => { // Update type here
        // Get full quote details using the display service
        const fullQuote = await quoteDisplayService.getQuoteBySlug(quote.slug);
        
        if (!fullQuote) {
          throw new AppError(`Quote with slug ${quote.slug} not found`, "NOT_FOUND", 404);
        }
        
        // Ensure all required metrics are present with default values
        return {
          ...fullQuote,
          metrics: {
            views: fullQuote.metrics?.views || 0,
            likes: fullQuote.metrics?.likes || quote.likes || 0,
            shares: fullQuote.metrics?.shares || 0,
            bookmarks: fullQuote.metrics?.bookmarks || quote.bookmarks || 0,
            recentLikes: quote._count.userLikes
          }
        } as QuoteDisplayData;
      }));
      
      // Store the new trending quotes
      await this.storeTrendingQuotes(trendingQuotes);
      
      return trendingQuotes;
    } catch (error) {
      console.error("Error calculating trending quotes:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to calculate trending quotes", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get currently active trending quotes
   * @param limit Maximum number of quotes to return (default: 6)
   */
  async getTrendingQuotes(limit = 6): Promise<QuoteDisplayData[]> {
    try {
      // Get the current active trending quotes
      const activeTrending = await db.trendingQuote.findMany({
        where: {
          isActive: true
        },
        include: {
          quote: {
            include: {
              authorProfile: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  bio: true,
                  images: {
                    select: { url: true },
                    take: 1
                  }
                }
              },
              category: true
            }
          }
        },
        orderBy: {
          rank: 'asc'
        },
        take: limit
      });
      
      // If no active trending quotes, calculate new ones
      if (activeTrending.length === 0) {
        return this.calculateTrendingQuotes(limit);
      }
      
      // Transform to QuoteDisplayData format
      const quotes = await Promise.all(activeTrending.map(async (trending) => {
        const quoteData = await quoteDisplayService.getQuoteBySlug(trending.quote.slug);
        return quoteData as QuoteDisplayData;
      }));
      
      // Filter out any null results
      return quotes.filter(Boolean);
    } catch (error) {
      console.error("Error getting trending quotes:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get trending quotes", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Store the provided quotes as trending
   * @param quotes The quotes to store as trending
   */
  async storeTrendingQuotes(quotes: QuoteDisplayData[]): Promise<void> {
    try {
      // Generate a unique batch ID
      const batchId = randomUUID();
      const now = new Date();
      
      // Use the TrendingQuote type from Prisma here
      const trendingQuoteData: Prisma.TrendingQuoteCreateInput[] = quotes.map((quote, index) => ({
        quote: { connect: { id: quote.id } },
        rank: index + 1,
        likeCount: quote.metrics?.likes || quote.likes || 0,
        batchId,
        batchDate: now,
        isActive: true
      }));

      await db.$transaction([
        db.trendingQuote.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        }),
        ...trendingQuoteData.map(data => 
          db.trendingQuote.create({ data })
        )
      ]);
    } catch (error) {
      console.error("Error storing trending quotes:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to store trending quotes", "INTERNAL_ERROR", 500);
    }
  }
  
  /**
   * Get previous trending quotes if no new trending quotes exist
   * @param limit Maximum number of quotes to return (default: 6)
   */
  async getPreviousTrendingQuotes(limit = 6): Promise<QuoteDisplayData[]> {
    try {
      // Find the most recent batch of trending quotes
      const latestBatch = await db.trendingQuote.findFirst({
        where: {
          isActive: false
        },
        orderBy: {
          batchDate: 'desc'
        },
        select: {
          batchId: true
        }
      });
      
      if (!latestBatch) {
        // If no previous batches exist, fall back to most liked quotes of all time
        const fallbackQuotes = await db.quote.findMany({
          orderBy: {
            likes: 'desc'
          },
          include: {
            authorProfile: {
              select: {
                id: true,
                name: true,
                slug: true,
                bio: true,
                images: {
                  select: { url: true },
                  take: 1
                }
              }
            },
            category: true
          },
          take: limit
        });
        
        // Transform to QuoteDisplayData format
        return await Promise.all(fallbackQuotes.map(async (quote) => {
          return await quoteDisplayService.getQuoteBySlug(quote.slug) as QuoteDisplayData;
        }));
      }
      
      // Get quotes from the most recent batch
      const previousTrending = await db.trendingQuote.findMany({
        where: {
          batchId: latestBatch.batchId
        },
        include: {
          quote: {
            include: {
              authorProfile: {
                select: {
                  id: true,
                  name: true, 
                  slug: true,
                  bio: true,
                  images: {
                    select: { url: true },
                    take: 1
                  }
                }
              },
              category: true
            }
          }
        },
        orderBy: {
          rank: 'asc'
        },
        take: limit
      });
      
      // Transform to QuoteDisplayData format
      return await Promise.all(previousTrending.map(async (trending) => {
        return await quoteDisplayService.getQuoteBySlug(trending.quote.slug) as QuoteDisplayData;
      }));
    } catch (error) {
      console.error("Error getting previous trending quotes:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to get previous trending quotes", "INTERNAL_ERROR", 500);
    }
  }
}

// Export singleton instance
export const trendingQuoteService = new TrendingQuoteServiceImpl();