// app/api/tags/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { createTagSchema } from "@/schemas/tag"; // We'll create this next
import type { TagsResponse, TagResponse } from "@/types/api/tags"; // We'll create this next
import { Prisma } from "@prisma/client";

// GET endpoint to fetch all tags with optional search
export async function GET(
  req: Request
): Promise<NextResponse<TagsResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    // Build where condition for search
    const where: Prisma.TagWhereInput = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { slug: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
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

    return NextResponse.json({
      data: {
        items: tags.map(tag => ({
          ...tag,
          quoteCount: tag._count.quotes
        })),
        total,
        page,
        limit,
        hasMore: total > skip + tags.length
      }
    });

  } catch (error) {
    console.error("[TAGS_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new tag
export async function POST(
  req: Request
): Promise<NextResponse<TagResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Only ADMINs or AUTHORS can create tags
    if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createTagSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validatedData.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }

    // Normalize the tag name to prevent duplicates
    const normalizedName = validatedData.data.name.trim();

    // Check for existing tag with case-insensitive match
    const existingTag = await db.tag.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' }
      }
    });

    if (existingTag) {
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE_TAG",
            message: "Tag already exists"
          }
        },
        { status: 400 }
      );
    }

    // Create new tag
    const tag = await db.tag.create({
      data: {
        name: normalizedName,
        slug: slugify(normalizedName)
      }
    });

    return NextResponse.json({ data: tag });

  } catch (error) {
    console.error("[TAGS_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a tag
export async function DELETE(
  req: Request
): Promise<NextResponse<TagResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Only ADMIN can delete tags
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    // Extract tag ID from the URL
    const tagId = req.url.split('/tags/')[1];
    if (!tagId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Tag ID is required" } },
        { status: 400 }
      );
    }

    // Check if tag exists and can be deleted
    const tagWithCount = await db.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { quotes: true }
        }
      }
    });

    if (!tagWithCount) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Tag not found" } },
        { status: 404 }
      );
    }

    if (tagWithCount._count.quotes > 0) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Cannot delete tag that is still in use" } },
        { status: 400 }
      );
    }

    // Delete the tag
    const deletedTag = await db.tag.delete({
      where: { id: tagId }
    });

    return NextResponse.json({ data: deletedTag });

  } catch (error) {
    console.error("[TAGS_DELETE]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}