import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import type { CategoryQuotesParams } from "@/types/category";
import type { QuoteDisplayData } from "./types";
import { quoteLikeService } from "@/lib/services/like";
import { quoteBookmarkService } from "@/lib/services/bookmark";
import { Prisma } from "@prisma/client"; // Add this import

interface QuoteByCategoryResult {
  quotes: QuoteDisplayData[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
  categoryName: string;
  categorySlug: string;
  categoryDescription?: string | null;
}

class QuoteCategoryService {
  /**
   * Get quotes by category slug with pagination and sorting
   */
  async getQuotesByCategory({
    slug,
    page = 1,
    limit = 12,
    sortBy = "recent",
    userId
  }: CategoryQuotesParams & { userId?: string }): Promise<QuoteByCategoryResult> {
    try {
      // Validate the slug
      if (!slug) {
        throw new AppError("Category slug is required", "BAD_REQUEST", 400);
      }

      // Calculate pagination values
      const skip = (page - 1) * limit;
      const take = Math.min(50, Math.max(1, limit)); // Limit between 1-50

      // Find the category first to get its ID and verify it exists
      const category = await db.category.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true
        }
      });

      if (!category) {
        throw new AppError(`Category with slug '${slug}' not found`, "NOT_FOUND", 404);
      }

      // Determine sort order - replace 'any' with a proper Prisma type
      let orderBy: Prisma.QuoteOrderByWithRelationInput = {};
      switch (sortBy) {
        case "recent":
          orderBy = { createdAt: 'desc' };
          break;
        case "popular":
          orderBy = { likes: 'desc' };
          break;
        case "alphabetical":
          orderBy = { content: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      // Fetch quotes and total count in parallel
      const [quotes, total] = await Promise.all([
        db.quote.findMany({
          where: { categoryId: category.id },
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
                slug: true,
              }
            },
            gallery: {
              include: {
                gallery: true
              }
            },
            tags: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          skip,
          take,
          orderBy
        }),
        db.quote.count({
          where: { categoryId: category.id }
        })
      ]);

      // Transform quotes to match the QuoteDisplayData interface
      let transformedQuotes = quotes.map(quote => ({
        ...quote,
        authorProfile: {
          ...quote.authorProfile,
          image: quote.authorProfile.images?.[0]?.url || null,
          images: undefined,
          quoteCount: quote.authorProfile._count.quotes
        },
        isLiked: false,
        isBookmarked: false
      })) as QuoteDisplayData[];

      // Add like/bookmark status if userId is provided
      if (userId && transformedQuotes.length > 0) {
        const quoteIds = transformedQuotes.map(q => q.id);
        const [likeStatus, bookmarkStatus] = await Promise.all([
          quoteLikeService.getUserLikes(userId, quoteIds),
          quoteBookmarkService.getUserBookmarks(userId, quoteIds)
        ]);
        
        transformedQuotes = transformedQuotes.map(quote => ({
          ...quote,
          isLiked: likeStatus[quote.id] || false,
          isBookmarked: bookmarkStatus[quote.id] || false
        }));
      }

      return {
        quotes: transformedQuotes,
        total,
        hasMore: total > skip + quotes.length,
        page,
        limit: take,
        categoryName: category.name,
        categorySlug: category.slug,
        categoryDescription: category.description
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("[QUOTE_CATEGORY_SERVICE]", error);
      throw new AppError("Failed to fetch quotes for category", "INTERNAL_ERROR", 500);
    }
  }
}

// Export a singleton instance
export const quoteCategoryService = new QuoteCategoryService();