import type { AppErrorCode } from "@/types/api/quotes";
import db from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { AppError } from "@/lib/api-error";
import { deleteImage } from "@/lib/cloudinary";
import type { Prisma, Gallery } from "@prisma/client";
import type { 
  MediaLibraryItem, 
  MediaLibrarySortField,
  SortDirection,
  MediaLibraryFilterOptions 
} from "@/types/cloudinary";

// Updated service interface
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
}

class MediaServiceImpl implements MediaService {
  // Updated transform method to work with Gallery
  private transformToMediaLibraryItem(item: Gallery & {
    _count?: { quotes: number };
  }): MediaLibraryItem {
    return {
      id: item.id, // Add the required id field
      public_id: item.publicId,
      secure_url: item.url,
      format: item.format ?? 'webp',
      width: item.width ?? 1200,
      height: item.height ?? 630,
      resource_type: 'image' as const,
      created_at: item.createdAt.toISOString(),
      bytes: item.bytes ?? 0,
      folder: 'galleries',
      isGlobal: item.isGlobal,
      title: item.title ?? undefined,
      description: item.description ?? undefined,
      altText: item.altText ?? undefined,
      usageCount: item.usageCount,
    };
  }

  // Updated to use Gallery
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
      const conditions: Prisma.GalleryWhereInput[] = [
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
        db.gallery.findMany({
          where,
          orderBy: { [sortField]: sortDirection },
          skip,
          take: limit,
          include: {
            _count: {
              select: { quotes: true }
            }
          }
        }),
        db.gallery.count({ where })
      ]);

      return {
        items: items.map(item => this.transformToMediaLibraryItem(item)),
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (error) {
      console.error("[MEDIA_SERVICE]", error);
      throw new AppError(
        "Failed to fetch global images",
        "FETCH_IMAGES_FAILED" as AppErrorCode,
        500
      );
    }
  }

  // Updated to use Gallery
  async updateMetadata(id: string, data: {
    title?: string;
    description?: string;
    altText?: string;
    isGlobal?: boolean;
  }) {
    try {
      const image = await db.gallery.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { quotes: true }
          }
        }
      });

      return this.transformToMediaLibraryItem(image);
    } catch (error) {
      console.error("[MEDIA_SERVICE]", error);
      
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

  // Updated to use Gallery
  async deleteImage(id: string) {
    try {
      const image = await db.gallery.findUnique({
        where: { id }
      });

      if (!image) {
        throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
      }

      // Delete from Cloudinary first
      const deleted = await deleteImage(image.publicId);
      if (!deleted) {
        throw new AppError(
          "Failed to delete image from storage",
          "IMAGE_DELETE_FAILED",
          500
        );
      }

      // Delete from database using transaction
      await db.$transaction(async (tx) => {
        // Delete all quote associations first
        await tx.quoteToGallery.deleteMany({
          where: { galleryId: id }
        });

        // Then delete the gallery item
        await tx.gallery.delete({
          where: { id }
        });
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
}

export const mediaService = new MediaServiceImpl();