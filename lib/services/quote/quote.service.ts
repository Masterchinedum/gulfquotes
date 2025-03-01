import { Quote, Prisma } from "@prisma/client";
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { auth } from "@/auth";
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import type { QuoteService, ListQuotesResult, QuoteImageData, EnhancedQuote } from "./types";
import type { ListQuotesParams } from "@/types/api/quotes";
import type { GalleryItem } from "@/types/gallery";
import type { MediaLibraryItem } from "@/types/cloudinary";
import {
  validateCategory,
  validateSlug,
  validateAccess,
  validateAuthorProfile,
  validateUpdateData
} from "./validators";
import { sanitizeContent, prepareUpdateData, handleUpdateError } from "./utils";
import { 
  addImages as addQuoteImages,
  addFromMediaLibrary as addQuoteFromMediaLibrary,
  removeImage as removeQuoteImage,
  removeImageAssociation as removeQuoteImageAssociation
} from "./image-operations";
import { quoteLikeService } from "@/lib/services/like";

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

  async getById(id: string, userId?: string): Promise<Quote | null> {
    const quote = await db.quote.findUnique({
      where: { id },
      include: {
        category: true,
        authorProfile: true,
      }
    });

    if (quote && userId) {
      // Add like information if user ID is provided
      const likeStatus = await quoteLikeService.getUserLikes(userId, [quote.id]);
      return {
        ...quote,
        isLiked: likeStatus[quote.id] || false
      };
    }

    return quote;
  }

  async getBySlug(slug: string, userId?: string): Promise<Quote | null> {
    const quote = await db.quote.findUnique({
      where: { slug },
      include: {
        category: true,
        authorProfile: true,
      }
    });

    if (quote && userId) {
      // Add like information if user ID is provided
      const likeStatus = await quoteLikeService.getUserLikes(userId, [quote.id]);
      return {
        ...quote,
        isLiked: likeStatus[quote.id] || false
      };
    }

    return quote;
  }

  async list(params: ListQuotesParams & { userId?: string }): Promise<ListQuotesResult> {
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

    // Add like status for all quotes if userId is provided
    if (params.userId && items.length > 0) {
      const quoteIds = items.map(item => item.id);
      const likeStatus = await quoteLikeService.getUserLikes(params.userId, quoteIds);
      
      // Merge like status into quotes
      items.forEach(quote => {
        (quote as EnhancedQuote).isLiked = likeStatus[quote.id] || false;
      });
    }

    return {
      items,
      total,
      hasMore: total > skip + items.length,
      page,
      limit
    };
  }

  async update(id: string, data: UpdateQuoteInput): Promise<Quote> {
    try {
      console.log("[QUOTE_SERVICE] Starting quote update:", { id, data });
      
      const session = await auth();
      if (!session?.user?.id) {
        console.log("[QUOTE_SERVICE] Update failed: Unauthorized");
        throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
      }
  
      await validateAccess(id, session.user.id);
      console.log("[QUOTE_SERVICE] Access validated");
      
      const existingQuote = await this.getById(id);
      if (!existingQuote) {
        console.log("[QUOTE_SERVICE] Update failed: Quote not found");
        throw new AppError("Quote not found", "NOT_FOUND", 404);
      }
      console.log("[QUOTE_SERVICE] Found existing quote");
  
      await validateUpdateData(id, data, existingQuote);
      console.log("[QUOTE_SERVICE] Update data validated");
      
      const updateData = prepareUpdateData(data); // Remove existingQuote parameter
      console.log("[QUOTE_SERVICE] Prepared update data:", updateData);
  
      try {
        const result = await db.quote.update({
          where: { id },
          data: updateData,
          include: {
            category: true,
            authorProfile: true,
          }
        });
        console.log("[QUOTE_SERVICE] Update successful");
        return result;
      } catch (error) {
        console.error("[QUOTE_SERVICE] Update failed:", error);
        handleUpdateError(error);
      }
    } catch (error) {
      console.error("[QUOTE_SERVICE] Update process failed:", error);
      throw error;
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

  async setBackgroundImage(quoteId: string, imageUrl: string | null): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        // Reset all gallery associations to not active
        await tx.quoteToGallery.updateMany({
          where: { quoteId },
          data: { isActive: false }
        });

        if (imageUrl) {
          // Find the gallery item by URL
          const gallery = await tx.gallery.findFirst({
            where: { url: imageUrl }
          });

          if (!gallery) {
            throw new AppError("Gallery image not found", "GALLERY_NOT_FOUND", 404);
          }

          // Set the selected image as active
          await tx.quoteToGallery.update({
            where: {
              quoteId_galleryId: { quoteId, galleryId: gallery.id }
            },
            data: { isActive: true }
          });
        }

        // Update quote's background image
        return tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: imageUrl },
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

  async updateGalleryImages(
    quoteId: string, 
    images: (GalleryItem | { id: string; isActive: boolean; isBackground: boolean })[], 
    backgroundImage?: string | null
  ): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        // Get existing gallery associations
        const existingAssociations = await tx.quoteToGallery.findMany({
          where: { quoteId },
          include: { gallery: true }
        });

        // Calculate images to remove and add
        const existingIds = existingAssociations.map(a => a.galleryId);
        const newIds = images.map(i => i.id);
        const toRemove = existingIds.filter(id => !newIds.includes(id));
        const toAdd = newIds.filter(id => !existingIds.includes(id));

        // Remove old associations and decrement usage counts
        if (toRemove.length > 0) {
          await Promise.all([
            tx.quoteToGallery.deleteMany({
              where: { 
                quoteId,
                galleryId: { in: toRemove }
              }
            }),
            tx.gallery.updateMany({
              where: { id: { in: toRemove } },
              data: { usageCount: { decrement: 1 } }
            })
          ]);
        }

        // Add new associations and increment usage counts
        if (toAdd.length > 0) {
          await Promise.all([
            ...toAdd.map(galleryId =>
              tx.quoteToGallery.create({
                data: {
                  quoteId,
                  galleryId,
                  isActive: backgroundImage ? galleryId === backgroundImage : false
                }
              })
            ),
            tx.gallery.updateMany({
              where: { id: { in: toAdd } },
              data: { usageCount: { increment: 1 } }
            })
          ]);
        }

        // Update background image if specified
        if (backgroundImage !== undefined) {
          // Reset all active states
          await tx.quoteToGallery.updateMany({
            where: { quoteId },
            data: { isActive: false }
          });

          if (backgroundImage) {
            // Set new background image
            await tx.quoteToGallery.update({
              where: {
                quoteId_galleryId: { 
                  quoteId, 
                  galleryId: backgroundImage 
                }
              },
              data: { isActive: true }
            });

            const gallery = await tx.gallery.findUnique({
              where: { id: backgroundImage }
            });

            await tx.quote.update({
              where: { id: quoteId },
              data: { backgroundImage: gallery?.url || null }
            });
          } else {
            // Clear background image
            await tx.quote.update({
              where: { id: quoteId },
              data: { backgroundImage: null }
            });
          }
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
      throw new AppError(
        "Failed to update quote gallery images",
        "GALLERY_QUOTE_OPERATION_FAILED",
        500
      );
    }
  }

  // Add the missing methods from QuoteService interface
  async addImages(quoteId: string, images: QuoteImageData[]): Promise<Quote> {
    return addQuoteImages(quoteId, images);
  }

  async addFromMediaLibrary(quoteId: string, images: MediaLibraryItem[]): Promise<Quote> {
    return addQuoteFromMediaLibrary(quoteId, images);
  }

  async removeImage(quoteId: string, publicId: string): Promise<Quote> {
    return removeQuoteImage(quoteId, publicId);
  }

  async removeImageAssociation(quoteId: string, imageId: string): Promise<Quote> {
    return removeQuoteImageAssociation(quoteId, imageId);
  }

  async validateGalleryImages(images: Array<{ id: string; isActive: boolean; isBackground: boolean }>) {
    return await Promise.all(
      images.map(async (img) => {
        const galleryItem = await db.gallery.findUnique({
          where: { id: img.id }
        });
        
        if (!galleryItem) {
          throw new AppError(
            `Gallery item not found: ${img.id}`,
            "GALLERY_NOT_FOUND",
            404
          );
        }
        
        return {
          ...galleryItem,
          isActive: img.isActive,
          isBackground: img.isBackground
        };
      })
    );
  }
}

export const quoteService = new QuoteServiceImpl();
