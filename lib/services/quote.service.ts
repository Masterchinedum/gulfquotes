import { Quote, Prisma, AuthorProfile, Category } from "@prisma/client";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { CreateQuoteInput, UpdateQuoteInput } from "@/schemas/quote";
import { slugify } from "@/lib/utils";
import { AppError } from "@/lib/api-error";
import { validateQuoteOwnership, QuoteAccessError } from "@/lib/auth/ownership";
import { ListQuotesParams } from "@/types/api/quotes";
import { validateQuoteImages, handleUploadError, handleDeleteError } from "@/lib/utils/image-management";
import { cloudinaryConfig } from "@/lib/cloudinary"; // Add this import

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

// First, add the new image-related types
interface QuoteImageData {
  url: string;
  publicId: string;
  isActive: boolean;
}

export interface QuoteService {
  // ... other methods
  list(params: ListQuotesParams): Promise<ListQuotesResult>;
  create(data: CreateQuoteInput & { authorId: string; images?: QuoteImageData[] }): Promise<Quote>;
  getById(id: string): Promise<Quote | null>;
  getBySlug(slug: string): Promise<Quote | null>;
  update(id: string, data: UpdateQuoteInput): Promise<Quote>;
  delete(id: string): Promise<Quote>;
  search(query: string): Promise<Quote[]>;
  addImages(quoteId: string, images: QuoteImageData[]): Promise<Quote>;
  removeImage(quoteId: string, publicId: string): Promise<Quote>;
  setBackgroundImage(quoteId: string, imageUrl: string | null): Promise<Quote>;
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

  // Add new validation method for images
  private async validateImages(images: QuoteImageData[]): Promise<void> {
    if (images.length > 30) {
      throw new AppError(
        "Maximum 30 images allowed per quote",
        "MAX_IMAGES_EXCEEDED",
        400
      );
    }

    // Validate each image URL is from Cloudinary
    for (const image of images) {
      if (!image.url.includes(cloudinaryConfig.cloudName)) {
        throw new AppError(
          "Invalid image URL. Images must be uploaded to Cloudinary",
          "INVALID_IMAGE",
          400
        );
      }
    }
  }

  async create(data: CreateQuoteInput & { authorId: string; images?: QuoteImageData[] }): Promise<Quote> {
    try {
      if (data.content.length > 1500) {
        throw new AppError("Quote content exceeds 500 characters", "CONTENT_TOO_LONG", 400);
      }

      await this.validateAuthorProfile(data.authorProfileId);
      await this.validateCategory(data.categoryId);
      
      const sanitizedContent = this.sanitizeContent(data.content);
      const slug = data.slug?.trim() || slugify(sanitizedContent.substring(0, 50));
      await this.validateSlug(slug);

      if (data.images) {
        await this.validateImages(data.images);
      }

      // Create quote using transaction with proper nested create
      return await db.$transaction(async (tx) => {
        const quote = await tx.quote.create({
          data: {
            content: sanitizedContent,
            slug,
            authorId: data.authorId,
            categoryId: data.categoryId,
            authorProfileId: data.authorProfileId,
            backgroundImage: data.images?.find(img => img.isActive)?.url || null,
            // Use proper nested create syntax for images
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

  // Add method to associate images with a quote
  async addImages(quoteId: string, images: QuoteImageData[]): Promise<Quote> {
    try {
      // Validate images before proceeding
      validateQuoteImages(images);

      return await db.$transaction(async (tx) => {
        // Check current count
        const currentCount = await tx.quoteImage.count({
          where: { quoteId }
        });

        if (currentCount + images.length > cloudinaryConfig.limits.quotes.maxFiles) {
          throw new AppError(
            `Adding these images would exceed the maximum limit of ${cloudinaryConfig.limits.quotes.maxFiles} images`,
            "MAX_IMAGES_EXCEEDED",
            400
          );
        }

        // Create the new images
        await tx.quoteImage.createMany({
          data: images.map(img => ({
            quoteId,
            url: img.url,
            publicId: img.publicId,
            isActive: img.isActive
          }))
        });

        return tx.quote.findUniqueOrThrow({
          where: { id: quoteId },
          include: {
            images: true,
            category: true,
            authorProfile: true
          }
        });
      });
    } catch (error) {
      handleUploadError(error);
    }
  }

  // Add method to remove an image
  async removeImage(quoteId: string, publicId: string): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        const image = await tx.quoteImage.findFirst({
          where: { quoteId, publicId }
        });

        if (!image) {
          throw new AppError("Image not found", "IMAGE_NOT_FOUND", 404);
        }

        // Delete from storage and database
        const deleted = await deleteImage(publicId);
        if (!deleted) {
          throw new AppError("Failed to delete image from storage", "IMAGE_DELETE_FAILED", 500);
        }

        await tx.quoteImage.delete({
          where: { id: image.id }
        });

        // Update quote if needed
        if (image.isActive) {
          await tx.quote.update({
            where: { id: quoteId },
            data: { backgroundImage: null }
          });
        }

        return tx.quote.findUniqueOrThrow({
          where: { id: quoteId },
          include: {
            images: true,
            category: true,
            authorProfile: true
          }
        });
      });
    } catch (error) {
      handleDeleteError(error);
    }
  }

  // Add method to set background image
  async setBackgroundImage(quoteId: string, imageUrl: string | null): Promise<Quote> {
    try {
      return await db.$transaction(async (tx) => {
        // Reset all images to not active
        await tx.quoteImage.updateMany({
          where: { quoteId },
          data: { isActive: false }
        });

        if (imageUrl) {
          // Set the selected image as active
          await tx.quoteImage.updateMany({
            where: { quoteId, url: imageUrl },
            data: { isActive: true }
          });
        }

        // Update quote's background image
        return tx.quote.update({
          where: { id: quoteId },
          data: { backgroundImage: imageUrl },
          include: {
            images: true,
            category: true,
            authorProfile: true
          }
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to set background image", "INTERNAL_ERROR", 500);
    }
  }
}

export const quoteService = new QuoteServiceImpl();