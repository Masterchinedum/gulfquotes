'use server'

import { auth } from "@/auth";
import db from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { createTagSchema, updateTagSchema } from "@/schemas/tag";
import type { Tag, Prisma } from "@prisma/client"; // Add Prisma import here
import type { ListTagsParams } from "@/types/api/tags";

// Error handling function
function handleActionError(error: unknown): never {
  console.error("[TAG_ACTION]", error);
  throw new Error(error instanceof Error ? error.message : "Something went wrong");
}

// Create a new tag
export async function createTag(name: string): Promise<Tag> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
      throw new Error("Permission denied");
    }

    // Validate input
    const validatedData = createTagSchema.safeParse({ name });
    if (!validatedData.success) {
      throw new Error(validatedData.error.errors[0].message);
    }

    const normalizedName = validatedData.data.name.trim();
    
    // Check for duplicates (case insensitive)
    const existingTag = await db.tag.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' }
      }
    });

    if (existingTag) {
      throw new Error("Tag already exists");
    }

    return await db.tag.create({
      data: {
        name: normalizedName,
        slug: slugify(normalizedName)
      }
    });

  } catch (error) {
    handleActionError(error);
  }
}

// Search/suggest tags
export async function searchTags(params: ListTagsParams) {
  try {
    const { search, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    // Build where condition for search
    const where: Prisma.TagWhereInput = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Execute queries in parallel
    const [tags, total] = await Promise.all([
      db.tag.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { quotes: true }
          }
        }
      }),
      db.tag.count({ where })
    ]);

    return {
      items: tags.map(tag => ({
        ...tag,
        quoteCount: tag._count.quotes
      })),
      total,
      page,
      limit,
      hasMore: total > skip + tags.length
    };

  } catch (error) {
    handleActionError(error);
  }
}

// Update a tag
export async function updateTag(id: string, data: { name: string }): Promise<Tag> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (session.user.role !== "ADMIN") {
      throw new Error("Permission denied");
    }

    // Validate input
    const validatedData = updateTagSchema.safeParse(data);
    if (!validatedData.success) {
      throw new Error(validatedData.error.errors[0].message);
    }

    // Add null check for name
    if (!validatedData.data.name) {
      throw new Error("Tag name is required");
    }

    const normalizedName = validatedData.data.name.trim();

    // Check for duplicates (case insensitive)
    const existingTag = await db.tag.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' },
        NOT: { id }
      }
    });

    if (existingTag) {
      throw new Error("Tag with this name already exists");
    }

    return await db.tag.update({
      where: { id },
      data: {
        name: normalizedName,
        slug: slugify(normalizedName)
      }
    });

  } catch (error) {
    handleActionError(error);
  }
}

// Delete a tag
export async function deleteTag(id: string): Promise<Tag> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (session.user.role !== "ADMIN") {
      throw new Error("Permission denied");
    }

    // Check if tag is in use
    const tagWithCount = await db.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quotes: true }
        }
      }
    });

    if (!tagWithCount) {
      throw new Error("Tag not found");
    }

    if (tagWithCount._count.quotes > 0) {
      throw new Error("Cannot delete tag that is still in use");
    }

    return await db.tag.delete({
      where: { id }
    });

  } catch (error) {
    handleActionError(error);
  }
}