import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { quoteBookmarkService } from "@/lib/services/bookmark";
import { AppError } from "@/lib/api-error";
import type { QuoteErrorCode } from "@/types/api/quotes";

// Define response types
interface BookmarkResponse {
  data?: {
    bookmarked: boolean;
    bookmarks: number;
  };
  error?: {
    code: QuoteErrorCode;
    message: string;
  };
}

/**
 * GET handler to check if a quote is bookmarked by the current user
 */
export async function GET(req: NextRequest): Promise<NextResponse<BookmarkResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
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

    // Get the quote by slug
    const quote = await db.quote.findUnique({
      where: { slug },
      select: { id: true, bookmarks: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Check if the user has bookmarked this quote
    const bookmarked = await quoteBookmarkService.getBookmarkStatus(
      quote.id,
      session.user.id
    );

    return NextResponse.json({
      data: {
        bookmarked,
        bookmarks: quote.bookmarks
      }
    });
  } catch (error) {
    console.error("[BOOKMARK_GET]", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

/**
 * POST handler to toggle bookmark status
 */
export async function POST(req: NextRequest): Promise<NextResponse<BookmarkResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
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

    // Get the quote by slug
    const quote = await db.quote.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Quote not found" } },
        { status: 404 }
      );
    }

    // Toggle bookmark status
    const result = await quoteBookmarkService.toggleBookmark(
      quote.id,
      session.user.id
    );

    return NextResponse.json({
      data: {
        bookmarked: result.bookmarked,
        bookmarks: result.bookmarks
      }
    });
  } catch (error) {
    console.error("[BOOKMARK_POST]", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code as QuoteErrorCode, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}