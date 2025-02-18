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
import type { QuoteErrorCode } from "@/types/api/quotes";
import type { QuoteImage, Quote, Prisma } from "@prisma/client";

// Define the type for the database item including relations
type QuoteImageWithRelations = QuoteImage & {
  quote: Pick<Quote, 'id' | 'slug'>;
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
function transformToMediaLibraryItem(item: QuoteImageWithRelations): MediaLibraryItem {
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

// GET endpoint for fetching media library items
export async function GET(req: Request): Promise<NextResponse<MediaLibraryResponse>> {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<MediaLibraryResponse>(
        { 
          error: { 
            code: "UNAUTHORIZED" as QuoteErrorCode, 
            message: "Not authenticated" 
          } 
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    // Enhanced pagination with validation
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    // Enhanced sorting
    const sortField = (searchParams.get("sortField") || "createdAt") as MediaLibrarySortField;
    const sortDirection = (searchParams.get("sortDirection") || "desc") as SortDirection;

    // Build where conditions according to Prisma's types
    const conditions: Prisma.QuoteImageWhereInput[] = [];

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
    const where: Prisma.QuoteImageWhereInput = conditions.length 
      ? { AND: conditions }
      : {};

    // Execute optimized queries
    const [items, total] = await Promise.all([
      db.quoteImage.findMany({
        where,
        orderBy: buildSortOrder(sortField, sortDirection),
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

    // Transform items to match MediaLibraryItem interface
    const transformedItems = items.map(transformToMediaLibraryItem);

    return NextResponse.json<MediaLibraryResponse>({
      items: transformedItems,
      total,
      hasMore: total > skip + items.length,
      page,
      limit
    });

  } catch (error) {
    console.error("[MEDIA_LIBRARY_GET]", error);
    return NextResponse.json<MediaLibraryResponse>(
      { 
        error: { 
          code: "INTERNAL_ERROR" as QuoteErrorCode, 
          message: "Internal server error" 
        } 
      },
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
        { 
          error: { 
            code: "UNAUTHORIZED" as QuoteErrorCode, 
            message: "Not authenticated" 
          } 
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, title, description, altText, isGlobal } = body;

    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Image ID is required" } },
        { status: 400 }
      );
    }

    const updatedImage = await db.quoteImage.update({
      where: { id },
      data: {
        title,
        description,
        altText,
        isGlobal,
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
      { 
        error: { 
          code: "INTERNAL_ERROR" as QuoteErrorCode, 
          message: "Internal server error" 
        } 
      },
      { status: 500 }
    );
  }
}