import { AuthorProfile, Prisma } from "@prisma/client";
import { 
  AuthorProfileService, 
  AuthorProfileListParams, 
  AuthorProfileListResponse 
} from "./interfaces/author-profile-service.interface";
import { CreateAuthorProfileInput, UpdateAuthorProfileInput } from "@/schemas/author-profile";
import { slugify } from "@/lib/utils";
import db from "@/lib/prisma";
import { 
  AuthorProfileNotFoundError,
  DuplicateAuthorProfileError,
  ImageDeleteError,
  MaxImagesExceededError
} from "./errors/author-profile.errors";
import { deleteImage } from "@/lib/cloudinary";

class AuthorProfileServiceImpl implements AuthorProfileService {
  private readonly MAX_IMAGES = 5;

  private async validateSlug(slug: string, excludeId?: string): Promise<void> {
    const existing = await db.authorProfile.findFirst({
      where: {
        slug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (existing) {
      throw new DuplicateAuthorProfileError("An author with similar name already exists");
    }
  }

  private async handleImageDeletion(imageId: string): Promise<void> {
    try {
      const image = await db.authorImage.findUnique({
        where: { id: imageId }
      });

      if (!image) return;

      // Delete from Cloudinary
      const success = await deleteImage(image.url);
      if (!success) {
        throw new ImageDeleteError();
      }

      // Delete from database
      await db.authorImage.delete({
        where: { id: imageId }
      });
    } catch {  // Remove the unused error parameter
      throw new ImageDeleteError();
    }
  }

  private async validateImagesCount(authorId: string, newImagesCount: number): Promise<void> {
    const currentImagesCount = await db.authorImage.count({
      where: { authorProfileId: authorId }
    });

    if (currentImagesCount + newImagesCount > this.MAX_IMAGES) {
      throw new MaxImagesExceededError();
    }
  }

  async create(data: CreateAuthorProfileInput): Promise<AuthorProfile> {
    try {
      const slug = data.slug || slugify(data.name);
      await this.validateSlug(slug);

      // Handle images if provided
      if (data.images && data.images.length > 0) {
        await this.validateImagesCount("", data.images.length);
      }

      return await db.$transaction(async (tx) => {
        // Create author profile
        const profile = await tx.authorProfile.create({
          data: {
            name: data.name,
            born: data.born,
            died: data.died,
            influences: data.influences,
            bio: data.bio,
            slug,
          },
        });

        // Create images if provided
        if (data.images && data.images.length > 0) {
          await tx.authorImage.createMany({
            data: data.images.map((image) => ({
              url: image.url,
              authorProfileId: profile.id,
            })),
          });
        }

        return profile;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new DuplicateAuthorProfileError();
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateAuthorProfileInput): Promise<AuthorProfile> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        throw new AuthorProfileNotFoundError();
      }

      // Handle slug updates
      if (data.name || data.slug) {
        const newSlug = data.slug || (data.name ? slugify(data.name) : existing.slug);
        await this.validateSlug(newSlug, id);
        data.slug = newSlug;
      }

      // Handle image updates if provided
      if (data.images) {
        await this.validateImagesCount(id, data.images.length);
      }

      return await db.$transaction(async (tx) => {
        // Update basic profile data
        const profile = await tx.authorProfile.update({
          where: { id },
          data: {
            name: data.name,
            born: data.born,
            died: data.died,
            influences: data.influences,
            bio: data.bio,
            slug: data.slug,
          },
        });

        // Update images if provided
        if (data.images) {
          // Delete existing images
          await tx.authorImage.deleteMany({
            where: { authorProfileId: id }
          });

          // Create new images
          if (data.images.length > 0) {
            await tx.authorImage.createMany({
              data: data.images.map((image) => ({
                url: image.url,
                authorProfileId: id,
              })),
            });
          }
        }

        return profile;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AuthorProfileNotFoundError();
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<AuthorProfile> {
    try {
      // Get all images before deletion
      const images = await db.authorImage.findMany({
        where: { authorProfileId: id }
      });

      // Delete the profile and its images from the database
      const deletedProfile = await db.$transaction(async (tx) => {
        await tx.authorImage.deleteMany({
          where: { authorProfileId: id }
        });

        return tx.authorProfile.delete({
          where: { id },
        });
      });

      // Delete images from Cloudinary after successful database deletion
      await Promise.all(
        images.map(image => this.handleImageDeletion(image.id))
      );

      return deletedProfile;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AuthorProfileNotFoundError();
        }
      }
      throw error;
    }
  }

  async getById(id: string): Promise<AuthorProfile | null> {
    return db.authorProfile.findUnique({
      where: { id },
      include: {
        images: {
          select: {
            id: true,
            url: true
          }
        }
      }
    });
  }

  async getBySlug(slug: string): Promise<AuthorProfile | null> {
    return db.authorProfile.findUnique({
      where: { slug },
      include: {
        images: {
          select: {
            id: true,
            url: true
          }
        }
      }
    });
  }

  async list(params: AuthorProfileListParams): Promise<AuthorProfileListResponse> {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    // Simpler where clause using string matching
    const whereCondition: Prisma.AuthorProfileWhereInput = search 
      ? {
          OR: [
            { name: { contains: search } },
            { bio: { contains: search } }
          ]
        }
      : {};

    const [items, total] = await Promise.all([
      db.authorProfile.findMany({
        where: whereCondition,
        include: {
          images: {
            select: {
              id: true,
              url: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.authorProfile.count({
        where: whereCondition
      })
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: (page * limit) < total
    };
  }
}

export const authorProfileService = new AuthorProfileServiceImpl();