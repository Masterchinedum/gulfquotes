// app/api/quotes/featured/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { AppError } from "@/lib/api-error";
import { QuotesResponse, QuoteErrorCode } from "@/types/api/quotes";

/**
 * GET endpoint to fetch featured quotes with pagination
 */
export async function GET(req: Request): Promise<NextResponse<QuotesResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination params with validation
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    
    // Optional filter params
    const categoryId = searchParams.get("categoryId") || undefined;
    const authorProfileId = searchParams.get("authorProfileId") || undefined;

    // Query for featured quotes with Prisma
    const [items, total] = await Promise.all([
      db.quote.findMany({
        where: {
          featured: true,
          ...(categoryId && { categoryId }),
          ...(authorProfileId && { authorProfileId })
        },
        include: {
          authorProfile: true,
          category: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.quote.count({
        where: {
          featured: true,
          ...(categoryId && { categoryId }),
          ...(authorProfileId && { authorProfileId })
        }
      })
    ]);

    // Return response matching QuotesResponseData type
    return NextResponse.json({
      data: {
        data: items,
        total,
        hasMore: total > (page - 1) * limit + items.length,
        page,
        limit
      }
    });

  } catch (error) {
    console.error("[FEATURED_QUOTES_GET]", error);
    
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