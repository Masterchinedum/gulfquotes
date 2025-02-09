import { AuthorProfile, Prisma } from "@prisma/client";
import { 
  AuthorProfileService, 
  AuthorProfileListParams, 
  AuthorProfileListResponse 
} from "./interfaces/author-profile-service.interface";
import { CreateAuthorProfileInput, UpdateAuthorProfileInput, validateInfluences } from "@/schemas/author-profile";
import { slugify } from "@/lib/utils";
import db from "@/lib/prisma";
import { 
  AuthorProfileNotFoundError,
  DuplicateAuthorProfileError,
  InvalidAuthorProfileDataError
} from "./errors/author-profile.errors";

class AuthorProfileServiceImpl implements AuthorProfileService {
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

  async create(data: CreateAuthorProfileInput): Promise<AuthorProfile> {
    try {
      const slug = data.slug || slugify(data.name);
      await this.validateSlug(slug);

      if (data.influences) {
        validateInfluences(data.influences);
      }

      return await db.$transaction(async (tx) => {
        return tx.authorProfile.create({
          data: {
            ...data,
            slug,
          },
        });
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

      if (data.name || data.slug) {
        const newSlug = data.slug || (data.name ? slugify(data.name) : existing.slug);
        await this.validateSlug(newSlug, id);
        data.slug = newSlug;
      }

      if (data.influences) {
        validateInfluences(data.influences);
      }

      return await db.authorProfile.update({
        where: { id },
        data,
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
      return await db.authorProfile.delete({
        where: { id },
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

  async getById(id: string): Promise<AuthorProfile | null> {
    return db.authorProfile.findUnique({
      where: { id },
    });
  }

  async getBySlug(slug: string): Promise<AuthorProfile | null> {
    return db.authorProfile.findUnique({
      where: { slug },
    });
  }

  async list(params: AuthorProfileListParams): Promise<AuthorProfileListResponse> {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [items, total] = await Promise.all([
      db.authorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      db.authorProfile.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: total > skip + items.length,
    };
  }
}

export const authorProfileService = new AuthorProfileServiceImpl();