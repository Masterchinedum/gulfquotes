import { NextResponse } from "next/server";
import { selectDailyQuote } from "@/lib/tasks/daily-quote-scheduler";

// This header is required to prevent CSRF attacks - it ensures this endpoint
// can only be called by the Vercel cron job system or with a valid API key
export const dynamic = "force-dynamic";

// Configure the cron job to run daily at 00:00 UTC+4
// Note: Vercel cron jobs use UTC time, so we need to convert UTC+4 to UTC
// UTC+4 midnight is 8:00 PM UTC (20:00 UTC)
export const maxDuration = 60; // 5 minutes max execution time

// Define the cron schedule: run every day at 8:00 PM UTC (midnight UTC+4)
export const schedule = "0 20 * * *";

export async function GET(request: Request) {
  // Validate the cron request or API key to prevent unauthorized access
  // This is important for security, especially if your endpoint can make changes
  const authHeader = request.headers.get("authorization");
  
  // In production, always validate a secret key
  // For development, we'll allow local requests through
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
    // Run the daily quote selection
    const result = await selectDailyQuote();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[DAILY_QUOTE_CRON] Unhandled error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to run daily quote selection", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}