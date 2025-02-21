import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateQuoteSchema } from "@/schemas/quote";
import { quoteService } from "@/lib/services/quote/quote.service";
import { AppError } from "@/lib/api-error";
// import db from "@/lib/prisma"; // Add this import
import type { QuoteResponse, UpdateQuoteResponse, QuoteErrorCode } from "@/types/api/quotes";
import { formatZodError } from "@/lib/api-error";

// GET endpoint to fetch quote details
export async function GET(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    const quote = await quoteService.getBySlug(slug);
    
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: quote });
  } catch (error) {
    console.error("[QUOTE_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating quotes
export async function PATCH(req: Request): Promise<NextResponse<UpdateQuoteResponse>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    const existingQuote = await quoteService.getBySlug(slug);
    if (!existingQuote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateQuoteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: { 
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: formatZodError(validatedData.error).details
          } 
        },
        { status: 400 }
      );
    }

    try {
      // First update the quote's basic information
      const updatedQuote = await quoteService.update(existingQuote.id, {
        ...validatedData.data,
        backgroundImage: validatedData.data.backgroundImage
      });

      // If gallery images are provided, validate and update them
      if (validatedData.data.galleryImages?.length) {
        const galleryItems = await quoteService.validateGalleryImages(
          validatedData.data.galleryImages
        );

        await quoteService.updateGalleryImages(
          existingQuote.id,
          galleryItems,
          validatedData.data.backgroundImage
        );
      }

      // Fetch the updated quote with all relationships
      const finalQuote = await quoteService.getBySlug(updatedQuote.slug);
      if (!finalQuote) {
        throw new AppError(
          "Failed to retrieve updated quote",
          "NOT_FOUND",
          404
        );
      }

      return NextResponse.json({ data: finalQuote });

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
    console.error("[QUOTE_PATCH]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}