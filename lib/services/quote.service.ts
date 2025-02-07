import { Quote, Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import { AppError } from "@/lib/api-error";

export interface QuoteService {
  create(data: CreateQuoteInput & { authorId: string }): Promise<Quote>;
  getById(id: string): Promise<Quote | null>;
  getBySlug(slug: string): Promise<Quote | null>;
  list(params: {
    page?: number;
    limit?: number;
    authorId?: string;
    categoryId?: string;
  }): Promise<{
    items: Quote[];
    total: number;
    hasMore: boolean;
  }>;
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

  async create(data: CreateQuoteInput & { authorId: string }): Promise<Quote> {
    try {
      // Validate and sanitize content
      if (data.content.length > 500) {
        throw new AppError("Quote content exceeds 500 characters", "CONTENT_TOO_LONG", 400);
      }
      const sanitizedContent = this.sanitizeContent(data.content);
      
      // Generate and validate slug
      const slug = slugify(sanitizedContent.substring(0, 50));
      await this.validateSlug(slug);
      
      // Validate category
      await this.validateCategory(data.categoryId);

      // Create quote using transaction
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
        // Handle specific Prisma errors
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

  async list(params: {
    page?: number;
    limit?: number;
    authorId?: string;
    categoryId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.quote.findMany({
        where: {
          authorId: params.authorId,
          categoryId: params.categoryId,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.quote.count({
        where: {
          authorId: params.authorId,
          categoryId: params.categoryId,
        },
      }),
    ]);

    return {
      items,
      total,
      hasMore: total > skip + items.length,
    };
  }

  async update(id: string, data: UpdateQuoteInput): Promise<Quote> {
    try {
      // Validate existing quote
      const existingQuote = await this.getById(id);
      if (!existingQuote) {
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }

      // Prepare update data
      const updateData: Prisma.QuoteUpdateInput = { ...data };
      
      // Handle content update
      if (data.content) {
        if (data.content.length > 500) {
          throw new AppError("Quote content exceeds 500 characters", "CONTENT_TOO_LONG", 400);
        }
        const sanitizedContent = this.sanitizeContent(data.content);
        const newSlug = slugify(sanitizedContent.substring(0, 50));
        await this.validateSlug(newSlug, id);
        
        updateData.content = sanitizedContent;
        updateData.slug = newSlug;
      }

      // Validate category if updating
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
            updatedAt: quote.updatedAt, // Optimistic locking
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