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
    console.log("[QUOTE_GET] Starting GET request");
    await validateAuth();
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    console.log("[QUOTE_GET] Extracted slug:", slug);
    const quote = await getQuoteFromSlug(slug);
    console.log("[QUOTE_GET] Found quote:", quote);
    return NextResponse.json({ data: quote });
  } catch (error) {
    console.error("[QUOTE_GET] Error:", error);
    return handleApiError(error, "QUOTE_GET");
  }
}

// PATCH endpoint for updating quotes
export async function PATCH(req: Request): Promise<NextResponse<UpdateQuoteResponse>> {
  try {
    console.log("[QUOTE_PATCH] Starting PATCH request");
    const session = await validateAuth();
    console.log("[QUOTE_PATCH] Auth validated:", { userId: session.user.id, role: session.user.role });

    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    console.log("[QUOTE_PATCH] Extracted slug:", slug);
    const existingQuote = await getQuoteFromSlug(slug);
    console.log("[QUOTE_PATCH] Found existing quote:", { id: existingQuote.id, slug: existingQuote.slug });

    validateQuoteAccess(existingQuote, session.user.id, session.user.role);
    console.log("[QUOTE_PATCH] Access validated");

    const body = await req.json();
    console.log("[QUOTE_PATCH] Request body:", body);

    const validatedData = updateQuoteSchema.safeParse(body);
    if (!validatedData.success) {
      console.log("[QUOTE_PATCH] Validation failed:", validatedData.error);
      return NextResponse.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: formatZodError(validatedData.error).details
        }
      }, { status: 400 });
    }

    const updateData: UpdateQuoteInput = validatedData.data;
    console.log("[QUOTE_PATCH] Data validated successfully");

    try {
      console.log("[QUOTE_PATCH] Starting transaction");
      const finalQuote = await db.$transaction(async (tx) => {
        console.log("[QUOTE_PATCH] Updating basic quote data");
        const updatedQuote = await tx.quote.update({
          where: { id: existingQuote.id },
          data: {
            content: updateData.content,
            slug: updateData.slug,
            categoryId: updateData.categoryId,
            authorProfileId: updateData.authorProfileId,
            backgroundImage: updateData.backgroundImage,
            tags: updateData.tags ? {
              connect: updateData.tags.connect,
              disconnect: updateData.tags.disconnect
            } : undefined
          },
          include: {
            category: true,
            authorProfile: true,
            tags: true,
            gallery: {
              include: {
                gallery: true
              }
            }
          }
        });
        console.log("[QUOTE_PATCH] Basic quote update completed:", { id: updatedQuote.id });

        if (updateData.galleryImages?.length) {
          console.log("[QUOTE_PATCH] Starting gallery images update");
          
          console.log("[QUOTE_PATCH] Fetching gallery items");
          const galleryItems = await tx.gallery.findMany({
            where: {
              id: {
                in: updateData.galleryImages.map(img => img.id)
              }
            }
          });
          console.log("[QUOTE_PATCH] Found gallery items:", galleryItems.length);

          if (galleryItems.length !== updateData.galleryImages.length) {
            console.log("[QUOTE_PATCH] Gallery items mismatch", {
              expected: updateData.galleryImages.length,
              found: galleryItems.length
            });
            throw new AppError("Some gallery images not found", "GALLERY_NOT_FOUND", 404);
          }
          
          console.log("[QUOTE_PATCH] Deleting existing gallery associations");
          await tx.quoteToGallery.deleteMany({
            where: { quoteId: existingQuote.id }
          });

          console.log("[QUOTE_PATCH] Creating new gallery associations");
          await tx.quoteToGallery.createMany({
            data: updateData.galleryImages.map(img => ({
              quoteId: existingQuote.id,
              galleryId: img.id,
              isActive: img.isActive,
              isBackground: img.isBackground
            }))
          });

          console.log("[QUOTE_PATCH] Fetching final quote state");
          const finalQuoteWithGallery = await tx.quote.findUnique({
            where: { id: updatedQuote.id },
            include: {
              category: true,
              authorProfile: true,
              tags: true,
              gallery: {
                include: {
                  gallery: true
                }
              }
            }
          });

          if (!finalQuoteWithGallery) {
            console.log("[QUOTE_PATCH] Failed to fetch final quote state");
            throw new AppError("Failed to retrieve updated quote", "NOT_FOUND", 404);
          }

          console.log("[QUOTE_PATCH] Gallery update completed successfully");
          return finalQuoteWithGallery;
        }

        console.log("[QUOTE_PATCH] No gallery updates needed");
        return updatedQuote;
      });

      console.log("[QUOTE_PATCH] Transaction completed successfully");
      console.log("[QUOTE_PATCH] Final quote data:", finalQuote);
      
      return NextResponse.json({ data: finalQuote });
    } catch (error: unknown) {  // Add type annotation here
      console.error("[QUOTE_PATCH] Transaction failed. Error details:", {
        name: error instanceof Error ? error.name : 'Unknown Error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new AppError("Failed to update quote", "INTERNAL_ERROR", 500);
    }
  } catch (error: unknown) {  // Add type annotation here
    console.error("[QUOTE_PATCH] Update failed. Error details:", {
      name: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    });
    return handleApiError(error, "QUOTE_PATCH");
  }
}

// DELETE endpoint for removing quotes
export async function DELETE(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    console.log("[QUOTE_DELETE] Starting DELETE request");
    const session = await validateAuth();
    console.log("[QUOTE_DELETE] Auth validated:", { userId: session.user.id, role: session.user.role });
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    console.log("[QUOTE_DELETE] Extracted slug:", slug);
    const quote = await getQuoteFromSlug(slug);
    console.log("[QUOTE_DELETE] Found quote:", { id: quote.id, slug: quote.slug });
    
    // Check permissions
    validateQuoteAccess(quote, session.user.id, session.user.role);
    console.log("[QUOTE_DELETE] Access validated");

    // Delete the quote
    const deletedQuote = await quoteService.delete(quote.id);
    console.log("[QUOTE_DELETE] Quote deleted:", deletedQuote);
    return NextResponse.json({ data: deletedQuote });
  } catch (error) {
    console.error("[QUOTE_DELETE] Error:", error);
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