//app/api/quotes/[slug]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateQuoteSchema } from "@/schemas/quote";
import { quoteService } from "@/lib/services/quote/quote.service";
import { AppError } from "@/lib/api-error";
import db from "@/lib/prisma";
import { formatZodError } from "@/lib/api-error";
import type { 
  QuoteResponse, 
  UpdateQuoteResponse, 
  QuoteErrorCode,
  UpdateQuoteInput 
} from "@/types/api/quotes";
import type { Quote } from "@prisma/client";

// Helper functions for common operations
async function validateAuth() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.role) {
    throw new AppError("Not authenticated", "UNAUTHORIZED", 401);
  }
  return session as { user: { id: string; role: string } };
}

async function getQuoteFromSlug(slug: string) {
  if (!slug) {
    throw new AppError("Invalid quote slug", "BAD_REQUEST", 400);
  }

  const quote = await quoteService.getBySlug(slug);
  if (!quote) {
    throw new AppError("Quote not found", "NOT_FOUND", 404);
  }

  return quote;
}

function validateQuoteAccess(quote: Quote, userId: string, userRole: string) {
  if (userRole !== "ADMIN" && quote.authorId !== userId) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }
}

// GET endpoint to fetch quote details
export async function GET(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    await validateAuth();
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    const quote = await getQuoteFromSlug(slug);
    return NextResponse.json({ data: quote });
  } catch (error) {
    return handleApiError(error, "QUOTE_GET");
  }
}

// PATCH endpoint for updating quotes
export async function PATCH(req: Request): Promise<NextResponse<UpdateQuoteResponse>> {
  try {
    // Step 1: Authenticate and get user session with guaranteed id and role
    const session = await validateAuth();

    // Step 2: Extract and validate slug
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    const existingQuote = await getQuoteFromSlug(slug);
    
    // Step 3: Check permissions - now TypeScript knows these values exist
    validateQuoteAccess(existingQuote, session.user.id, session.user.role);

    // Step 4: Validate request body
    const body = await req.json();
    const validatedData = updateQuoteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: formatZodError(validatedData.error).details
        }
      }, { status: 400 });
    }

    // Transform the validated data to match UpdateQuoteInput type
    const updateData: UpdateQuoteInput = {
      content: validatedData.data.content,
      slug: validatedData.data.slug,
      categoryId: validatedData.data.categoryId,
      authorProfileId: validatedData.data.authorProfileId,
      backgroundImage: validatedData.data.backgroundImage,
      galleryImages: validatedData.data.galleryImages,
      tags: validatedData.data.tags
    };

    // Step 5: Update quote with transaction for atomicity
    const finalQuote = await db.$transaction(async (tx) => {
      try {
        // Update basic quote information using the typed data
        const updatedQuote = await quoteService.update(existingQuote.id, updateData);

        // Handle gallery images if provided
        if (updateData.galleryImages?.length) {
          // Validate and update gallery images
          const galleryItems = await quoteService.validateGalleryImages(
            updateData.galleryImages
          );

          // Update gallery images and background
          await quoteService.updateGalleryImages(
            existingQuote.id,
            galleryItems,
            updateData.backgroundImage
          );
        }

        // Handle tags updates if provided
        if (validatedData.data.tags?.connect || validatedData.data.tags?.disconnect) {
          await tx.quote.update({
            where: { id: existingQuote.id },
            data: {
              tags: {
                ...(validatedData.data.tags.connect && {
                  connect: validatedData.data.tags.connect.map(id => ({ id }))
                }),
                ...(validatedData.data.tags.disconnect && {
                  disconnect: validatedData.data.tags.disconnect.map(id => ({ id }))
                })
              }
            }
          });
        }

        // Get final quote with all relationships
        const finalQuote = await quoteService.getBySlug(updatedQuote.slug);
        if (!finalQuote) {
          throw new AppError("Failed to retrieve updated quote", "NOT_FOUND", 404);
        }

        return finalQuote;
      } catch (error) {
        // If any operation fails, the transaction will be rolled back
        throw error instanceof AppError ? error : new AppError(
          "Failed to update quote",
          "UPDATE_FAILED",
          500
        );
      }
    });

    return NextResponse.json({ data: finalQuote });
  } catch (error) {
    return handleApiError(error, "QUOTE_PATCH");
  }
}

// DELETE endpoint for removing quotes
export async function DELETE(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await validateAuth();
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    const quote = await getQuoteFromSlug(slug);
    
    // Check permissions
    validateQuoteAccess(quote, session.user.id, session.user.role);

    // Delete the quote
    const deletedQuote = await quoteService.delete(quote.id);
    return NextResponse.json({ data: deletedQuote });
  } catch (error) {
    return handleApiError(error, "QUOTE_DELETE");
  }
}

// Error handling helper
function handleApiError(error: unknown, context: string) {
  if (error instanceof AppError) {
    return NextResponse.json({
      error: {
        code: error.code as QuoteErrorCode,
        message: error.message,
        details: error.details
      }
    }, { status: error.statusCode });
  }

  console.error(`[${context}]`, error);
  return NextResponse.json({
    error: { 
      code: "INTERNAL_ERROR" as QuoteErrorCode, 
      message: "Internal server error" 
    }
  }, { status: 500 });
}