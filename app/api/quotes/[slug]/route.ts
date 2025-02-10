// app/api/quotes/[slug]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateQuoteSchema } from "@/schemas/quote";
import { quoteService } from "@/lib/services/quote.service";
import { AppError } from "@/lib/api-error";
import type { QuoteResponse, UpdateQuoteResponse } from "@/types/api/quotes";
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
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Only ADMINs or AUTHORS can update quotes
    if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Permission denied" } },
        { status: 403 }
      );
    }

    // Extract slug from URL like author profiles
    const slug = req.url.split('/quotes/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid quote slug" } },
        { status: 400 }
      );
    }

    // Get the existing quote first
    const existingQuote = await quoteService.getBySlug(slug);
    if (!existingQuote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateQuoteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: formatZodError(validatedData.error).details // Remove .error
          }
        },
        { status: 400 }
      );
    }

    try {
      // Update the quote
      const updatedQuote = await quoteService.update(existingQuote.id, validatedData.data);
      return NextResponse.json({ data: updatedQuote });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
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