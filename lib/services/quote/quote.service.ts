import { Quote, Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { auth } from "@/auth";
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import type { QuoteService, ListQuotesResult } from "./types";
import type { ListQuotesParams } from "@/types/api/quotes";
import type { GalleryItem } from "@/types/gallery";
import {
  validateCategory,
  validateSlug,
  validateAccess,
  validateAuthorProfile
} from "./validators";
import { sanitizeContent, prepareUpdateData, handleUpdateError } from "./utils";

class QuoteServiceImpl implements QuoteService {
  async create(data: CreateQuoteInput & { authorId: string }): Promise<Quote> {
    if (data.content.length > 1500) {
      throw new AppError("Quote content exceeds 1500 characters", "CONTENT_TOO_LONG", 400);
    }

    await validateAuthorProfile(data.authorProfileId);
    await validateCategory(data.categoryId);
    
    const sanitizedContent = sanitizeContent(data.content);
    const slug = data.slug?.trim() || slugify(sanitizedContent.substring(0, 50));
    await validateSlug(slug);

    return await db.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          content: sanitizedContent,
          slug,
          authorId: data.authorId,
          categoryId: data.categoryId,
          authorProfileId: data.authorProfileId,
          backgroundImage: null // Will be set later through setAsBackground
        },
        include: {
          category: true,
          authorProfile: true,
          gallery: {
            include: {
              gallery: true
            }
          }
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

  // Gallery Integration Methods
  async addGalleryImages(quoteId: string, images: GalleryItem[]): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        const quote = await tx.quote.findUnique({
          where: { id: quoteId }
        });

        if (!quote) {
          throw new AppError("Quote not found", "NOT_FOUND", 404);
        }

        // Create associations for each image
        for (const image of images) {
          await tx.quoteToGallery.create({
            data: {
              quoteId,
              galleryId: image.id,
              isActive: false
            }
          });
        }

        return tx.quote.findUniqueOrThrow({
          where: { id: quoteId },
          include: {
            category: true,
            authorProfile: true,
            gallery: {
              include: {
                gallery: true
              }
            }
          }
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to add gallery images", "GALLERY_QUOTE_OPERATION_FAILED", 500);
    }
  }

  async removeGalleryImage(quoteId: string, galleryId: string): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        await tx.quoteToGallery.delete({
          where: {
            quoteId_galleryId: { quoteId, galleryId }
          }
        });

        // If this was the background image, reset it
        await tx.quote.update({
          where: { id: quoteId },
          data: {
            backgroundImage: null
          }
        });

        return tx.quote.findUniqueOrThrow({
          where: { id: quoteId },
          include: {
            category: true,
            authorProfile: true,
            gallery: {
              include: {
                gallery: true
              }
            }
          }
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError("Gallery image not found", "GALLERY_NOT_FOUND", 404);
        }
      }
      throw new AppError("Failed to remove gallery image", "GALLERY_QUOTE_OPERATION_FAILED", 500);
    }
  }

  async setGalleryBackground(quoteId: string, galleryId: string): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        // Find the gallery item
        const gallery = await tx.gallery.findUnique({
          where: { id: galleryId }
        });

        if (!gallery) {
          throw new AppError("Gallery item not found", "GALLERY_NOT_FOUND", 404);
        }

        // Reset all images to not active
        await tx.quoteToGallery.updateMany({
          where: { quoteId },
          data: { isActive: false }
        });

        // Set the selected image as active and update background
        await tx.quoteToGallery.update({
          where: {
            quoteId_galleryId: { quoteId, galleryId }
          },
          data: { isActive: true }
        });

        return tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: gallery.url },
          include: {
            category: true,
            authorProfile: true,
            gallery: {
              include: {
                gallery: true
              }
            }
          }
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to set background image", "GALLERY_QUOTE_OPERATION_FAILED", 500);
    }
  }
}

export const quoteService = new QuoteServiceImpl();
