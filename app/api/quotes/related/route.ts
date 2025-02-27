import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import type { Quote, Category, AuthorProfile } from "@prisma/client";

interface RelatedQuoteResponse {
  data?: {
    quotes: Array<Quote & {
      category: Category;
      authorProfile: AuthorProfile;
    }>;
    total: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function GET(
  req: Request
): Promise<NextResponse<RelatedQuoteResponse>> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    
    // Required parameters
    const categoryId = searchParams.get("categoryId");
    const currentQuoteId = searchParams.get("currentQuoteId");
    
    // Optional parameters with defaults
    const limit = Math.min(10, Math.max(1, Number(searchParams.get("limit")) || 3));
    
    // Validate required parameters
    if (!categoryId) {
      return NextResponse.json(
        { error: { code: "MISSING_PARAMETER", message: "categoryId is required" } },
        { status: 400 }
      );
    }

    if (!currentQuoteId) {
      return NextResponse.json(
        { error: { code: "MISSING_PARAMETER", message: "currentQuoteId is required" } },
        { status: 400 }
      );
    }

    // Query for related quotes (same category, excluding current quote)
    const relatedQuotes = await db.quote.findMany({
      where: {
        categoryId,
        id: {
          not: currentQuoteId
        }
      },
      include: {
        category: true,
        authorProfile: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });

    // Count total matching quotes (for pagination if needed later)
    const total = await db.quote.count({
      where: {
        categoryId,
        id: {
          not: currentQuoteId
        }
      }
    });

    // Return the related quotes
    return NextResponse.json({
      data: {
        quotes: relatedQuotes,
        total
      }
    });

  } catch (error) {
    console.error("[RELATED_QUOTES_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}