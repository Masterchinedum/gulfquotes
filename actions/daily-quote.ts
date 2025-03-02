"use server";

import { auth } from "@/auth";
import { AppError } from "@/lib/api-error";
import { dailyQuoteService } from "@/lib/services/daily-quote";
import { QuoteDisplayData } from "@/lib/services/public-quote/quote-display.service";
import { revalidatePath } from "next/cache";

/**
 * Response interface for daily quote actions
 */
interface DailyQuoteActionResponse {
  data?: {
    quote: QuoteDisplayData;
    expiration: Date;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Get the current daily quote
 */
export async function getDailyQuote(): Promise<DailyQuoteActionResponse> {
  try {
    const quote = await dailyQuoteService.getCurrentDailyQuote();
    const dailyQuoteRecord = await dailyQuoteService.getActiveRecord();

    if (!dailyQuoteRecord) {
      throw new AppError("Failed to get daily quote record", "NOT_FOUND", 404);
    }

    return {
      data: {
        quote,
        expiration: dailyQuoteRecord.expirationDate,
      },
    };
  } catch (error) {
    console.error("[ACTION_DAILY_QUOTE_GET]", error);
    
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
  }
}

/**
 * Admin-only: Manually select a new daily quote
 */
export async function selectNewDailyQuote(): Promise<DailyQuoteActionResponse> {
  try {
    // Check authentication and permissions
    const session = await auth();
    
    if (!session?.user) {
      return {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
    }

    // Only admins can manually select new daily quotes
    if (session.user.role !== "ADMIN") {
      return {
        error: {
          code: "FORBIDDEN",
          message: "Admin permissions required",
        },
      };
    }

    // Force select a new daily quote
    const quote = await dailyQuoteService.selectNewDailyQuote();
    const dailyQuoteRecord = await dailyQuoteService.getActiveRecord();

    if (!dailyQuoteRecord) {
      throw new AppError("Failed to get daily quote record", "NOT_FOUND", 404);
    }

    // Revalidate relevant paths
    revalidatePath("/");
    revalidatePath("/daily");
    revalidatePath("/api/daily-quote");

    return {
      data: {
        quote,
        expiration: dailyQuoteRecord.expirationDate,
      },
    };
  } catch (error) {
    console.error("[ACTION_DAILY_QUOTE_SELECT]", error);
    
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
  }
}

/**
 * Get daily quote history
 * @param limit - Maximum number of records to fetch (default: 30)
 */
export async function getDailyQuoteHistory(limit = 30): Promise<{
  data?: { history: Awaited<ReturnType<typeof dailyQuoteService.getQuoteHistory>> };
  error?: { code: string; message: string };
}> {
  try {
    const history = await dailyQuoteService.getQuoteHistory(limit);
    
    return {
      data: { history },
    };
  } catch (error) {
    console.error("[ACTION_DAILY_QUOTE_HISTORY]", error);
    
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
  }
}