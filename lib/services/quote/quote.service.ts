import { Quote, Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { auth } from "@/auth";  // Add this import
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import type { QuoteService, QuoteImageData, ListQuotesResult } from "./types";
import type { ListQuotesParams } from "@/types/api/quotes";
import {
  validateCategory,
  validateSlug,
  validateAccess,
  validateAuthorProfile,
  validateImages,
  validateUpdateData
} from "./validators";
import { sanitizeContent, prepareUpdateData, handleUpdateError } from "./utils";
import {
  addImages,
  addFromMediaLibrary,
  removeImage,
  setBackgroundImage,
  removeImageAssociation
} from "./image-operations";

class QuoteServiceImpl implements QuoteService {
  async create(data: CreateQuoteInput & { authorId: string; images?: QuoteImageData[] }): Promise<Quote> {
    if (data.content.length > 1500) {
      throw new AppError("Quote content exceeds 500 characters", "CONTENT_TOO_LONG", 400);
    }

    await validateAuthorProfile(data.authorProfileId);
    await validateCategory(data.categoryId);
    
    const sanitizedContent = sanitizeContent(data.content);
    const slug = data.slug?.trim() || slugify(sanitizedContent.substring(0, 50));
    await validateSlug(slug);

    if (data.images) {
      await validateImages(data.images);
    }

    return await db.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          content: sanitizedContent,
          slug,
          authorId: data.authorId,
          categoryId: data.categoryId,
          authorProfileId: data.authorProfileId,
          backgroundImage: data.images?.find(img => img.isActive)?.url || null,
          images: data.images ? {
            createMany: {
              data: data.images.map(img => ({
                url: img.url,
                publicId: img.publicId,
                isActive: img.isActive
              }))
            }
          } : undefined
        },
        include: {
          images: true,
          category: true,
          authorProfile: true
        }
      });

      return quote;
    });
  }

  async getById(id: string): Promise<Quote | null> {
    return db.quote.findUnique({
      where: { id },
      include: {
        category: true,
        authorProfile: true,
      }
    });
  }

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

    const whereConditions: Prisma.QuoteWhereInput = {
      ...(params.authorProfileId && { authorProfileId: params.authorProfileId }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.search && { 
        content: {
          contains: params.search,
          mode: Prisma.QueryMode.insensitive
        }
      })
    };

    const [items, total] = await Promise.all([
      db.quote.findMany({
        where: whereConditions,
        include: {
          authorProfile: true,
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
  }

  async update(id: string, data: UpdateQuoteInput): Promise<Quote> {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    await validateAccess(id, session.user.id);
    
    const existingQuote = await this.getById(id);
    if (!existingQuote) {
      throw new AppError("Quote not found", "NOT_FOUND", 404);
    }

    await validateUpdateData(id, data, existingQuote);
    const updateData = prepareUpdateData(data, existingQuote);

    try {
      return await db.quote.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          authorProfile: true,
        }
      });
    } catch (error) {
      handleUpdateError(error);
    }
  }

  async delete(id: string): Promise<Quote> {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    await validateAccess(id, session.user.id);

    try {
      return await db.quote.delete({
        where: { id },
        include: {
          category: true,
          authorProfile: true,
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError("Quote not found", "NOT_FOUND", 404);
        }
        throw new AppError("Database error occurred", "DATABASE_ERROR", 500);
      }
      throw new AppError("Failed to delete quote", "INTERNAL_ERROR", 500);
    }
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
      include: {
        category: true,
        authorProfile: true,
      }
    });
  }

  // Delegate image operations to the imported functions
  addImages = addImages;
  addFromMediaLibrary = addFromMediaLibrary;
  removeImage = removeImage;
  setBackgroundImage = setBackgroundImage;
  removeImageAssociation = removeImageAssociation;
}

export const quoteService = new QuoteServiceImpl();
