import { Quote, Prisma, AuthorProfile, Category } from "@prisma/client";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import { AppError } from "@/lib/api-error";
import { validateQuoteOwnership, QuoteAccessError } from "@/lib/auth/ownership";
import { ListQuotesParams } from "@/types/api/quotes";

interface ListQuotesResult {
  items: Array<Quote & {
    authorProfile: AuthorProfile;
    category: Category;
  }>;
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export interface QuoteService {
  // ... other methods
  list(params: ListQuotesParams): Promise<ListQuotesResult>;
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

  // Enhance getBySlug to include related data
  async getBySlug(slug: string): Promise<Quote | null> {
    return db.quote.findUnique({
      where: { slug },
      include: {
        category: true,
        authorProfile: true,
      }
    });
  }

  async list(params: ListQuotesParams): Promise<ListQuotesResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    try {
      const whereConditions: Prisma.QuoteWhereInput = {};
      if (params.authorProfileId) {
        whereConditions.authorProfileId = params.authorProfileId;
      }
      if (params.categoryId) {
        whereConditions.categoryId = params.categoryId;
      }
      if (params.search) {
        whereConditions.content = {
          contains: params.search,
          mode: 'insensitive'
        };
      }

      const [items, total] = await Promise.all([
        db.quote.findMany({
          where: whereConditions,
          include: {
            authorProfile: true, // Include the author profile instead of author
            category: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        db.quote.count({ where: whereConditions })
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

  // Enhance update method with better validation and optimistic locking
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

      // Validate inputs before proceeding with update
      await this.validateUpdateData(id, data, existingQuote);

      const updateData = await this.prepareUpdateData(data, existingQuote);

      // Perform update with optimistic locking
      return await this.performOptimisticUpdate(
        id, 
        updateData, 
        existingQuote.updatedAt
      );

    } catch (error) {
      return this.handleUpdateError(error);
    }
  }

  // New helper methods for better organization
  private async validateUpdateData(
    id: string, 
    data: UpdateQuoteInput, 
    existingQuote: Quote
  ): Promise<void> {
    // Validate category if being updated
    if (data.categoryId) {
      await this.validateCategory(data.categoryId);
    }

    // Validate author profile if being updated
    if (data.authorProfileId) {
      await this.validateAuthorProfile(data.authorProfileId);
    }

    // Validate content length and ensure it's different from existing
    if (data.content) {
      if (data.content.length > 1500) {
        throw new AppError(
          "Quote content exceeds 1500 characters", 
          "CONTENT_TOO_LONG", 
          400
        );
      }
      if (data.content === existingQuote.content) {
        throw new AppError(
          "New content is identical to existing content",
          "NO_CHANGES",
          400
        );
      }
    }

    // Validate new slug if provided and ensure it's different from existing
    if (data.slug) {
      if (data.slug === existingQuote.slug) {
        throw new AppError(
          "New slug is identical to existing slug",
          "NO_CHANGES",
          400
        );
      }
      await this.validateSlug(data.slug, id);
    }

    // Validate that at least one field is being updated
    if (!data.content && !data.slug && !data.categoryId && !data.authorProfileId) {
      throw new AppError(
        "No changes provided for update",
        "NO_CHANGES",
        400
      );
    }
  }

  private async prepareUpdateData(
    data: UpdateQuoteInput, 
    existingQuote: Quote
  ): Promise<Prisma.QuoteUpdateInput> {
    const updateData: Prisma.QuoteUpdateInput = { ...data };

    if (data.content || data.slug !== undefined) {
      const sanitizedContent = data.content 
        ? this.sanitizeContent(data.content) 
        : existingQuote.content;
        
      const newSlug = data.slug?.trim() || slugify(sanitizedContent.substring(0, 50));
      
      if (data.content) {
        updateData.content = sanitizedContent;
      }
      updateData.slug = newSlug;
    }

    return updateData;
  }

  private async performOptimisticUpdate(
    id: string, 
    updateData: Prisma.QuoteUpdateInput,
    currentUpdatedAt: Date
  ): Promise<Quote> {
    return await db.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id },
        select: { updatedAt: true },
      });

      if (!quote) {
        throw new AppError("Quote was deleted", "CONCURRENT_DELETE", 409);
      }

      if (quote.updatedAt.getTime() !== currentUpdatedAt.getTime()) {
        throw new AppError(
          "Quote was modified by another user", 
          "CONCURRENT_MODIFICATION", 
          409
        );
      }

      return tx.quote.update({
        where: { 
          id,
          updatedAt: currentUpdatedAt, // Optimistic locking
        },
        data: updateData,
        include: {
          category: true,
          authorProfile: true,
        }
      });
    });
  }

  private handleUpdateError(error: unknown): never {
    if (error instanceof AppError) throw error;
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          throw new AppError(
            "Quote was modified by another user",
            "CONCURRENT_MODIFICATION",
            409
          );
        case 'P2002':
          throw new AppError(
            "Quote with this slug already exists",
            "DUPLICATE_SLUG",
            400
          );
        default:
          throw new AppError(
            "Database error occurred",
            "DATABASE_ERROR",
            500
          );
      }
    }
    throw new AppError("Failed to update quote", "INTERNAL_ERROR", 500);
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