import { Quote, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import { AppError } from "@/lib/api-error";
import { validateQuoteOwnership, QuoteAccessError } from "@/lib/auth/ownership";
interface ListQuotesParams {
  page?: number;
  limit?: number;
  search?: string;
  authorId?: string;
  categoryId?: string;
  authorProfileId?: string;
}

interface ListQuotesResult {
  items: Quote[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface QuoteService {
  // ... other methods
  list(params: ListQuotesParams): Promise<ListQuotesResult>;
}
interface ListQuotesParams {
  page?: number;
  limit?: number;
  search?: string;
  authorId?: string;
  categoryId?: string;
  authorProfileId?: string;
}

interface ListQuotesResult {
  items: Quote[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface QuoteService {
  create(data: CreateQuoteInput & { authorId: string }): Promise<Quote>;
  getById(id: string): Promise<Quote | null>;
  getBySlug(slug: string): Promise<Quote | null>;
  list(params: ListQuotesParams): Promise<ListQuotesResult>;
  update(id: string, data: UpdateQuoteInput): Promise<Quote>;
  delete(id: string): Promise<Quote>;
  search(query: string): Promise<Quote[]>;
}

class QuoteServiceImpl implements QuoteService {
  private async validateCategory(categoryId: string): Promise<void> {
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError("Category not found", "CATEGORY_NOT_FOUND", 404);
    }
  }

  private async validateSlug(slug: string, excludeId?: string): Promise<void> {
    const existingQuote = await db.quote.findFirst({
      where: {
        slug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (existingQuote) {
      throw new AppError("Quote with similar content already exists", "DUPLICATE_SLUG", 400);
    }
  }

  private sanitizeContent(content: string): string {
    return content
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?'"()-]/g, ''); // Remove special characters except basic punctuation
  }

  private async validateAccess(quoteId: string, userId: string): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Admin can do anything
    if (session.user.role === "ADMIN") return;

    // For authors, validate ownership
    if (session.user.role === "AUTHOR") {
      const hasAccess = await validateQuoteOwnership(quoteId, userId);
      if (!hasAccess) {
        throw new QuoteAccessError();
      }
      return;
    }

    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }

  // Add new validation method for author profile
  private async validateAuthorProfile(authorProfileId: string): Promise<void> {
    const authorProfile = await db.authorProfile.findUnique({
      where: { id: authorProfileId },
    });

    if (!authorProfile) {
      throw new AppError(
        "Author profile not found", 
        "AUTHOR_PROFILE_NOT_FOUND", 
        404
      );
    }
  }

  async create(data: CreateQuoteInput & { authorId: string }): Promise<Quote> {
    try {
      if (data.content.length > 1500) {
        throw new AppError("Quote content exceeds 500 characters", "CONTENT_TOO_LONG", 400);
      }

      // Validate author profile exists
      await this.validateAuthorProfile(data.authorProfileId);
      
      // Validate category.
      await this.validateCategory(data.categoryId);

      const sanitizedContent = this.sanitizeContent(data.content);
      
      // Use provided slug if available, otherwise auto-generate.
      const slug = data.slug && data.slug.trim().length > 0
        ? data.slug.trim()
        : slugify(sanitizedContent.substring(0, 50));
        
      // Validate that slug is unique.
      await this.validateSlug(slug);

      // Create quote using transaction.
      return await db.$transaction(async (tx) => {
        return tx.quote.create({
          data: {
            ...data,
            content: sanitizedContent,
            slug,
          },
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            throw new AppError("Quote with similar content already exists", "DUPLICATE_SLUG", 400);
          case 'P2003':
            throw new AppError("Invalid category or author reference", "INVALID_REFERENCE", 400);
          default:
            throw new AppError("Database error occurred", "DATABASE_ERROR", 500);
        }
      }
      throw new AppError("Failed to create quote", "INTERNAL_ERROR", 500);
    }
  }

  async getById(id: string): Promise<Quote | null> {
    return db.quote.findUnique({
      where: { id },
    });
  }

  async getBySlug(slug: string): Promise<Quote | null> {
    return db.quote.findUnique({
      where: { slug },
    });
  }

  async list(params: ListQuotesParams): Promise<ListQuotesResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        db.quote.findMany({
          include: {
            author: true,
            category: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        db.quote.count()
      ]);

      return {
        items,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppError("Database error", "DATABASE_ERROR", 500);
      }
      throw new AppError("Failed to fetch quotes", "INTERNAL_ERROR", 500);
    }
  }

  async update(id: string, data: UpdateQuoteInput): Promise<Quote> {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    await this.validateAccess(id, session.user.id);
    
    try {
      const existingQuote = await this.getById(id);
      if (!existingQuote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }

      const updateData: Prisma.QuoteUpdateInput = { ...data };

      // Handle content and/or slug update
      if (data.content || typeof data.slug !== "undefined") {
        // Use new content if provided, else fallback to existing.
        const sanitizedContent = data.content ? this.sanitizeContent(data.content) : existingQuote.content;
        // Use provided slug (if not empty) otherwise auto generate using the sanitized content.
        const newSlug =
          data.slug && data.slug.trim().length > 0
            ? data.slug.trim()
            : slugify(sanitizedContent.substring(0, 50));
        
        // Validate the new slug (excluding the current quote's id).
        await this.validateSlug(newSlug, id);
        
        if (data.content) {
          updateData.content = sanitizedContent;
        }
        updateData.slug = newSlug;
      }

      if (data.categoryId) {
        await this.validateCategory(data.categoryId);
      }

      // Update with optimistic locking
      return await db.$transaction(async (tx) => {
        const quote = await tx.quote.findUnique({
          where: { id },
          select: { updatedAt: true },
        });

        if (!quote) {
          throw new AppError("Quote was deleted", "CONCURRENT_DELETE", 409);
        }

        return tx.quote.update({
          where: { 
            id,
            updatedAt: quote.updatedAt,
          },
          data: updateData,
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError("Quote was modified by another user", "CONCURRENT_MODIFICATION", 409);
        }
        throw new AppError("Database error occurred", "DATABASE_ERROR", 500);
      }
      throw new AppError("Failed to update quote", "INTERNAL_ERROR", 500);
    }
  }

  async delete(id: string): Promise<Quote> {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    await this.validateAccess(id, session.user.id);
    return db.quote.delete({
      where: { id },
    });
  }

  async search(query: string): Promise<Quote[]> {
    return db.quote.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 10,
    });
  }
}

export const quoteService = new QuoteServiceImpl();