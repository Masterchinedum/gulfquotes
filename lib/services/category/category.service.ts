import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { CategoryWithQuoteCount, CategoryWithMetrics, ListCategoriesParams } from "@/types/category";
import { Prisma } from "@prisma/client";

// Define an interface for the raw query result
interface CategoryMetricResult {
  categoryId: string;
  totalLikes: bigint | null;  // SUM returns bigint in Prisma raw queries
  totalDownloads: bigint | null;
}

// Define cache structure
interface MetricsCache {
  timestamp: number;
  data: Map<string, { totalLikes: number, totalDownloads: number }>;
}

export class CategoryService {
  // Cache for metrics with a 5-minute expiration
  private metricsCache: MetricsCache | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  /**
   * Aggregates likes and downloads metrics for categories
   * @param categoryIds Array of category IDs to aggregate metrics for
   * @returns Map of category ID to metrics
   */
  private async aggregateCategoryMetrics(categoryIds: string[]): Promise<Map<string, { totalLikes: number, totalDownloads: number }>> {
    // If no categories, return empty map
    if (!categoryIds.length) return new Map();

    // Check if we have all requested categories in cache
    const cachedMetrics = this.getCachedMetrics(categoryIds);
    if (cachedMetrics) {
      return cachedMetrics;
    }

    // Cache miss or expired, use Prisma's raw query to efficiently aggregate metrics
    const results = await db.$queryRaw<CategoryMetricResult[]>`
      SELECT 
        "categoryId", 
        SUM("likes") as "totalLikes", 
        0 as "totalDownloads"
      FROM "quotes"
      WHERE "categoryId" IN (${Prisma.join(categoryIds)})
      GROUP BY "categoryId"
    `;

    // Create a map for quick lookup
    const metricsMap = new Map();
    for (const row of results) {
      metricsMap.set(row.categoryId, {
        totalLikes: Number(row.totalLikes) || 0, 
        totalDownloads: Number(row.totalDownloads) || 0
      });
    }
    
    // Set the metrics in cache
    this.updateMetricsCache(metricsMap);
    
    return metricsMap;
  }

  /**
   * Retrieves metrics from cache if still valid
   * @param categoryIds Array of category IDs to look up in cache
   * @returns Map of metrics or null if cache miss or expired
   */
  private getCachedMetrics(categoryIds: string[]): Map<string, { totalLikes: number, totalDownloads: number }> | null {
    // If no cache or cache is expired, return null
    if (!this.metricsCache || Date.now() - this.metricsCache.timestamp > this.CACHE_TTL) {
      return null;
    }

    // Check if all requested category IDs are in the cache
    const cachedData = this.metricsCache.data;
    const allCategoriesInCache = categoryIds.every(id => cachedData.has(id));
    
    if (!allCategoriesInCache) {
      return null;
    }

    // Return a subset of the cache containing only the requested categories
    const result = new Map();
    for (const id of categoryIds) {
      result.set(id, cachedData.get(id)!);
    }

    return result;
  }

  /**
   * Updates the metrics cache with new data
   * @param newMetrics Map of new metrics to add to the cache
   */
  private updateMetricsCache(newMetrics: Map<string, { totalLikes: number, totalDownloads: number }>): void {
    if (!this.metricsCache) {
      // Initialize cache if it doesn't exist
      this.metricsCache = {
        timestamp: Date.now(),
        data: new Map(newMetrics)
      };
    } else {
      // Update existing cache
      this.metricsCache.timestamp = Date.now();
      
      // Merge new metrics into existing cache
      for (const [key, value] of newMetrics.entries()) {
        this.metricsCache.data.set(key, value);
      }
    }
  }

  /**
   * Invalidates the metrics cache
   * This should be called when quotes are created, updated, or deleted
   */
  public invalidateMetricsCache(): void {
    this.metricsCache = null;
  }

  /**
   * Enriches categories with metrics
   * @param categories List of categories to enrich with metrics
   * @returns Categories with metrics added
   */
  private async addMetricsToCategories(categories: CategoryWithQuoteCount[]): Promise<CategoryWithMetrics[]> {
    if (!categories.length) return [];
    
    const categoryIds = categories.map(cat => cat.id);
    const metricsMap = await this.aggregateCategoryMetrics(categoryIds);
    
    return categories.map(category => ({
      ...category,
      totalLikes: metricsMap.get(category.id)?.totalLikes || 0,
      totalDownloads: metricsMap.get(category.id)?.totalDownloads || 0
    }));
  }

  /**
   * Get all categories with optional filtering, sorting, and pagination
   */
  async getAllCategories({
    page = 1,
    limit = 10,
    search,
    sortBy = "name",
    order = "asc"
  }: ListCategoriesParams = {}): Promise<{
    items: CategoryWithMetrics[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = Math.min(50, Math.max(1, limit)); // Limit between 1-50

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { slug: { contains: search, mode: Prisma.QueryMode.insensitive } }
      ]
    } : {};

    // Build order by clause based on params
    let orderBy = {};
    if (sortBy === "name") {
      orderBy = { name: order };
    } else if (sortBy === "recent") {
      orderBy = { createdAt: order };
    }
    // For metrics-based sorting, we'll handle manually after fetching

    // Execute query to get total count
    const total = await db.category.count({ where });

    // Get categories with quote count
    let categories: CategoryWithQuoteCount[];
    
    // For metrics-based or quote-count-based sorting, fetch all and sort manually
    if (["popular", "likes", "downloads"].includes(sortBy)) {
      categories = await db.category.findMany({
        where,
        include: {
          _count: {
            select: { quotes: true }
          }
        }
      });
      
      // Enrich categories with metrics data
      const enrichedCategories = await this.addMetricsToCategories(categories);
      
      // Sort based on the specified metric
      if (sortBy === "popular") {
        enrichedCategories.sort((a, b) => {
          const countA = a._count.quotes;
          const countB = b._count.quotes;
          return order === "asc" ? countA - countB : countB - countA;
        });
      } else if (sortBy === "likes") {
        enrichedCategories.sort((a, b) => {
          return order === "asc" ? a.totalLikes - b.totalLikes : b.totalLikes - a.totalLikes;
        });
      } else if (sortBy === "downloads") {
        enrichedCategories.sort((a, b) => {
          return order === "asc" ? a.totalDownloads - b.totalDownloads : b.totalDownloads - a.totalDownloads;
        });
      }
      
      // Apply pagination manually
      categories = enrichedCategories.slice(skip, skip + take);
    } else {
      // For other sorting methods, we can use Prisma's built-in ordering
      categories = await db.category.findMany({
        where,
        include: {
          _count: {
            select: { quotes: true }
          }
        },
        orderBy,
        skip,
        take
      });
      
      // Enrich with metrics for consistency in return type
      categories = await this.addMetricsToCategories(categories);
    }

    // Calculate if there are more pages
    const hasMore = total > skip + take;

    return {
      items: categories as CategoryWithMetrics[],
      total,
      hasMore,
      page,
      limit: take
    };
  }

  /**
   * Get popular categories with highest quote metrics
   * @param metric - Which metric to use for popularity (quotes, likes, downloads)
   * @param limit - Maximum number of categories to return
   */
  async getPopularCategoriesByMetric(
    metric: 'quotes' | 'likes' | 'downloads' = 'likes',
    limit = 6
  ): Promise<CategoryWithMetrics[]> {
    // First, get categories with quote counts
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { quotes: true }
        }
      }
    });
    
    // For metrics other than quote count, we need to add and sort by the metric
    if (metric !== 'quotes') {
      const enrichedCategories = await this.addMetricsToCategories(categories);
      
      // Sort by the specified metric
      if (metric === 'likes') {
        enrichedCategories.sort((a, b) => b.totalLikes - a.totalLikes);
      } else if (metric === 'downloads') {
        enrichedCategories.sort((a, b) => b.totalDownloads - a.totalDownloads);
      }
      
      return enrichedCategories.slice(0, limit);
    } else {
      // Sort by quote count and add empty metrics
      categories.sort((a, b) => b._count.quotes - a._count.quotes);
      
      // Add zero metrics
      return categories.slice(0, limit).map(cat => ({
        ...cat,
        totalLikes: 0,
        totalDownloads: 0
      }));
    }
  }

  // Keep existing methods unchanged
  async getCategoryBySlug(slug: string): Promise<CategoryWithQuoteCount> {
    // Existing implementation
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { quotes: true }
        }
      }
    });

    if (!category) {
      throw new AppError("Category not found", "NOT_FOUND", 404);
    }

    return category;
  }

  async getQuoteCountByCategory(categoryId: string): Promise<number> {
    // Existing implementation
    const result = await db.quote.count({
      where: { categoryId }
    });
    
    return result;
  }
  
  async getTotalCategoriesCount(): Promise<number> {
    // Existing implementation
    return await db.category.count();
  }
}

// Export a singleton instance
export const categoryService = new CategoryService();