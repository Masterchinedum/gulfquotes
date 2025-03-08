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
   * Get related searches based on the user's input
   */
  async getRelatedSearches(query: string, limit: number = 5): Promise<SearchSuggestion[]> {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Get words from the query for more flexible matching
      const searchWords = normalizedQuery.split(' ')
        .filter(w => w.length > 2);
      
      // First get searches with similar words
      const relatedSearches = await db.searchEvent.findMany({
        where: {
          query: {
            not: normalizedQuery, // Exclude exact match
            mode: 'insensitive',
            contains: searchWords.length > 0 ? searchWords[0] : normalizedQuery
          },
          resultCount: {
            gt: 0 // Only include searches that had results
          }
        },
        select: {
          query: true,
          _count: {
            select: {
              clicks: true
            }
          }
        },
        orderBy: [
          // Fix the orderBy syntax to use the correct Prisma pattern
          { clicks: { _count: 'desc' } }, // Order by number of clicks in descending order
        ],
        distinct: ['query'],
        take: limit * 2 // Get more and filter
      });
      
      // De-duplicate and format
      const uniqueQueries = new Map<string, SearchSuggestion>();
      
      for (const search of relatedSearches) {
        if (!uniqueQueries.has(search.query)) {
          // Score based on popularity
          const clickScore = Math.min(search._count.clicks / 3, 1); // Max 1
          
          uniqueQueries.set(search.query, {
            query: search.query,
            score: 0.7 + (clickScore * 0.3) // Score between 0.7-1.0
          });
        }
      }
      
      // Return top suggestions
      return Array.from(uniqueQueries.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error("[SearchAnalytics] Error getting related searches:", error);
      return [];
    }
  }

  /**
   * Check if there's a spelling correction for the query
   */
  async getSpellingCorrection(query: string): Promise<string | null> {
    try {
      if (!query || query.length < 3) return null;
      
      // This is a basic implementation - consider using a proper spell checking library
      // or an external API for production
      const words = query.toLowerCase().trim().split(/\s+/);
      
      // Get successful queries to compare against
      const successfulQueries = await db.searchEvent.findMany({
        where: {
          resultCount: { gt: 3 } // Queries that had good results
        },
        select: { query: true },
        distinct: ['query'],
        orderBy: { query: 'asc' },
        take: 1000
      });
      
      // Build a map of successful query words
      const queryWords = new Set<string>();
      for (const item of successfulQueries) {
        item.query.toLowerCase().split(/\s+/).forEach(w => {
          if (w.length > 2) queryWords.add(w);
        });
      }
      
      // Check if any word might be misspelled
      let hasCorrection = false;
      const corrected = words.map(word => {
        // Skip short words
        if (word.length < 3) return word;
        
        // If word is already a known word, keep it
        if (queryWords.has(word)) return word;
        
        // Simple Levenshtein distance function to find similar words
        const similarWord = this.findSimilarWord(word, queryWords);
        if (similarWord && similarWord !== word) {
          hasCorrection = true;
          return similarWord;
        }
        
        return word;
      });
      
      return hasCorrection ? corrected.join(' ') : null;
    } catch (error) {
      console.error("[SearchAnalytics] Error checking spelling:", error);
      return null;
    }
  }

  /**
   * Find a similar word using Levenshtein distance
   * This is a simple implementation - consider using a dedicated library for this
   */
  private findSimilarWord(word: string, dictionary: Set<string>): string | null {
    const maxDistance = Math.min(2, Math.floor(word.length / 3));
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    
    // Compare word against dictionary
    for (const dictWord of dictionary) {
      // Skip words with very different lengths
      if (Math.abs(dictWord.length - word.length) > maxDistance) continue;
      
      const distance = this.levenshteinDistance(word, dictWord);
      
      if (distance < bestDistance && distance <= maxDistance) {
        bestDistance = distance;
        bestMatch = dictWord;
        
        // Exact match found
        if (distance === 0) break;
      }
    }
    
    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    // Initialize the matrix
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,       // deletion
          matrix[i][j-1] + 1,       // insertion
          matrix[i-1][j-1] + cost   // substitution
        );
      }
    }
    
    return matrix[a.length][b.length];
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