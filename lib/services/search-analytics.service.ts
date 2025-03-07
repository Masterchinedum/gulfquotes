import { Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import { AppError } from "@/lib/exceptions";
import { SearchResult, SearchType } from "@/types/search";

/**
 * Types for analytics data structures
 */
// Event data for tracking searches
type SearchEventData = {
  query: string;
  type?: SearchType;
  userId?: string;
  filters?: Record<string, unknown>; 
  resultCount: number;
  timestamp: Date;
}

// Event data for tracking search result clicks
type SearchClickEventData = {
  searchId: string;
  resultId: string;
  resultType: SearchType;
  position: number;
  userId?: string;
  timestamp: Date;
}

interface PopularSearch {
  query: string;
  count: number;
  lastSearched: Date;
}

interface SearchSuggestion {
  query: string;
  score: number;
}

/**
 * Service for tracking search analytics and providing suggestions
 */
class SearchAnalyticsServiceImpl {
  // Cache for popular searches to reduce DB queries
  private popularSearchesCache: PopularSearch[] = [];
  private cacheExpiryTime: Date = new Date();
  private readonly CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes
  
  /**
   * Track a search query event
   */
  async trackSearch(
    query: string,
    resultCount: number,
    options?: {
      type?: SearchType;
      userId?: string;
      filters?: Record<string, unknown>;
    }
  ): Promise<string> {
    try {
      // Create event data object (using our type)
      const eventData: SearchEventData = {
        query: query.toLowerCase().trim(),
        type: options?.type || "all",
        userId: options?.userId,
        filters: options?.filters,
        resultCount,
        timestamp: new Date()
      };
      
      // Create search event record
      const searchEvent = await db.searchEvent.create({
        data: {
          query: eventData.query,
          type: eventData.type,
          userId: eventData.userId,
          filters: eventData.filters as Prisma.JsonObject,
          resultCount: eventData.resultCount,
          createdAt: eventData.timestamp
        }
      });

      // Update popular searches (non-blocking)
      this.updatePopularSearch(query).catch(err => 
        console.error("Error updating popular searches:", err)
      );

      return searchEvent.id;
    } catch (error) {
      console.error("[SearchAnalytics] Error tracking search:", error);
      // Don't fail the user's search if analytics tracking fails
      return "";
    }
  }

  /**
   * Track when a user clicks on a search result
   */
  async trackResultClick(
    searchId: string,
    result: SearchResult,
    position: number,
    userId?: string
  ): Promise<void> {
    try {
      if (!searchId) return; // Skip if no searchId (analytics tracking failed)
      
      // Create click event data object (using our type)
      const clickData: SearchClickEventData = {
        searchId,
        resultId: result.id,
        resultType: result.type,
        position,
        userId,
        timestamp: new Date()
      };
      
      await db.searchClick.create({
        data: {
          searchEventId: clickData.searchId,
          resultId: clickData.resultId,
          resultType: clickData.resultType,
          position: clickData.position,
          userId: clickData.userId,
          createdAt: clickData.timestamp
        }
      });
      
      // Increase result relevance score based on click (improves future search quality)
      await this.incrementResultRelevance(result.id, result.type, position);
    } catch (error) {
      console.error("[SearchAnalytics] Error tracking click:", error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Get popular searches from the last few days
   */
  async getPopularSearches(limit: number = 10): Promise<PopularSearch[]> {
    try {
      // Use cache if it's still valid
      if (this.popularSearchesCache.length > 0 && new Date() < this.cacheExpiryTime) {
        return this.popularSearchesCache.slice(0, limit);
      }

      // Calculate date for recent searches (last 7 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      
      // Get popular searches with aggregation
      const popularSearches = await db.$queryRaw<PopularSearch[]>`
        SELECT 
          query, 
          COUNT(*) as count, 
          MAX(created_at) as "lastSearched"
        FROM 
          search_event
        WHERE 
          created_at > ${recentDate}
        GROUP BY 
          query
        ORDER BY 
          count DESC, "lastSearched" DESC
        LIMIT ${limit}
      `;
      
      // Update cache
      this.popularSearchesCache = popularSearches;
      this.cacheExpiryTime = new Date(Date.now() + this.CACHE_TTL_MS);
      
      return popularSearches;
    } catch (error) {
      console.error("[SearchAnalytics] Error getting popular searches:", error);
      return [];
    }
  }

  /**
   * Generate search suggestions based on the user's input
   */
  async getSuggestions(partialQuery: string, limit: number = 5): Promise<SearchSuggestion[]> {
    try {
      if (!partialQuery || partialQuery.length < 2) {
        return [];
      }

      const normalizedQuery = partialQuery.toLowerCase().trim();
      
      // Get similar searches from past queries
      const suggestions = await db.searchEvent.findMany({
        where: {
          query: {
            contains: normalizedQuery,
            mode: 'insensitive'
          },
          resultCount: {
            gt: 0 // Only suggest queries that returned results
          }
        },
        select: {
          query: true,
          _count: {
            select: {
              clicks: true // Count how many results were clicked for this query
            }
          }
        },
        orderBy: [
          { query: normalizedQuery ? 'asc' : undefined }, // Exact matches first
          { clicks: { _count: 'desc' } }                  // Then by click count
        ],
        take: limit * 2 // Get more and filter
      });
      
      // De-duplicate and score the suggestions
      const uniqueQueries = new Map<string, SearchSuggestion>();
      
      for (const suggestion of suggestions) {
        if (!uniqueQueries.has(suggestion.query)) {
          // Score based on exact match and click count
          const isExactMatch = suggestion.query === normalizedQuery;
          const clickScore = Math.min(suggestion._count.clicks / 5, 1); // Max 1
          const score = (isExactMatch ? 1 : 0.5) + (clickScore * 0.5);
          
          uniqueQueries.set(suggestion.query, {
            query: suggestion.query,
            score
          });
        }
      }
      
      // Sort by score and limit
      return Array.from(uniqueQueries.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error("[SearchAnalytics] Error getting suggestions:", error);
      return [];
    }
  }

  /**
   * Get search analytics data for admin dashboard
   */
  async getAnalytics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const [totalSearches, topQueries, topNoResultQueries, clickThroughRate] = await Promise.all([
        // Total searches in the period
        db.searchEvent.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        }),
        
        // Top queries with results
        db.$queryRaw<{query: string, count: number}[]>`
          SELECT 
            query, 
            COUNT(*) as count
          FROM 
            search_event
          WHERE 
            created_at >= ${startDate}
            AND result_count > 0
          GROUP BY 
            query
          ORDER BY 
            count DESC
          LIMIT 10
        `,
        
        // Top queries with NO results
        db.$queryRaw<{query: string, count: number}[]>`
          SELECT 
            query, 
            COUNT(*) as count
          FROM 
            search_event
          WHERE 
            created_at >= ${startDate}
            AND result_count = 0
          GROUP BY 
            query
          ORDER BY 
            count DESC
          LIMIT 10
        `,
        
        // Click-through rate
        db.$queryRaw<{rate: number}[]>`
          SELECT 
            CAST(COUNT(DISTINCT sc.id) AS FLOAT) / 
            CAST(NULLIF(COUNT(DISTINCT se.id), 0) AS FLOAT) as rate
          FROM 
            search_event se
          LEFT JOIN 
            search_click sc ON se.id = sc.search_event_id
          WHERE 
            se.created_at >= ${startDate}
        `
      ]);
      
      return {
        totalSearches,
        topQueries,
        topNoResultQueries,
        clickThroughRate: clickThroughRate[0]?.rate || 0,
        period: {
          start: startDate,
          end: new Date()
        }
      };
    } catch (error) {
      console.error("[SearchAnalytics] Error getting analytics:", error);
      throw new AppError("Failed to get search analytics", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Update the record of popular searches when a new search is performed
   */
  private async updatePopularSearch(query: string): Promise<void> {
    const normalizedQuery = query.toLowerCase().trim();
    
    await db.popularSearch.upsert({
      where: {
        query: normalizedQuery
      },
      update: {
        count: {
          increment: 1
        },
        lastSearched: new Date()
      },
      create: {
        query: normalizedQuery,
        count: 1,
        lastSearched: new Date()
      }
    });
    
    // Invalidate cache
    this.cacheExpiryTime = new Date();
  }

  /**
   * Increase the relevance score for a result that was clicked
   */
  private async incrementResultRelevance(
    resultId: string,
    resultType: SearchType,
    position: number
  ): Promise<void> {
    // Calculate score boost based on position (higher positions get lower boost)
    const positionScore = Math.max(1, 10 - position) / 10;
    
    // Apply the boost based on result type
    switch (resultType) {
      case "quotes":
        await db.quoteRelevance.upsert({
          where: { quoteId: resultId },
          update: {
            score: {
              increment: positionScore
            },
            clickCount: {
              increment: 1
            }
          },
          create: {
            quoteId: resultId,
            score: positionScore,
            clickCount: 1
          }
        });
        break;
        
      case "authors":
        await db.authorRelevance.upsert({
          where: { authorId: resultId },
          update: {
            score: {
              increment: positionScore
            },
            clickCount: {
              increment: 1
            }
          },
          create: {
            authorId: resultId,
            score: positionScore,
            clickCount: 1
          }
        });
        break;
        
      case "users":
        // Optionally track user profile relevance
        // Implementation would be similar to above
        break;
    }
  }
}

// Export a singleton instance
export const searchAnalyticsService = new SearchAnalyticsServiceImpl();