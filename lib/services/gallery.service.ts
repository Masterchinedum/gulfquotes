import { AppError } from "@/lib/api-error";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { deleteImage } from "@/lib/cloudinary";
import db from "@/lib/prisma";
import type { Gallery, Prisma, Quote } from "@prisma/client";
import type {
  GalleryItem,
  GalleryCreateInput,
  GalleryUpdateInput,
  GalleryListOptions,
  GalleryFilterOptions,
  GallerySortField,
  SortDirection,
} from "@/types/gallery";

// Step 1: Service Interface
export interface GalleryService {
  // Core Methods
  create(data: GalleryCreateInput): Promise<Gallery>;
  update(id: string, data: GalleryUpdateInput): Promise<Gallery>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<GalleryItem | null>;
  list(options?: GalleryListOptions): Promise<{
    items: GalleryItem[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }>;

  // Quote Integration Methods
  addToQuote(galleryId: string, quoteId: string): Promise<Quote>;
  removeFromQuote(galleryId: string, quoteId: string): Promise<Quote>;
  setAsBackground(galleryId: string, quoteId: string): Promise<Quote>;
}

// Service Implementation
class GalleryServiceImpl implements GalleryService {
  // Step 2: Core Methods
  async create(data: GalleryCreateInput): Promise<Gallery> {
    try {
      // Check for duplicate publicId
      const existing = await db.gallery.findUnique({
        where: { publicId: data.publicId }
      });

      if (existing) {
        throw new AppError("Image already exists in gallery", "GALLERY_DUPLICATE_IMAGE", 400);
      }

      return await db.gallery.create({ data });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create gallery item", "GALLERY_CREATION_FAILED", 500);
    }
  }

  async update(id: string, data: GalleryUpdateInput): Promise<Gallery> {
    try {
      return await db.gallery.update({
        where: { id },
        data
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError("Gallery item not found", "GALLERY_NOT_FOUND", 404);
        }
      }
      throw new AppError("Failed to update gallery item", "GALLERY_UPDATE_FAILED", 500);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Start transaction to ensure data consistency
      await db.$transaction(async (tx) => {
        // Find gallery item with quote usage count
        const gallery = await tx.gallery.findUnique({
          where: { id },
          include: {
            _count: {
              select: { quotes: true }
            }
          }
        });

        if (!gallery) {
          throw new AppError("Gallery item not found", "GALLERY_NOT_FOUND", 404);
        }

        // Check if image is in use by any quotes
        if (gallery._count.quotes > 0) {
          throw new AppError(
            "Cannot delete image that is in use by quotes", 
            "GALLERY_IN_USE", 
            400
          );
        }

        // Delete from Cloudinary first
        const deleted = await deleteImage(gallery.publicId);
        if (!deleted) {
          throw new AppError(
            "Failed to delete image from cloud storage", 
            "GALLERY_CLOUDINARY_ERROR", 
            500
          );
        }

        // Then delete from database in order:
        // 1. Remove all quote associations
        await tx.quoteToGallery.deleteMany({
          where: { galleryId: id }
        });

        // 2. Delete the gallery item itself
        await tx.gallery.delete({
          where: { id }
        });
      });
    } catch (error) {
      // Handle specific error cases
      if (error instanceof AppError) throw error;
      
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError("Gallery item not found", "GALLERY_NOT_FOUND", 404);
        }
        
        if (error.code === 'P2003') {
          throw new AppError(
            "Cannot delete image that is referenced by other records", 
            "GALLERY_IN_USE", 
            400
          );
        }
      }

      // Log unexpected errors
      console.error("[GALLERY_DELETE]", error);
      
      // Generic error
      throw new AppError(
        "Failed to delete gallery item", 
        "GALLERY_DELETE_FAILED", 
        500
      );
    }
  }

  async getById(id: string): Promise<GalleryItem | null> {
    try {
      const gallery = await db.gallery.findUnique({
        where: { id },
        include: {
          _count: {
            select: { quotes: true }
          }
        }
      });

      if (!gallery) {
        throw new AppError("Gallery item not found", "GALLERY_NOT_FOUND", 404);
      }

      return gallery;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch gallery item", "GALLERY_FETCH_FAILED", 500);
    }
  }

  async list(options: GalleryListOptions = {}): Promise<{
    items: GalleryItem[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sort = { field: "createdAt" as GallerySortField, direction: "desc" as SortDirection },
      filter
    } = options;

    const skip = (page - 1) * limit;
    const where = this.buildFilterConditions(filter);

    try {
      const [items, total] = await Promise.all([
        db.gallery.findMany({
          where,
          include: {
            _count: {
              select: { quotes: true }
            }
          },
          orderBy: { [sort.field]: sort.direction },
          skip,
          take: limit
        }),
        db.gallery.count({ where })
      ]);

      return {
        items,
        total,
        hasMore: total > skip + items.length,
        page,
        limit
      };
    } catch (err) { // Changed from error to err and using it
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to fetch gallery items", "GALLERY_FETCH_FAILED", 500);
    }
  }

  // Step 3: Quote Integration Methods
  async addToQuote(galleryId: string, quoteId: string): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        // Check if association already exists
        const existing = await tx.quoteToGallery.findUnique({
          where: {
            quoteId_galleryId: { quoteId, galleryId }
          }
        });

        if (existing) {
          throw new AppError("Image already added to quote", "GALLERY_DUPLICATE_IMAGE", 400);
        }

        // Create association
        await tx.quoteToGallery.create({
          data: {
            quoteId,
            galleryId
          }
        });

        return tx.quote.findUniqueOrThrow({
          where: { id: quoteId }
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to add image to quote", "GALLERY_QUOTE_OPERATION_FAILED", 500);
    }
  }

  async removeFromQuote(galleryId: string, quoteId: string): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        await tx.quoteToGallery.delete({
          where: {
            quoteId_galleryId: { quoteId, galleryId }
          }
        });

        return tx.quote.findUniqueOrThrow({
          where: { id: quoteId }
        });
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError("Association not found", "GALLERY_NOT_FOUND", 404);
        }
      }
      throw new AppError("Failed to remove image from quote", "GALLERY_QUOTE_OPERATION_FAILED", 500);
    }
  }

  async setAsBackground(galleryId: string, quoteId: string): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        const gallery = await tx.gallery.findUnique({
          where: { id: galleryId }
        });

        if (!gallery) {
          throw new AppError("Gallery item not found", "GALLERY_NOT_FOUND", 404);
        }

        await tx.quoteToGallery.updateMany({
          where: { quoteId },
          data: { isActive: false }
        });

        await tx.quoteToGallery.update({
          where: {
            quoteId_galleryId: { quoteId, galleryId }
          },
          data: { isActive: true }
        });

        return tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: gallery.url }
        });
      });
    } catch (err) { // Changed from error to err and using it
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to set background image", "GALLERY_QUOTE_OPERATION_FAILED", 500);
    }
  }

  // Helper method for building filter conditions
  private buildFilterConditions(filter?: GalleryFilterOptions): Prisma.GalleryWhereInput {
    const conditions: Prisma.GalleryWhereInput = {};

    if (!filter) return conditions;

    if (filter.search) {
      conditions.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { altText: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    if (filter.formats?.length) {
      conditions.format = { in: filter.formats };
    }

    if (filter.createdAfter) {
      conditions.createdAt = { gte: filter.createdAfter };
    }

    if (filter.createdBefore) {
      conditions.createdAt = { lte: filter.createdBefore };
    }

    return conditions;
  }
}

// Export service instance
export const galleryService = new GalleryServiceImpl();