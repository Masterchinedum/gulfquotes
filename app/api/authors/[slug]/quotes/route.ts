// app/api/authors/[slug]/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { quoteDisplayService } from "@/lib/services/public-quote/quote-display.service";
import { authorProfileService } from "@/lib/services/author-profile.service";
import { AppError } from "@/lib/api-error";
import type { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";

// Define response type with proper typing
interface AuthorQuotesResponse {
  data?: {
    quotes: QuoteDisplayData[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function GET(
  req: NextRequest,
//   { params }: { params: { slug: string } }
): Promise<NextResponse<AuthorQuotesResponse>> {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "10", 10));
    const sortBy = searchParams.get("sort") as 'recent' | 'popular' | 'likes' || 'recent';
    
    // Extract slug from URL for consistency with other routes
    const slug = req.url.split('/authors/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json({ 
        error: { code: "BAD_REQUEST", message: "Invalid author slug" } 
      }, { status: 400 });
    }
    
    // Get authenticated user (if any)
    const session = await auth();
    
    // Get author profile by slug
    const author = await authorProfileService.getBySlug(slug);
    if (!author) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "Author not found" } 
      }, { status: 404 });
    }
    
    // Get quotes by author ID
    const result = await quoteDisplayService.getQuotesByAuthorId(author.id, {
      page,
      limit,
      sortBy,
      userId: session?.user?.id
    });
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[AUTHOR_QUOTES_API]", error);
    
    if (error instanceof AppError) {
      return NextResponse.json({ 
        error: { code: error.code, message: error.message } 
      }, { status: error.statusCode });
    }
    
    return NextResponse.json({ 
      error: { code: "INTERNAL_ERROR", message: "An error occurred while fetching quotes" } 
    }, { status: 500 });
  }
}