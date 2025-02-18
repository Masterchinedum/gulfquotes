import type { AppErrorCode } from "@/types/api/quotes";
import db from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { AppError } from "@/lib/api-error";
import { deleteImage } from "@/lib/cloudinary";
import type { Prisma, QuoteImage } from "@prisma/client";
import type { 
  MediaLibraryItem, 
  MediaLibrarySortField,
  SortDirection,
  MediaLibraryFilterOptions 
} from "@/types/cloudinary";

// Define service interface
export interface MediaService {
  getGlobalImages(options: {
    page?: number;
    limit?: number;
    sortField?: MediaLibrarySortField;
    sortDirection?: SortDirection;
    filter?: MediaLibraryFilterOptions;
  }): Promise<{
    items: MediaLibraryItem[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }>;
  updateMetadata(id: string, data: {
    title?: string;
    description?: string;
    altText?: string;
    isGlobal?: boolean;
  }): Promise<MediaLibraryItem>;
  deleteImage(id: string): Promise<void>;
  associateWithQuote(imageId: string, quoteId: string): Promise<void>;
  dissociateFromQuote(imageId: string, quoteId: string): Promise<void>;
}

class MediaServiceImpl implements MediaService {
  // Helper method to transform DB item to MediaLibraryItem
  private transformToMediaLibraryItem(item: QuoteImage & {
    quote?: { id: string; slug: string; }
  }): MediaLibraryItem {
    return {
      public_id: item.publicId,
      secure_url: item.url,
      format: item.format ?? 'webp',
      width: item.width ?? 1200,
      height: item.height ?? 630,
      resource_type: 'image' as const,
      created_at: item.createdAt.toISOString(),
      bytes: item.bytes ?? 0,
      folder: 'quote-images',
      isGlobal: item.isGlobal,
      title: item.title ?? undefined,
      description: item.description ?? undefined,
      altText: item.altText ?? undefined,
      usageCount: item.usageCount,
      context: {
        quoteId: item.quoteId,
        alt: item.altText ?? undefined
      }
    };
  }

  // Get global images with filtering, sorting, and pagination
  async getGlobalImages({ 
    page = 1, 
    limit = 20,
    sortField = 'createdAt',
    sortDirection = 'desc',
    filter
  }: {
    page?: number;
    limit?: number;
    sortField?: MediaLibrarySortField;
    sortDirection?: SortDirection;
    filter?: MediaLibraryFilterOptions;
  }) {
    try {
      // Build where conditions
      const conditions: Prisma.QuoteImageWhereInput[] = [
        { isGlobal: true }
      ];

      if (filter?.search) {
        conditions.push({
          OR: [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } },
            { altText: { contains: filter.search, mode: 'insensitive' } },
          ]
        });
      }

      if (filter?.minUsageCount !== undefined) {
        conditions.push({ usageCount: { gte: filter.minUsageCount } });
      }

      if (filter?.maxUsageCount !== undefined) {
        conditions.push({ usageCount: { lte: filter.maxUsageCount } });
      }

      if (filter?.formats?.length) {
        conditions.push({ format: { in: filter.formats } });
      }

      if (filter?.createdAfter) {
        conditions.push({ createdAt: { gte: filter.createdAfter } });
      }

      if (filter?.createdBefore) {
        conditions.push({ createdAt: { lte: filter.createdBefore } });
      }

      const where = { AND: conditions };
      const skip = (page - 1) * limit;

      // Execute queries
      const [items, total] = await Promise.all([
        db.quoteImage.findMany({
          where,
          orderBy: { [sortField]: sortDirection },
          skip,
          take: limit,
          include: {
            quote: {
              select: {
                id: true,
                slug: true,
              }
            }
          }
        }),
        db.quoteImage.count({ where })
      ]);

      return {
        items: items.map(item => this.transformToMediaLibraryItem(item)),
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("[MEDIA_SERVICE]", error); // Add logging
      throw new AppError(
        "Failed to fetch global images",
        "FETCH_IMAGES_FAILED" as AppErrorCode,
        500
      );
    }
  }

  // Update image metadata
  async updateMetadata(id: string, data: {
    title?: string;
    description?: string;
    altText?: string;
    isGlobal?: boolean;
  }) {
    try {
      const image = await db.quoteImage.update({
        where: { id },
        data,
        include: {
          quote: {
            select: {
              id: true,
              slug: true,
            }
          }
        }
      });

      return this.transformToMediaLibraryItem(image);
    } catch (error) {
      console.error("[MEDIA_SERVICE]", error); // Add logging
      
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
        }
      }
      
      throw new AppError(
        "Failed to update image metadata",
        "UPDATE_METADATA_FAILED" as AppErrorCode,
        500
      );
    }
  }

  // Delete image completely
  async deleteImage(id: string) {
    try {
      const image = await db.quoteImage.findUnique({
        where: { id }
      });

      if (!image) {
        throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
      }

      // Delete from Cloudinary
      const deleted = await deleteImage(image.publicId);
      if (!deleted) {
        throw new AppError(
          "Failed to delete image from storage",
          "IMAGE_DELETE_FAILED",
          500
        );
      }

      // Delete from database
      await db.quoteImage.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to delete image",
        "DELETE_IMAGE_FAILED" as AppErrorCode,
        500
      );
    }
  }

  // Associate image with quote
  async associateWithQuote(imageId: string, quoteId: string) {
    try {
      await db.$transaction(async (tx) => {
        const image = await tx.quoteImage.findUnique({
          where: { id: imageId }
        });

        if (!image) {
          throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
        }

        // Create new association
        await tx.quoteImage.create({
          data: {
            quoteId,
            url: image.url,
            publicId: image.publicId,
            isActive: false,
            isGlobal: true,
            title: image.title,
            description: image.description,
            altText: image.altText
          }
        });

        // Update usage count
        await tx.quoteImage.update({
          where: { id: imageId },
          data: { usageCount: { increment: 1 } }
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to associate image with quote",
        "IMAGE_ASSOCIATION_FAILED" as AppErrorCode,
        500
      );
    }
  }

  // Dissociate image from quote
  async dissociateFromQuote(imageId: string, quoteId: string) {
    try {
      await db.$transaction(async (tx) => {
        const image = await tx.quoteImage.findFirst({
          where: { id: imageId, quoteId }
        });

        if (!image) {
          throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
        }

        // Remove association
        await tx.quoteImage.delete({
          where: { id: imageId }
        });

        // Update usage count if image is global
        if (image.isGlobal) {
          await tx.quoteImage.updateMany({
            where: { publicId: image.publicId },
            data: { usageCount: { decrement: 1 } }
          });
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to dissociate image from quote",
        "IMAGE_DISSOCIATION_FAILED" as AppErrorCode,
        500
      );
    }
  }
}

export const mediaService = new MediaServiceImpl();