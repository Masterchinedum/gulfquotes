// app/api/quotes/trending/route.ts
import { NextResponse } from "next/server"; // Remove NextRequest since we don't need it
import { trendingQuoteService } from "@/lib/services/trending-quote.service";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { AppError } from "@/lib/api-error";

// Define response type
interface TrendingQuotesResponse {
  data?: {
    quotes: QuoteDisplayData[];
    updatedAt: string; // ISO string of when trending was last calculated
  };
  error?: {
    code: string;
    message: string;
  };
}

// Enable revalidation every hour
export const revalidate = 3600;

// Add force-dynamic directive to tell Next.js this is a dynamic route
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<TrendingQuotesResponse>> {
  try {
    // Use fixed limit of 6
    const trendingQuotes = await trendingQuoteService.getTrendingQuotes(6);

    return NextResponse.json({
      data: {
        quotes: trendingQuotes,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("[TRENDING_QUOTES_GET]", error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "An unexpected error occurred" 
        } 
      },
      { status: 500 }
    );
  }
}