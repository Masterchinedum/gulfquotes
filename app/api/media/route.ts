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
import type { QuoteImage, Quote } from "@prisma/client";

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
    format: item.format || 'webp',
    width: item.width || 1200,
    height: item.height || 630,
    resource_type: 'image' as const,
    created_at: item.createdAt.toISOString(),
    bytes: item.bytes || 0,
    folder: 'quote-images',
    isGlobal: item.isGlobal,
    title: item.title || undefined,
    description: item.description || undefined,
    altText: item.altText || undefined,
    usageCount: item.usageCount,
    context: {
      quoteId: item.quoteId,
      alt: item.altText || undefined
    }
  };
}

// GET endpoint for fetching media library items
export async function GET(req: Request): Promise<NextResponse<MediaLibraryResponse>> {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Not authenticated" } },
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

    // Enhanced filtering with type safety
    const where = {
      AND: [
        // Basic filters
        searchParams.get("isGlobal") === "true" ? { isGlobal: true } : {},
        
        // Search across multiple fields
        searchParams.get("search")?.trim() ? {
          OR: [
            { title: { contains: searchParams.get("search"), mode: 'insensitive' } },
            { description: { contains: searchParams.get("search"), mode: 'insensitive' } },
            { altText: { contains: searchParams.get("search"), mode: 'insensitive' } },
          ]
        } : {},

        // Usage count range
        Number(searchParams.get("minUsageCount")) ? 
          { usageCount: { gte: Number(searchParams.get("minUsageCount")) } } : {},
        Number(searchParams.get("maxUsageCount")) ? 
          { usageCount: { lte: Number(searchParams.get("maxUsageCount")) } } : {},

        // Format filtering
        searchParams.get("formats") ? 
          { format: { in: searchParams.get("formats")?.split(",") } } : {},

        // Date range filtering
        searchParams.get("createdAfter") ? 
          { createdAt: { gte: new Date(searchParams.get("createdAfter")!) } } : {},
        searchParams.get("createdBefore") ? 
          { createdAt: { lte: new Date(searchParams.get("createdBefore")!) } } : {},
      ].filter(Boolean) // Remove empty conditions
    };

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

    return NextResponse.json({
      items: transformedItems,
      total,
      hasMore: total > skip + items.length,
      page,
      limit
    });

  } catch (error) {
    console.error("[MEDIA_LIBRARY_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating image metadata
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Not authenticated" } },
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

    return NextResponse.json({ data: updatedImage });

  } catch (error) {
    console.error("[MEDIA_LIBRARY_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}