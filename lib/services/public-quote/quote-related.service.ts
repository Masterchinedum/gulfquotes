import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import type { Quote, Category, AuthorProfile } from "@prisma/client";

export interface RelatedQuotesResult {
  quotes: Array<Quote & {
    category: Category;
    authorProfile: AuthorProfile;
  }>;
  total: number;
  hasMore: boolean;
}

export interface GetRelatedQuotesParams {
  categoryId: string;
  currentQuoteId: string;
  limit?: number;
  page?: number;
  sortBy?: 'recent' | 'popular';
}

class QuoteRelatedService {
  /**
   * Get quotes related by category
   */
  async getRelatedByCategory({
    categoryId,
    currentQuoteId,
    limit = 3,
    page = 1,
    sortBy = 'recent'
  }: GetRelatedQuotesParams): Promise<RelatedQuotesResult> {
    try {
      // Validate inputs
      if (!categoryId) {
        throw new AppError("Category ID is required", "MISSING_PARAMETER", 400);
      }

      if (!currentQuoteId) {
        throw new AppError("Current quote ID is required", "MISSING_PARAMETER", 400);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const take = Math.min(10, Math.max(1, limit));

      // Build the ordering based on sortBy parameter
      const orderBy = sortBy === 'popular' 
        ? { downloadCount: 'desc' as const } 
        : { createdAt: 'desc' as const };

      // Query for related quotes
      const [quotes, total] = await Promise.all([
        db.quote.findMany({
          where: {
            categoryId,
            id: {
              not: currentQuoteId
            }
          },
          include: {
            category: true,
            authorProfile: true
          },
          orderBy,
          skip,
          take
        }),
        db.quote.count({
          where: {
            categoryId,
            id: {
              not: currentQuoteId
            }
          }
        })
      ]);

      // Return formatted result
      return {
        quotes,
        total,
        hasMore: total > skip + quotes.length
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("[QUOTE_RELATED_SERVICE]", error);
      throw new AppError("Failed to fetch related quotes", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Get quotes by the same author
   */
  async getRelatedByAuthor({
    currentQuoteId,
    limit = 3,
    page = 1,
    sortBy = 'recent'
  }: Omit<GetRelatedQuotesParams, 'categoryId'>): Promise<RelatedQuotesResult> {
    try {
      // First get the current quote to find its author
      const currentQuote = await db.quote.findUnique({
        where: {
          id: currentQuoteId
        },
        select: {
          authorProfileId: true
        }
      });

      if (!currentQuote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const take = Math.min(10, Math.max(1, limit));

      // Build the ordering based on sortBy parameter
      const orderBy = sortBy === 'popular' 
        ? { downloadCount: 'desc' as const } 
        : { createdAt: 'desc' as const };

      // Get quotes by the same author
      const [quotes, total] = await Promise.all([
        db.quote.findMany({
          where: {
            authorProfileId: currentQuote.authorProfileId,
            id: {
              not: currentQuoteId
            }
          },
          include: {
            category: true,
            authorProfile: true
          },
          orderBy,
          skip,
          take
        }),
        db.quote.count({
          where: {
            authorProfileId: currentQuote.authorProfileId,
            id: {
              not: currentQuoteId
            }
          }
        })
      ]);

      return {
        quotes,
        total,
        hasMore: total > skip + quotes.length
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("[QUOTE_RELATED_SERVICE]", error);
      throw new AppError("Failed to fetch related quotes by author", "INTERNAL_ERROR", 500);
    }
  }
}

export const quoteRelatedService = new QuoteRelatedService();