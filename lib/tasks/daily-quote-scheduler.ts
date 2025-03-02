import { dailyQuoteService } from "@/lib/services/daily-quote";
import { AppError } from "@/lib/api-error";

interface SchedulerError {
  code: string;
  message: string;
  statusCode?: number;
}

/**
 * Selects a new daily quote
 * This function is designed to be called by a scheduled job
 */
export async function selectDailyQuote(): Promise<{
  success: boolean;
  message: string;
  error?: SchedulerError;
}> {
  try {
    console.log("[DAILY_QUOTE_SCHEDULER] Starting daily quote selection");
    
    // Get the current active daily quote to check if we need to select a new one
    const activeRecord = await dailyQuoteService.getActiveRecord();
    
    // If there's an active record that hasn't expired yet, don't select a new one
    if (activeRecord && activeRecord.expirationDate > new Date()) {
      console.log("[DAILY_QUOTE_SCHEDULER] Active quote not expired yet, skipping");
      return {
        success: true,
        message: "Current daily quote is still active, no selection needed"
      };
    }
    
    // Select a new daily quote
    const quote = await dailyQuoteService.selectNewDailyQuote();
    
    console.log("[DAILY_QUOTE_SCHEDULER] Successfully selected new daily quote", {
      id: quote.id,
      author: quote.authorProfile.name
    });
    
    return {
      success: true,
      message: `Successfully selected new daily quote: "${quote.content.substring(0, 30)}..."`
    };
  } catch (error) {
    console.error("[DAILY_QUOTE_SCHEDULER] Failed to select daily quote:", error);
    
    return {
      success: false,
      message: error instanceof AppError 
        ? error.message 
        : "An unexpected error occurred",
      error: error instanceof AppError 
        ? { code: error.code, message: error.message, statusCode: error.statusCode }
        : { code: "INTERNAL_ERROR", message: "An unexpected error occurred" }
    };
  }
}