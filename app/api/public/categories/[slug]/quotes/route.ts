// app/api/public/categories/[slug]/quotes/route.ts
import { NextResponse } from "next/server";
import { quoteCategoryService } from "@/lib/services/public-quote/quote-category.service";
import { AppError } from "@/lib/api-error";
import { auth } from "@/auth";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Extract slug from URL
    const slug = req.url.split('/categories/')[1]?.split('/')[0];
    const url = new URL(req.url);
    const session = await auth();
    
    // Parse query parameters with default values
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);
    const sortBy = url.searchParams.get("sort") || "recent";
    
    // Get the user ID if authenticated (optional)
    const userId = session?.user?.id;
    
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Category slug is required" } },
        { status: 400 }
      );
    }

    // Get quotes by category
    const result = await quoteCategoryService.getQuotesByCategory({
      slug,
      page,
      limit,
      sortBy: sortBy as "recent" | "popular" | "alphabetical",
      userId
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[PUBLIC_GET_QUOTES_BY_CATEGORY]', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}