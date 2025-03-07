// app/api/cron/trending-quotes/route.ts
import { NextResponse } from "next/server";
import { updateTrendingQuotes } from "@/lib/tasks/trending-quotes-scheduler";

// This header is required to prevent CSRF attacks
export const dynamic = "force-dynamic";

// Set maximum duration for the API route
export const maxDuration = 60; // 5 minutes max execution time

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
    // Run the trending quotes update
    const result = await updateTrendingQuotes();
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.message, 
          details: result.error 
        },
        { status: result.error?.statusCode || 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      quotesCount: result.quotesCount,
      timestamp: new Date().toISOString()
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