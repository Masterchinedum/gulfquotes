import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { CategoryWithQuoteCount, ListCategoriesParams } from "@/types/category";

export class CategoryService {
  /**
   * Get all categories with optional filtering, sorting, and pagination
   */
  async getAllCategories({
    page = 1,
    limit = 10,
    search,
    sortBy = "name",
    order = "asc"
  }: ListCategoriesParams = {}) {
    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = Math.min(50, Math.max(1, limit)); // Limit between 1-50

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } }
      ]
    } : {};

    // Build order by clause based on params
    let orderBy = {};
    if (sortBy === "name") {
      orderBy = { name: order };
    } else if (sortBy === "recent") {
      orderBy = { createdAt: order };
    } else if (sortBy === "popular") {
      // For popular, we'll need to sort by quote count
      // This is handled separately
    }

    // Execute query to get total count
    const total = await db.category.count({ where });

    // Get categories with quote count
    let categories: CategoryWithQuoteCount[];
    
    if (sortBy === "popular") {
      // For popular sorting, we need to fetch all and sort manually by quote count
      categories = await db.category.findMany({
        where,
        include: {
          _count: {
            select: { quotes: true }
          }
        }
      });
      
      // Sort by quote count
      categories.sort((a, b) => {
        const countA = a._count.quotes;
        const countB = b._count.quotes;
        return order === "asc" ? countA - countB : countB - countA;
      });
      
      // Apply pagination manually
      categories = categories.slice(skip, skip + take);
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
    }

    // Calculate if there are more pages
    const hasMore = total > skip + take;

    return {
      items: categories,
      total,
      hasMore,
      page,
      limit: take
    };
  }

  /**
   * Get a category by slug with quote count
   */
  async getCategoryBySlug(slug: string): Promise<CategoryWithQuoteCount> {
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

  /**
   * Get popular categories with highest quote counts
   */
  async getPopularCategories(limit = 6): Promise<CategoryWithQuoteCount[]> {
    return await db.category.findMany({
      include: {
        _count: {
          select: { quotes: true }
        }
      },
      orderBy: {
        quotes: {
          _count: "desc"
        }
      },
      take: limit
    });
  }

  /**
   * Get quote count for a specific category
   */
  async getQuoteCountByCategory(categoryId: string): Promise<number> {
    const result = await db.quote.count({
      where: { categoryId }
    });
    
    return result;
  }
  
  /**
   * Get total number of categories
   */
  async getTotalCategoriesCount(): Promise<number> {
    return await db.category.count();
  }
}

// Export a singleton instance
export const categoryService = new CategoryService();