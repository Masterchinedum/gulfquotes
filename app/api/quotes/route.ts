import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createQuoteSchema } from "@/schemas/quote";
import { CreateQuoteResponse, QuotesResponse, QuoteErrorCode } from "@/types/api/quotes";
import { formatZodError, AppError } from "@/lib/api-error";
import { quoteService } from "@/lib/services/quote/quote.service";
import type { QuoteImageData } from "@/types/cloudinary"; // Add this import

export async function POST(req: Request): Promise<NextResponse<CreateQuoteResponse>> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Unauthorized" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN" as QuoteErrorCode, message: "Permission denied" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createQuoteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: { 
            code: "VALIDATION_ERROR" as QuoteErrorCode, 
            message: "Invalid input data",
            details: formatZodError(validatedData.error).details 
          } 
        },
        { status: 400 }
      );
    }

    try {
      const transformedImages: QuoteImageData[] = validatedData.data.images?.map(img => ({
        url: img.url,
        publicId: img.publicId,
        isActive: img.isActive,
        secure_url: img.url,
        public_id: img.publicId,
        format: 'webp', // Default format
        width: 1200, // Default width for social sharing
        height: 630, // Default height for social sharing
        resource_type: 'image' as const, // Ensure this is a literal type
        created_at: new Date().toISOString(),
        bytes: 0, // This will be updated by Cloudinary
        folder: 'quote-images',
        // Add the new required fields
        isGlobal: false, // New quotes start as non-global
        usageCount: 0, // New images start with 0 usage count
        title: undefined,
        description: undefined,
        altText: undefined
      })) || [];

      const quote = await quoteService.create({
        ...validatedData.data,
        authorId: session.user.id,
        images: transformedImages,
        backgroundImage: validatedData.data.backgroundImage
      });

      return NextResponse.json({ data: quote });

    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { 
              code: error.code as QuoteErrorCode, 
              message: error.message,
              details: error.details 
            } 
          },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[QUOTES_POST]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function GET(req: Request): Promise<NextResponse<QuotesResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination params with validation
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    
    // Filter params
    const search = searchParams.get("search")?.trim();
    const authorId = searchParams.get("authorId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const authorProfileId = searchParams.get("authorProfileId") || undefined;

    // User session for permission checks
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Get quotes with filters
    const result = await quoteService.list({
      page,
      limit,
      search,
      authorId: authorId === "me" ? session.user.id : authorId,
      categoryId,
      authorProfileId,
    });

    // Return response matching QuotesResponseData type
    return NextResponse.json({
      data: {
        data: result.items,  // Notice the nested data property
        total: result.total,
        hasMore: result.hasMore,
        page: result.page,
        limit: result.limit
      }
    });

  } catch (error) {
    console.error("[QUOTES_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}