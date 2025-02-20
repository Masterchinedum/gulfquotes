// app/api/media/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { 
  MediaLibraryResponse, 
  MediaLibrarySortField,
  SortDirection,
  MediaLibraryItem
} from "@/types/cloudinary";
import type { Gallery, Quote, Prisma } from "@prisma/client";

// Define the type for the database item including relations
type GalleryWithQuotes = Gallery & {
  quotes: {
    quoteId: string;
    isActive: boolean;
    quote: Pick<Quote, 'id' | 'slug'>;
  }[];
};

// Helper function to build sort order with type safety
function buildSortOrder(field: MediaLibrarySortField, direction: SortDirection) {
  return {
    [field === 'title' ? 'title' : 
     field === 'usageCount' ? 'usageCount' : 
     'createdAt']: direction
  };
}

// Helper to transform database items to MediaLibraryItems
function transformToMediaLibraryItem(item: GalleryWithQuotes): MediaLibraryItem {
  return {
    id: item.id,
    public_id: item.publicId,
    secure_url: item.url,
    format: item.format ?? 'webp',
    width: item.width ?? 1200,
    height: item.height ?? 630,
    resource_type: 'image' as const,
    created_at: item.createdAt.toISOString(),
    bytes: item.bytes ?? 0,
    folder: 'gallery-images',
    isGlobal: item.isGlobal,
    title: item.title ?? undefined,
    description: item.description ?? undefined,
    altText: item.altText ?? undefined,
    usageCount: item.usageCount
  };
}

// GET endpoint for fetching media library items
export async function GET(req: Request): Promise<NextResponse<MediaLibraryResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<MediaLibraryResponse>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    // Pagination with validation
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    // Sort options
    const sortField = (searchParams.get("sortField") || "createdAt") as MediaLibrarySortField;
    const sortDirection = (searchParams.get("sortDirection") || "desc") as SortDirection;

    // Build where conditions
    const conditions: Prisma.GalleryWhereInput[] = [];

    // Add isGlobal filter
    if (searchParams.get("isGlobal") === "true") {
      conditions.push({ isGlobal: true });
    }

    // Add search filter
    const search = searchParams.get("search")?.trim();
    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { altText: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Add usage count filters
    const minUsageCount = Number(searchParams.get("minUsageCount"));
    if (!isNaN(minUsageCount)) {
      conditions.push({ usageCount: { gte: minUsageCount } });
    }

    const maxUsageCount = Number(searchParams.get("maxUsageCount"));
    if (!isNaN(maxUsageCount)) {
      conditions.push({ usageCount: { lte: maxUsageCount } });
    }

    // Add format filter
    const formats = searchParams.get("formats")?.split(",");
    if (formats?.length) {
      conditions.push({ format: { in: formats } });
    }

    // Add date range filters
    const createdAfter = searchParams.get("createdAfter");
    if (createdAfter) {
      conditions.push({ createdAt: { gte: new Date(createdAfter) } });
    }

    const createdBefore = searchParams.get("createdBefore");
    if (createdBefore) {
      conditions.push({ createdAt: { lte: new Date(createdBefore) } });
    }

    // Create the where clause
    const where: Prisma.GalleryWhereInput = conditions.length 
      ? { AND: conditions }
      : {};

    // Execute queries
    const [items, total] = await Promise.all([
      db.gallery.findMany({
        where,
        orderBy: buildSortOrder(sortField, sortDirection),
        skip,
        take: limit,
        include: {
          quotes: {
            include: {
              quote: {
                select: {
                  id: true,
                  slug: true
                }
              }
            }
          }
        }
      }),
      db.gallery.count({ where })
    ]);

    return NextResponse.json<MediaLibraryResponse>({
      items: items.map(transformToMediaLibraryItem),
      total,
      hasMore: total > skip + items.length,
      page,
      limit
    });

  } catch (error) {
    console.error("[MEDIA_LIBRARY_GET]", error);
    return NextResponse.json<MediaLibraryResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating image metadata
export async function PATCH(
  req: Request
): Promise<NextResponse<MediaLibraryResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<MediaLibraryResponse>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, title, description, altText, isGlobal } = body;

    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Image ID is required" } },
        { status: 400 }
      );
    }

    const updatedImage = await db.gallery.update({
      where: { id },
      data: {
        title,
        description,
        altText,
        isGlobal,
      },
      include: {
        quotes: {
          include: {
            quote: {
              select: {
                id: true,
                slug: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json<MediaLibraryResponse>({
      items: [transformToMediaLibraryItem(updatedImage)],
      total: 1,
      hasMore: false,
      page: 1,
      limit: 1
    });

  } catch (error) {
    console.error("[MEDIA_LIBRARY_PATCH]", error);
    return NextResponse.json<MediaLibraryResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}