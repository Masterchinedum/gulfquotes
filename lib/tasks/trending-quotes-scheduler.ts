// lib/tasks/trending-quotes-scheduler.ts
import { trendingQuoteService } from "@/lib/services/trending-quote.service";
import { AppError } from "@/lib/api-error";
import { revalidatePath } from "next/cache";

interface SchedulerError {
  code: string;
  message: string;
  statusCode?: number;
}

interface SchedulerResult {
  success: boolean;
  message: string;
  quotesCount?: number;
  error?: SchedulerError;
}

/**
 * Updates trending quotes list
 * This function is designed to be called by a scheduled job
 */
export async function updateTrendingQuotes(): Promise<SchedulerResult> {
  try {
    console.log("[TRENDING_QUOTES_SCHEDULER] Starting trending quotes update");
    
    // Calculate new trending quotes
    const trendingQuotes = await trendingQuoteService.calculateTrendingQuotes();
    
    // Log success
    console.log("[TRENDING_QUOTES_SCHEDULER] Successfully updated trending quotes", {
      count: trendingQuotes.length,
      timestamp: new Date().toISOString()
    });

    // Revalidate the paths that display trending quotes
    revalidatePath("/");
    revalidatePath("/api/quotes/trending");
    
    return {
      success: true,
      message: "Successfully updated trending quotes",
      quotesCount: trendingQuotes.length
    };
  } catch (error) {
    console.error("[TRENDING_QUOTES_SCHEDULER] Failed to update trending quotes:", error);
    
    return {
      success: false,
      message: error instanceof AppError 
        ? error.message 
        : "An unexpected error occurred while updating trending quotes",
      error: error instanceof AppError 
        ? { 
            code: error.code, 
            message: error.message, 
            statusCode: error.statusCode 
          }
        : { 
            code: "INTERNAL_ERROR", 
            message: "An unexpected error occurred" 
          }
    };
  }
}