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
    console.error("[QUOTE_GET] Error:", error);
    return handleApiError(error, "QUOTE_GET");
  }
}

// PATCH endpoint for updating quotes
export async function PATCH(req: Request): Promise<NextResponse<UpdateQuoteResponse>> {
  try {
    const session = await validateAuth();
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    const existingQuote = await getQuoteFromSlug(slug);
    validateQuoteAccess(existingQuote, session.user.id, session.user.role);

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

    const updateData: UpdateQuoteInput = validatedData.data;

    try {
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

        if (updateData.galleryImages?.length) {
          const galleryItems = await tx.gallery.findMany({
            where: {
              id: {
                in: updateData.galleryImages.map(img => img.id)
              }
            }
          });

          if (galleryItems.length !== updateData.galleryImages.length) {
            throw new AppError("Some gallery images not found", "GALLERY_NOT_FOUND", 404);
          }
          
          await tx.quoteToGallery.deleteMany({
            where: { quoteId: existingQuote.id }
          });

          await tx.quoteToGallery.createMany({
            data: updateData.galleryImages.map(img => ({
              quoteId: existingQuote.id,
              galleryId: img.id,
              isActive: img.isActive,
              isBackground: img.isBackground
            }))
          });

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
            throw new AppError("Failed to retrieve updated quote", "NOT_FOUND", 404);
          }

          return finalQuoteWithGallery;
        }

        return updatedQuote;
      });
      
      return NextResponse.json({ data: finalQuote });
    } catch (error) {
      console.error("[QUOTE_PATCH] Transaction failed:", error);
      throw new AppError("Failed to update quote", "INTERNAL_ERROR", 500);
    }
  } catch (error) {
    console.error("[QUOTE_PATCH] Update failed:", error);
    return handleApiError(error, "QUOTE_PATCH");
  }
}

// DELETE endpoint for removing quotes
export async function DELETE(req: Request): Promise<NextResponse<QuoteResponse>> {
  try {
    const session = await validateAuth();
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    const quote = await getQuoteFromSlug(slug);
    validateQuoteAccess(quote, session.user.id, session.user.role);
    const deletedQuote = await quoteService.delete(quote.id);
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