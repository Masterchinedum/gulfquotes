// app/api/cron/trending-quotes/route.ts
import { NextResponse } from "next/server";
import { trendingQuoteService } from "@/lib/services/trending-quote.service";
import { revalidatePath } from "next/cache";

// This header is required to prevent CSRF attacks
export const dynamic = "force-dynamic";

// Set maximum duration for the API route
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Validate the cron request
  const authHeader = request.headers.get("authorization");
  
  if (process.env.NODE_ENV === "production") {
    const expectedToken = process.env.CRON_SECRET_KEY;
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    // Calculate new trending quotes
    const trendingQuotes = await trendingQuoteService.calculateTrendingQuotes();
    
    // Revalidate the paths that display trending quotes
    revalidatePath("/");
    revalidatePath("/api/quotes/trending");
    
    return NextResponse.json({
      success: true,
      message: "Trending quotes updated successfully",
      timestamp: new Date().toISOString(),
      quotesCount: trendingQuotes.length
    });
  } catch (error) {
    console.error("[TRENDING_QUOTES_CRON]", error);
    
    return NextResponse.json(
      { 
        error: "Failed to update trending quotes", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}