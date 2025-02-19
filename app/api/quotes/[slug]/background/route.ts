import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { quoteService } from "@/lib/services/quote/quote.service";
import { AppError } from "@/lib/api-error";
import type { QuoteResponse, QuoteErrorCode } from "@/types/api/quotes";

export async function PATCH(
  req: Request
): Promise<NextResponse<QuoteResponse>> {
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

    // Get the quote by slug
    const quote = await quoteService.getBySlug(slug);
    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND" as QuoteErrorCode, message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Parse the request body
    const { imageUrl } = await req.json();

    // Set the background image
    const result = await quoteService.setBackgroundImage(quote.id, imageUrl);

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("[PATCH /api/quotes/[slug]/background]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR" as QuoteErrorCode, message: "Internal server error" } },
      { status: 500 }
    );
  }
}