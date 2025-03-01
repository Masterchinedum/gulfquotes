import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import db from "@/lib/prisma";
import { quoteBookmarkService } from "@/lib/services/bookmark";

/**
 * GET handler to check if a quote is bookmarked by the current user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get the user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the quote by slug
    const quote = await db.quote.findUnique({
      where: { slug: params.slug },
      select: { id: true, bookmarks: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Check if the user has bookmarked this quote
    const bookmarked = await quoteBookmarkService.getBookmarkStatus(
      quote.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        bookmarked,
        bookmarks: quote.bookmarks,
      }
    });
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to get bookmark status" },
      { status: 500 }
    );
  }
}

/**
 * POST handler to toggle bookmark status
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get the user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the quote by slug
    const quote = await db.quote.findUnique({
      where: { slug: params.slug },
      select: { id: true }
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Toggle bookmark status
    const result = await quoteBookmarkService.toggleBookmark(
      quote.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        bookmarked: result.bookmarked,
        bookmarks: result.bookmarks
      }
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to toggle bookmark status" },
      { status: 500 }
    );
  }
}