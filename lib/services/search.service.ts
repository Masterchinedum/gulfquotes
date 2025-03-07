import { Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import type { 
  SearchParams, 
  SearchResult,
  SearchResponse,
  SearchType,
  SearchFacets,

} from "@/types/search";
// import { add, sub, isSameDay, isSameMonth, isSameYear } from "date-fns";

class SearchServiceImpl {
  // Enhanced relevance scoring with optional boosts
  private calculateScore(
    matchType: string, 
    text: string, 
    query: string, 
    type: string,
    relevanceSettings?: { 
      boostExactMatches?: boolean;
      boostTitleMatches?: boolean;
    }
  ): number {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    // Base scores by type priority
    const typeScores = {
      quotes: 3,
      authors: 2,
      users: 1
    };

    let score = typeScores[type as keyof typeof typeScores] || 0;

    // Add match quality score
    if (normalizedText === normalizedQuery) {
      // Apply exact match boost if enabled
      score += relevanceSettings?.boostExactMatches ? 3 : 2; // Higher boost for exact match
    } else if (normalizedText.includes(normalizedQuery)) {
      score += 1; // Partial match
    }

    // Boost score for content matches in quotes
    if (type === "quotes" && matchType === "content") {
      score *= 1.5;
    }

    // Boost title/name matches if enabled
    if (relevanceSettings?.boostTitleMatches && matchType === "name") {
      score *= 1.3;
    }

    return score;
  }

  async search({
    q,
    type = "all",
    page = 1,
    limit = 10,
    filters,
    sort,
    includeFacets,
    relevance
  }: SearchParams): Promise<SearchResponse> {
    const skip = (page - 1) * limit;
    const searchQuery = q.trim();
    
    try {
      // Build category filters
      const categoryFilter = filters?.categories?.length 
        ? { id: { in: filters.categories } } 
        : undefined;
        
      // Build author filters
      const authorFilter = filters?.authors?.length 
        ? { id: { in: filters.authors } } 
        : undefined;
        
      // Build tag filters
      const tagFilter = filters?.tags?.length 
        ? { some: { id: { in: filters.tags } } } 
        : undefined;
        
      // Build date range filter
      const dateFilter: Prisma.DateTimeFilter | undefined = 
        filters?.dateRange?.from || filters?.dateRange?.to
          ? {
              ...(filters.dateRange.from && { gte: new Date(filters.dateRange.from) }),
              ...(filters.dateRange.to && { lte: new Date(filters.dateRange.to) })
            }
          : undefined;

      // Default sorting is by relevance, but we'll adjust the database queries
      // based on the sort parameter
      const sortField = sort?.field || "relevance";
      const sortDirection = sort?.direction || "desc";
      
      // Run queries in parallel with enhanced filtering
      const [quotes, authors, users, facets] = await Promise.all([
        // Quotes query
        type === "all" || type === "quotes"
          ? db.quote.findMany({
              where: {
                OR: [
                  { content: { contains: searchQuery, mode: "insensitive" } },
                  { authorProfile: { name: { contains: searchQuery, mode: "insensitive" } } },
                  { category: { name: { contains: searchQuery, mode: "insensitive" } } }
                ],
                // Apply filters
                ...(categoryFilter && { category: categoryFilter }),
                ...(authorFilter && { authorProfile: authorFilter }),
                ...(tagFilter && { tags: tagFilter }),
                ...(dateFilter && { createdAt: dateFilter }),
                ...(filters?.featured && { featured: true })
              },
              include: {
                authorProfile: true,
                category: true,
                tags: {
                  select: { id: true, name: true }
                }
              },
              // Apply sorting if it's not relevance (which we handle in memory)
              ...(sortField === "date" && {
                orderBy: { createdAt: sortDirection }
              }),
              ...(sortField === "alphabetical" && {
                orderBy: { content: sortDirection }
              }),
              ...(sortField === "popularity" && {
                orderBy: { likes: sortDirection }
              }),
              take: type === "all" ? Math.floor(limit * 1.5) : limit,
              skip: sortField === "relevance" ? 0 : skip, // Skip only if sorting in database
            })
          : [],

        // Authors query
        type === "all" || type === "authors"
          ? db.authorProfile.findMany({
              where: {
                OR: [
                  { name: { contains: searchQuery, mode: "insensitive" } },
                  { bio: { contains: searchQuery, mode: "insensitive" } }
                ],
                ...(dateFilter && { createdAt: dateFilter })
              },
              // Apply sorting if applicable
              ...(sortField === "date" && {
                orderBy: { createdAt: sortDirection }
              }),
              ...(sortField === "alphabetical" && {
                orderBy: { name: sortDirection }
              }),
              ...(sortField === "popularity" && {
                orderBy: { followers: sortDirection }
              }),
              take: type === "all" ? Math.floor(limit * 1.2) : limit,
              skip: sortField === "relevance" ? 0 : skip,
            })
          : [],

        // Users query
        type === "all" || type === "users"
          ? db.user.findMany({
              where: {
                name: { contains: searchQuery, mode: "insensitive" },
                ...(dateFilter && { 
                  // Use a valid field that exists on the User model
                  // Assuming the User model has updatedAt
                  updatedAt: dateFilter 
                })
              },
              select: {
                id: true,
                name: true,
                image: true,
                // Remove createdAt from select if it's not part of the User model
              },
              ...(sortField === "date" && {
                orderBy: { 
                  // Use a valid date field that exists on User model
                  updatedAt: sortDirection 
                }
              }),
              ...(sortField === "alphabetical" && {
                orderBy: { name: sortDirection }
              }),
              take: limit,
              skip: sortField === "relevance" ? 0 : skip,
            })
          : [],
          
        // Generate facets if requested
        this.generateFacets(searchQuery, type, includeFacets)
      ]);

      // Transform and score results with improved relevance
      const results: SearchResult[] = [
        ...quotes.map(quote => ({
          id: quote.id,
          type: "quotes" as const,
          matchedOn: quote.content.toLowerCase().includes(searchQuery.toLowerCase()) 
            ? "content" 
            : "metadata",
          score: this.calculateScore(
            quote.content.toLowerCase().includes(searchQuery.toLowerCase()) ? "content" : "metadata",
            quote.content,
            searchQuery,
            "quotes",
            relevance
          ),
          data: {
            content: quote.content,
            slug: quote.slug,
            authorName: quote.authorProfile.name,
            category: quote.category.name
          }
        })),

        ...authors.map(author => ({
          id: author.id,
          type: "authors" as const,
          matchedOn: author.name.toLowerCase().includes(searchQuery.toLowerCase()) ? "name" : "bio",
          score: this.calculateScore(
            author.name.toLowerCase().includes(searchQuery.toLowerCase()) ? "name" : "bio",
            author.name,
            searchQuery,
            "authors",
            relevance
          ),
          data: {
            name: author.name,
            slug: author.slug,
            bio: author.bio
          }
        })),

        ...users.map(user => ({
          id: user.id,
          type: "users" as const,
          matchedOn: "name",
          score: this.calculateScore(
            "name",
            user.name || "",
            searchQuery,
            "users",
            relevance
          ),
          data: {
            name: user.name || "",
            image: user.image
          }
        }))
      ];

      // Handle sorting
      let sortedResults: SearchResult[];
      
      if (sortField === "relevance") {
        // Sort by calculated relevance score
        sortedResults = results.sort((a, b) => 
          sortDirection === "desc" ? b.score - a.score : a.score - b.score
        );
      } else {
        // Results are already sorted by the database for other sort types
        sortedResults = results;
      }
      
      // Apply limit after sorting if using relevance
      if (sortField === "relevance") {
        sortedResults = sortedResults.slice(skip, skip + limit);
      }

      const total = results.length;
      const hasMore = total > skip + sortedResults.length;

      // Return results with facets if requested
      return {
        results: sortedResults,
        total,
        page,
        limit,
        hasMore,
        ...(facets && { facets })
      };

    } catch (error) {
      console.error("[SearchService]", error);
      throw error;
    }
  }

  // Generate facets for filtering and metrics
  private async generateFacets(
    searchQuery: string, 
    type: SearchType,
    includeFacets?: { 
      categories?: boolean; 
      authors?: boolean;
      tags?: boolean;
      dates?: boolean;
    }
  ): Promise<SearchFacets | null> {
    if (!includeFacets) return null;
    
    const facets: SearchFacets = {};
    
    try {
      // Generate category facets if requested
      if (includeFacets.categories && (type === "all" || type === "quotes")) {
        const categoryFacets = await db.category.findMany({
          where: {
            quotes: {
              some: {
                OR: [
                  { content: { contains: searchQuery, mode: "insensitive" } },
                  { authorProfile: { name: { contains: searchQuery, mode: "insensitive" } } }
                ]
              }
            }
          },
          include: {
            _count: { select: { quotes: true } }
          }
        });
        
        facets.categories = categoryFacets.map(category => ({
          id: category.id,
          name: category.name,
          count: category._count.quotes
        }));
      }
      
      // Generate author facets if requested
      if (includeFacets.authors && (type === "all" || type === "quotes")) {
        const authorFacets = await db.authorProfile.findMany({
          where: {
            quotes: {
              some: {
                content: { contains: searchQuery, mode: "insensitive" }
              }
            }
          },
          include: {
            _count: { select: { quotes: true } }
          }
        });
        
        facets.authors = authorFacets.map(author => ({
          id: author.id,
          name: author.name,
          count: author._count.quotes
        }));
      }
      
      // Generate tag facets if requested
      if (includeFacets.tags && (type === "all" || type === "quotes")) {
        const tagFacets = await db.tag.findMany({
          where: {
            quotes: {
              some: {
                content: { contains: searchQuery, mode: "insensitive" }
              }
            }
          },
          include: {
            _count: { select: { quotes: true } }
          }
        });
        
        facets.tags = tagFacets.map(tag => ({
          id: tag.id,
          name: tag.name,
          count: tag._count.quotes
        }));
      }
      
      // Generate date-based facets if requested
      if (includeFacets.dates) {
        const now = new Date();
        const thisWeekStart = sub(now, { days: 7 });
        const thisMonthStart = sub(now, { months: 1 });
        const thisYearStart = sub(now, { years: 1 });
        
        // Get counts for each date range
        const [thisWeekCount, thisMonthCount, thisYearCount, olderCount] = await Promise.all([
          // Count items from past week
          this.getDateRangeCount(searchQuery, type, thisWeekStart, now),
          
          // Count items from past month
          this.getDateRangeCount(searchQuery, type, thisMonthStart, now),
          
          // Count items from past year
          this.getDateRangeCount(searchQuery, type, thisYearStart, now),
          
          // Count older items
          this.getDateRangeCount(searchQuery, type, undefined, thisYearStart)
        ]);
        
        facets.dates = {
          thisWeek: thisWeekCount,
          thisMonth: thisMonthCount,
          thisYear: thisYearCount,
          older: olderCount
        };
      }
      
      return Object.keys(facets).length > 0 ? facets : null;
      
    } catch (error) {
      console.error("[SearchService:generateFacets]", error);
      return null;
    }
  }
  
  // Helper method to get counts for date-based facets
  private async getDateRangeCount(
    searchQuery: string, 
    type: SearchType,
    from?: Date, 
    to?: Date
  ): Promise<number> {
    const dateCondition = {
      ...(from && { gte: from }),
      ...(to && { lt: to })
    };
    
    if (Object.keys(dateCondition).length === 0) return 0;
    
    let count = 0;
    
    try {
      // For quotes
      if (type === "all" || type === "quotes") {
        count += await db.quote.count({
          where: {
            OR: [
              { content: { contains: searchQuery, mode: "insensitive" } },
              { authorProfile: { name: { contains: searchQuery, mode: "insensitive" } } },
              { category: { name: { contains: searchQuery, mode: "insensitive" } } }
            ],
            createdAt: dateCondition
          }
        });
      }
      
      // For authors
      if (type === "all" || type === "authors") {
        count += await db.authorProfile.count({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { bio: { contains: searchQuery, mode: "insensitive" } }
            ],
            createdAt: dateCondition
          }
        });
      }
      
      // For users
      if (type === "all" || type === "users") {
        count += await db.user.count({
          where: {
            name: { contains: searchQuery, mode: "insensitive" },
            ...(dateCondition && {
              // Use a valid date field that exists on the User model
              updatedAt: dateCondition
            })
          }
        });
      }
      
      return count;
    } catch (error) {
      console.error("[SearchService:getDateRangeCount]", error);
      return 0;
    }
  }
}

export const searchService = new SearchServiceImpl();