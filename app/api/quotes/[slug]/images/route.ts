import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { quoteService } from "@/lib/services/quote/quote.service";
import { AppError } from "@/lib/api-error";
import type { QuoteResponse, QuoteErrorCode } from "@/types/api/quotes";
import type { QuoteImageData } from "@/types/cloudinary";

// Define request body types for better type safety
interface AddImagesRequestBody {
  images: Array<QuoteImageData & {
    isActive: boolean;
    isGlobal?: boolean;
  }>;
}

interface RemoveImageRequestBody {
  imageId: string;
}

interface DeleteImageRequestBody {
  publicId: string;
}

// Add images to a quote (can be new uploads or existing images)
export async function POST(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    const quote = await quoteService.getBySlug(slug);
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND" as QuoteErrorCode, message: "Quote not found" } },
        { status: 404 }
      );
    }

    const body = await req.json() as AddImagesRequestBody;
    // Transform the images to include metadata for the global library
    const transformedImages = body.images.map(img => ({
      ...img,
      isGlobal: img.isGlobal ?? false,
      title: img.title,
      description: img.description,
      altText: img.altText,
      usageCount: 0
    }));

    const result = await quoteService.addImages(quote.id, transformedImages);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("[POST /api/quotes/[slug]/images]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Remove image association without deleting the image
export async function PUT(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    const quote = await quoteService.getBySlug(slug);
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND" as QuoteErrorCode, message: "Quote not found" } },
        { status: 404 }
      );
    }

    const { imageId } = await req.json() as RemoveImageRequestBody;
    const result = await quoteService.removeImageAssociation(quote.id, imageId);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("[PUT /api/quotes/[slug]/images]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Delete an image completely
export async function DELETE(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" as QuoteErrorCode, message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST" as QuoteErrorCode, message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    const quote = await quoteService.getBySlug(slug);
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND" as QuoteErrorCode, message: "Quote not found" } },
        { status: 404 }
      );
    }

    const { publicId } = await req.json() as DeleteImageRequestBody;
    const result = await quoteService.removeImage(quote.id, publicId);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("[DELETE /api/quotes/[slug]/images]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}